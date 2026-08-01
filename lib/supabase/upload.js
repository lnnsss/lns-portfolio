"use client";

import * as tus from "tus-js-client";
import { getSupabaseConfig } from "./config";
import { getSupabaseBrowserClient } from "./browser";

export const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const CHUNK_BYTES = 6 * 1024 * 1024;
const WEBP_QUALITY = 0.86;
const SKIP_IMAGE_OPTIMIZATION_TYPES = new Set(["image/webp", "image/svg+xml", "image/gif"]);

function safeFileName(name) {
  return String(name || "file")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function publicUrl(path) {
  const { url } = getSupabaseConfig();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/portfolio-media/${encodedPath}`;
}

function webpFileName(name) {
  return safeFileName(name).replace(/\.[a-z0-9]+$/i, "") + ".webp";
}

function canvasToWebpBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });
}

async function loadImageBitmap(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function optimizeImageForUpload(file) {
  if (
    typeof window === "undefined" ||
    !file?.type?.startsWith("image/") ||
    SKIP_IMAGE_OPTIMIZATION_TYPES.has(file.type)
  ) {
    return file;
  }

  const bitmap = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const blob = await canvasToWebpBlob(canvas);
  if (!blob) return file;

  return new File([blob], webpFileName(file.name), {
    type: "image/webp",
    lastModified: file.lastModified
  });
}

export function validateMediaFile(file, accept = "media") {
  if (!file) return "Файл не выбран";
  if (file.size > MAX_MEDIA_BYTES) return "Файл больше 100 МБ";
  if (accept === "image" && !file.type.startsWith("image/")) return "Нужно выбрать изображение";
  if (accept === "media" && !file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return "Поддерживаются изображения и видео";
  }
  return null;
}

export async function uploadMediaFile(file, { folder = "drafts", accept = "media", onProgress, signal } = {}) {
  const validationError = validateMediaFile(file, accept);
  if (validationError) throw new Error(validationError);
  const uploadFile = await optimizeImageForUpload(file);

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) throw new Error("Сессия истекла. Войди снова.");

  const { url } = getSupabaseConfig();
  const projectRef = new URL(url).hostname.split(".")[0];
  const objectName = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(uploadFile.name)}`;

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Загрузка отменена"));
      return;
    }
    const upload = new tus.Upload(uploadFile, {
      endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: getSupabaseConfig().anonKey
      },
      chunkSize: CHUNK_BYTES,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: "portfolio-media",
        objectName,
        contentType: uploadFile.type || "application/octet-stream",
        cacheControl: "31536000"
      },
      onError(error) {
        signal?.removeEventListener("abort", abortUpload);
        reject(new Error(error?.message || "Не удалось загрузить файл"));
      },
      onProgress(uploaded, total) {
        onProgress?.(total ? Math.round((uploaded / total) * 100) : 0);
      },
      onSuccess() {
        signal?.removeEventListener("abort", abortUpload);
        onProgress?.(100);
        resolve({ path: objectName, url: publicUrl(objectName) });
      }
    });

    function abortUpload() {
      upload.abort().finally(() => reject(new Error("Загрузка отменена")));
    }

    signal?.addEventListener("abort", abortUpload, { once: true });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }).catch(reject);
  });
}

export async function removeMediaByUrl(url) {
  if (!url) return;
  const marker = "/storage/v1/object/public/portfolio-media/";
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  await getSupabaseBrowserClient().storage.from("portfolio-media").remove([path]);
}
