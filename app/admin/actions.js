"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function requiredString(formData, key) {
  return String(formData.get(key) || "").trim();
}

function optionalString(formData, key) {
  const value = requiredString(formData, key);
  return value || null;
}

function numberValue(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function checkboxValue(formData, key) {
  return formData.get(key) === "on";
}

function splitList(value, separator = "\n") {
  return String(value || "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getClientOrRedirect() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");
  return supabase;
}

async function requireAdminClient() {
  const supabase = await getClientOrRedirect();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login?error=session");

  const { data: hasAccess, error: accessError } = await supabase.rpc("is_portfolio_admin");
  if (accessError || hasAccess !== true) redirect("/admin?error=access");

  return supabase;
}

async function uploadFileIfPresent(supabase, formData, fieldName, folder) {
  const file = formData.get(fieldName);
  if (!file || typeof file === "string" || file.size === 0) return optionalString(formData, `${fieldName}_current`);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("portfolio-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: true
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
  return data.publicUrl;
}

async function uploadFiles(supabase, formData, fieldName, folder) {
  const files = formData
    .getAll(fieldName)
    .filter((file) => file && typeof file !== "string" && file.size > 0);

  const urls = [];

  for (const file of files) {
    const singleFileForm = new FormData();
    singleFileForm.set(fieldName, file);
    urls.push(await uploadFileIfPresent(supabase, singleFileForm, fieldName, folder));
  }

  return urls.filter(Boolean);
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

function refreshProject(slug) {
  refresh();
  if (slug) revalidatePath(`/admin/projects/${slug}`);
}

export async function signIn(formData) {
  const supabase = await getClientOrRedirect();
  const email = requiredString(formData, "email");
  const password = requiredString(formData, "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=login");

  redirect("/admin");
}

export async function signOut() {
  const supabase = await getClientOrRedirect();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveAbout(formData) {
  const supabase = await requireAdminClient();
  const rows = [
    { key: "about_kicker", value: requiredString(formData, "about_kicker") },
    { key: "about_title", value: requiredString(formData, "about_title") },
    { key: "about_paragraphs", value: splitList(formData.get("about_paragraphs")) }
  ];

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  refresh();
}

export async function saveAboutSlide(formData) {
  const supabase = await requireAdminClient();
  const id = optionalString(formData, "id");
  const imageUrl = await uploadFileIfPresent(supabase, formData, "image", "about");
  const payload = {
    position: numberValue(formData, "position"),
    alt: requiredString(formData, "alt"),
    image_url: imageUrl,
    is_visible: checkboxValue(formData, "is_visible")
  };

  const query = id ? supabase.from("about_slides").update(payload).eq("id", id) : supabase.from("about_slides").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);

  refresh();
}

export async function reorderAboutSlides(formData) {
  const supabase = await requireAdminClient();
  const ids = formData.getAll("ids").map(String);
  const updates = ids.map((id, position) => supabase.from("about_slides").update({ position }).eq("id", id));
  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(error.message);

  refresh();
}

export async function deleteAboutSlide(formData) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("about_slides").delete().eq("id", requiredString(formData, "id"));
  if (error) throw new Error(error.message);

  refresh();
}

export async function saveProject(formData) {
  const supabase = await requireAdminClient();
  const originalSlug = optionalString(formData, "original_slug");
  const isNew = !originalSlug || originalSlug === "new";
  const title = requiredString(formData, "title");
  const slug = slugValue(requiredString(formData, "slug") || title);
  const imageUrl = await uploadFileIfPresent(supabase, formData, "image", `projects/${slug}`);
  const currentGallery = formData.getAll("gallery").map(String).filter(Boolean);
  const uploadedGallery = await uploadFiles(supabase, formData, "gallery_files", `projects/${slug}/gallery`);
  const payload = {
    slug,
    position: numberValue(formData, "position"),
    title,
    descriptor: requiredString(formData, "descriptor"),
    year: requiredString(formData, "year"),
    category: requiredString(formData, "category"),
    role: requiredString(formData, "role"),
    technologies: splitList(formData.get("technologies"), ","),
    live_url: optionalString(formData, "live_url"),
    accent: requiredString(formData, "accent") || "#77f7c8",
    image_url: imageUrl,
    gallery: [...currentGallery, ...uploadedGallery],
    summary: requiredString(formData, "summary"),
    is_visible: checkboxValue(formData, "is_visible")
  };

  const query =
    originalSlug && originalSlug !== "new"
      ? supabase.from("projects").update(payload).eq("slug", originalSlug)
      : supabase.from("projects").upsert(payload, { onConflict: "slug" });

  const { error } = await query;
  if (error) throw new Error(error.message);

  refreshProject(slug);
  redirect(`/admin/projects/${slug}?notice=${isNew ? "project-created" : "project-updated"}`);
}

export async function deleteProject(formData) {
  const supabase = await requireAdminClient();
  const slug = requiredString(formData, "original_slug") || requiredString(formData, "slug");
  const { error } = await supabase.from("projects").delete().eq("slug", slug);
  if (error) throw new Error(error.message);

  refresh();
  redirect("/admin?notice=project-deleted#projects");
}

export async function uploadProjectGalleryFiles(formData) {
  const supabase = await requireAdminClient();
  const slug = slugValue(optionalString(formData, "slug") || `draft-${Date.now()}`);
  return uploadFiles(supabase, formData, "gallery_files", `projects/${slug}/gallery`);
}

export async function reorderProjects(formData) {
  const supabase = await requireAdminClient();
  const slugs = formData.getAll("slugs").map(String);
  const updates = slugs.map((slug, position) => supabase.from("projects").update({ position }).eq("slug", slug));
  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(error.message);

  refresh();
}

export async function saveArchiveItem(formData) {
  const supabase = await requireAdminClient();
  const originalSlug = optionalString(formData, "original_slug");
  const title = requiredString(formData, "title");
  const slug = slugValue(requiredString(formData, "slug") || title);
  const imageUrl = await uploadFileIfPresent(supabase, formData, "image", `archive/${slug}`);
  const payload = {
    slug,
    position: numberValue(formData, "position"),
    title,
    accent: requiredString(formData, "accent") || "#77f7c8",
    image_url: imageUrl,
    is_visible: checkboxValue(formData, "is_visible")
  };

  const query =
    originalSlug && originalSlug !== "new"
      ? supabase.from("design_archive_items").update(payload).eq("slug", originalSlug)
      : supabase.from("design_archive_items").upsert(payload, { onConflict: "slug" });

  const { error } = await query;
  if (error) throw new Error(error.message);

  refresh();
}

export async function deleteArchiveItem(formData) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("design_archive_items").delete().eq("slug", requiredString(formData, "slug"));
  if (error) throw new Error(error.message);

  refresh();
}

export async function reorderArchiveItems(formData) {
  const supabase = await requireAdminClient();
  const slugs = formData.getAll("slugs").map(String);
  const updates = slugs.map((slug, position) => supabase.from("design_archive_items").update({ position }).eq("slug", slug));
  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(error.message);

  refresh();
}

export async function saveSocialLink(formData) {
  const supabase = await requireAdminClient();
  const label = requiredString(formData, "label");
  const payload = {
    label,
    href: requiredString(formData, "href"),
    position: numberValue(formData, "position"),
    is_visible: checkboxValue(formData, "is_visible")
  };

  const { error } = await supabase.from("social_links").upsert(payload, { onConflict: "label" });
  if (error) throw new Error(error.message);

  refresh();
}

export async function deleteSocialLink(formData) {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from("social_links").delete().eq("label", requiredString(formData, "label"));
  if (error) throw new Error(error.message);

  refresh();
}
