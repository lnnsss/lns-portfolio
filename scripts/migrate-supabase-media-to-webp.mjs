import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function loadEnvFile(path) {
  try {
    const content = await readFile(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadEnvFile(".env.local");
await loadEnvFile(".env");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://grhwypxuulycepbrzwnh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "portfolio-media";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const QUALITY = process.env.WEBP_QUALITY || "82";
const DRY_RUN = process.argv.includes("--dry-run");
const DELETE_ORIGINALS = process.argv.includes("--delete-originals");

const tables = [
  {
    name: "about_slides",
    key: "id",
    select: "id,image_url,position",
    fields: ["image_url"]
  },
  {
    name: "projects",
    key: "slug",
    select: "slug,image_url,gallery,position",
    fields: ["image_url", "gallery"]
  },
  {
    name: "design_archive_items",
    key: "slug",
    select: "slug,image_url,position",
    fields: ["image_url"]
  }
];

if (!SUPABASE_KEY) {
  console.error("Set SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

function apiHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra
  };
}

function isConvertibleUrl(value) {
  return typeof value === "string" && /\.(png|jpe?g)(?:$|[?#])/i.test(value);
}

function storagePathFromUrl(url) {
  const index = String(url || "").indexOf(PUBLIC_MARKER);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + PUBLIC_MARKER.length).split("?")[0]);
}

function publicUrlForPath(path) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

function webpPathForPath(path) {
  return path.slice(0, -extname(path).length) + ".webp";
}

async function getRows(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table.name}?select=${encodeURIComponent(table.select)}&order=position.asc`;
  const response = await fetch(url, { headers: apiHeaders() });
  if (!response.ok) throw new Error(`Failed to read ${table.name}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function updateRow(table, row, patch) {
  const keyValue = encodeURIComponent(row[table.key]);
  const url = `${SUPABASE_URL}/rest/v1/${table.name}?${table.key}=eq.${keyValue}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: apiHeaders({
      "content-type": "application/json",
      prefer: "return=minimal"
    }),
    body: JSON.stringify(patch)
  });
  if (!response.ok) throw new Error(`Failed to update ${table.name}/${row[table.key]}: ${response.status} ${await response.text()}`);
}

async function uploadObject(path, buffer) {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: apiHeaders({
      "content-type": "image/webp",
      "cache-control": "31536000",
      "x-upsert": "true"
    }),
    body: buffer
  });
  if (!response.ok) throw new Error(`Failed to upload ${path}: ${response.status} ${await response.text()}`);
}

async function deleteObjects(paths) {
  if (!paths.length) return;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: apiHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ prefixes: paths })
  });
  if (!response.ok) throw new Error(`Failed to delete originals: ${response.status} ${await response.text()}`);
}

async function convertUrl(url, workspace) {
  const sourcePath = storagePathFromUrl(url);
  if (!sourcePath) throw new Error(`Only ${BUCKET} public URLs are supported: ${url}`);

  const targetPath = webpPathForPath(sourcePath);
  const sourceResponse = await fetch(url);
  if (!sourceResponse.ok) throw new Error(`Failed to download ${url}: ${sourceResponse.status}`);

  const inputPath = join(workspace, basename(sourcePath));
  const outputPath = join(workspace, basename(targetPath));
  await writeFile(inputPath, Buffer.from(await sourceResponse.arrayBuffer()));
  await execFileAsync("cwebp", ["-q", QUALITY, "-m", "6", inputPath, "-o", outputPath]);

  const output = await readFile(outputPath);
  if (!DRY_RUN) await uploadObject(targetPath, output);

  return {
    sourcePath,
    targetPath,
    sourceUrl: url,
    targetUrl: publicUrlForPath(targetPath),
    bytes: output.length
  };
}

async function main() {
  const workspace = await mkdtemp(join(tmpdir(), "portfolio-webp-"));
  const converted = [];

  try {
    for (const table of tables) {
      const rows = await getRows(table);

      for (const row of rows) {
        const patch = {};
        const rowConversions = [];

        if (table.fields.includes("image_url") && isConvertibleUrl(row.image_url)) {
          const conversion = await convertUrl(row.image_url, workspace);
          patch.image_url = conversion.targetUrl;
          rowConversions.push(conversion);
        }

        if (table.fields.includes("gallery") && Array.isArray(row.gallery)) {
          const nextGallery = [];
          for (const item of row.gallery) {
            if (!isConvertibleUrl(item)) {
              nextGallery.push(item);
              continue;
            }
            const conversion = await convertUrl(item, workspace);
            nextGallery.push(conversion.targetUrl);
            rowConversions.push(conversion);
          }
          if (rowConversions.length) patch.gallery = nextGallery;
        }

        if (!rowConversions.length) continue;
        converted.push(...rowConversions.map((item) => ({ table: table.name, id: row[table.key], ...item })));

        if (!DRY_RUN) {
          await updateRow(table, row, patch);
          if (DELETE_ORIGINALS) await deleteObjects(rowConversions.map((item) => item.sourcePath));
        }

        console.log(`${DRY_RUN ? "Would update" : "Updated"} ${table.name}/${row[table.key]}: ${rowConversions.length} image(s)`);
      }
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }

  console.log(JSON.stringify({ dryRun: DRY_RUN, deleteOriginals: DELETE_ORIGINALS, count: converted.length, converted }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
