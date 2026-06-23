"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function stringValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function optionalString(formData, key) {
  return stringValue(formData, key) || null;
}

function numberValue(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function checkboxValue(formData, key) {
  return formData.get(key) === "on";
}

function splitList(value, separator = "\n") {
  return String(value || "").split(separator).map((item) => item.trim()).filter(Boolean);
}

function slugValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ok(message, data = null) {
  return { ok: true, message, fieldErrors: {}, data };
}

function fail(message, fieldErrors = {}) {
  return { ok: false, message, fieldErrors, data: null };
}

function reportActionError(scope, error) {
  console.error(`[admin:${scope}]`, {
    code: error?.code || "unknown",
    message: error?.message || "Unknown error"
  });
}

async function requireAdminClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase configuration is missing");

  const [userResult, accessResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("is_portfolio_admin")
  ]);
  const user = userResult.data.user;

  if (userResult.error || !user) throw new Error("Сессия истекла. Войди снова.");
  if (accessResult.error || accessResult.data !== true) throw new Error("Нет прав на редактирование");
  return supabase;
}

async function uploadFileIfPresent(supabase, formData, fieldName, folder) {
  const file = formData.get(fieldName);
  if (!file || typeof file === "string" || file.size === 0) return optionalString(formData, `${fieldName}_current`);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("portfolio-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  });
  if (error) throw error;
  return supabase.storage.from("portfolio-media").getPublicUrl(path).data.publicUrl;
}

function refresh(slug) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/admin/projects/${slug}`);
}

export async function signIn(formData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?error=env");
  const { error } = await supabase.auth.signInWithPassword({
    email: stringValue(formData, "email"),
    password: stringValue(formData, "password")
  });
  if (error) redirect("/admin/login?error=login");
  redirect("/admin?section=projects");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveAboutSlide(formData) {
  try {
    const supabase = await requireAdminClient();
    const id = optionalString(formData, "id");
    const payload = {
      position: numberValue(formData, "position"),
      alt: stringValue(formData, "alt") || "Фото обо мне",
      image_url: await uploadFileIfPresent(supabase, formData, "image", "about"),
      is_visible: checkboxValue(formData, "is_visible")
    };
    if (!payload.image_url) return fail("Добавь изображение", { image: "Выбери изображение" });
    const query = id
      ? supabase.from("about_slides").update(payload).eq("id", id).select().single()
      : supabase.from("about_slides").insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    refresh();
    return ok(id ? "Фотография обновлена" : "Фотография добавлена", data);
  } catch (error) {
    reportActionError("save-about-slide", error);
    return fail(error?.message || "Не удалось сохранить фотографию");
  }
}

export async function deleteAboutSlide(formData) {
  try {
    const supabase = await requireAdminClient();
    const id = stringValue(formData, "id");
    const { error } = await supabase.from("about_slides").delete().eq("id", id);
    if (error) throw error;
    refresh();
    return ok("Фотография удалена", { id });
  } catch (error) {
    reportActionError("delete-about-slide", error);
    return fail(error?.message || "Не удалось удалить фотографию");
  }
}

async function reorderRows(table, field, values, scope) {
  try {
    const supabase = await requireAdminClient();
    const results = await Promise.all(values.map((value, position) => supabase.from(table).update({ position }).eq(field, value)));
    const error = results.find((result) => result.error)?.error;
    if (error) throw error;
    refresh();
    return ok("Порядок сохранён", values);
  } catch (error) {
    reportActionError(scope, error);
    return fail("Не удалось сохранить порядок");
  }
}

export async function reorderAboutSlides(formData) {
  return reorderRows("about_slides", "id", formData.getAll("ids").map(String), "reorder-about");
}

export async function reorderProjects(formData) {
  return reorderRows("projects", "slug", formData.getAll("slugs").map(String), "reorder-projects");
}

export async function reorderArchiveItems(formData) {
  return reorderRows("design_archive_items", "slug", formData.getAll("slugs").map(String), "reorder-archive");
}

function validateProject(formData, isNew) {
  const required = {
    title: "Добавь название",
    year: "Укажи год",
    category: "Укажи категорию",
    descriptor: "Добавь короткое описание",
    role: "Опиши роль",
    technologies: "Укажи инструменты",
    summary: "Добавь полное описание"
  };
  const fieldErrors = Object.fromEntries(Object.entries(required).filter(([key]) => !stringValue(formData, key)));
  const imageUrl = optionalString(formData, "image_current");
  if (isNew && !imageUrl) fieldErrors.image = "Добавь обложку";
  const slug = slugValue(stringValue(formData, "slug") || stringValue(formData, "title"));
  if (!slug) fieldErrors.slug = "Не удалось сформировать адрес";
  return { fieldErrors, slug, imageUrl };
}

export async function saveProject(formData) {
  const originalSlug = optionalString(formData, "original_slug");
  const isNew = !originalSlug || originalSlug === "new";
  const { fieldErrors, slug, imageUrl } = validateProject(formData, isNew);
  if (Object.keys(fieldErrors).length) return fail("Проверь обязательные поля", fieldErrors);

  try {
    const supabase = await requireAdminClient();
    if (isNew || slug !== originalSlug) {
      const { data: duplicate, error: duplicateError } = await supabase.from("projects").select("slug").eq("slug", slug).maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) return fail("Такой адрес уже занят", { slug: "Выбери другой slug" });
    }

    const payload = {
      slug,
      position: numberValue(formData, "position"),
      title: stringValue(formData, "title"),
      descriptor: stringValue(formData, "descriptor"),
      year: stringValue(formData, "year"),
      category: stringValue(formData, "category"),
      role: stringValue(formData, "role"),
      technologies: splitList(formData.get("technologies"), ","),
      live_url: optionalString(formData, "live_url"),
      accent: stringValue(formData, "accent") || "#77f7c8",
      image_url: imageUrl,
      gallery: formData.getAll("gallery").map(String).filter(Boolean),
      summary: stringValue(formData, "summary"),
      is_visible: checkboxValue(formData, "is_visible")
    };
    const query = isNew
      ? supabase.from("projects").insert(payload).select().single()
      : supabase.from("projects").update(payload).eq("slug", originalSlug).select().single();
    const { data, error } = await query;
    if (error) {
      if (error.code === "23505") return fail("Такой адрес уже занят", { slug: "Выбери другой slug" });
      throw error;
    }
    refresh(slug);
    return ok(isNew ? "Кейс создан" : "Изменения сохранены", { project: data, isNew });
  } catch (error) {
    reportActionError("save-project", error);
    return fail(error?.message || "Не удалось сохранить кейс");
  }
}

export async function deleteProject(formData) {
  try {
    const supabase = await requireAdminClient();
    const slug = stringValue(formData, "original_slug") || stringValue(formData, "slug");
    const { error } = await supabase.from("projects").delete().eq("slug", slug);
    if (error) throw error;
    refresh();
    return ok("Кейс удалён", { slug });
  } catch (error) {
    reportActionError("delete-project", error);
    return fail(error?.message || "Не удалось удалить кейс");
  }
}

export async function saveArchiveItem(formData) {
  try {
    const supabase = await requireAdminClient();
    const originalSlug = optionalString(formData, "original_slug");
    const title = stringValue(formData, "title");
    const slug = slugValue(stringValue(formData, "slug") || title);
    if (!title || !slug) return fail("Заполни название", { title: "Обязательное поле" });
    const payload = {
      slug,
      position: numberValue(formData, "position"),
      title,
      accent: stringValue(formData, "accent") || "#77f7c8",
      image_url: await uploadFileIfPresent(supabase, formData, "image", `archive/${slug}`),
      is_visible: checkboxValue(formData, "is_visible")
    };
    if (!payload.image_url) return fail("Добавь изображение", { image: "Выбери изображение" });
    const query = originalSlug && originalSlug !== "new"
      ? supabase.from("design_archive_items").update(payload).eq("slug", originalSlug).select().single()
      : supabase.from("design_archive_items").insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    refresh();
    return ok(originalSlug === "new" ? "Работа добавлена" : "Работа обновлена", data);
  } catch (error) {
    reportActionError("save-archive", error);
    return fail(error?.message || "Не удалось сохранить работу");
  }
}

export async function deleteArchiveItem(formData) {
  try {
    const supabase = await requireAdminClient();
    const slug = stringValue(formData, "slug");
    const { error } = await supabase.from("design_archive_items").delete().eq("slug", slug);
    if (error) throw error;
    refresh();
    return ok("Работа удалена", { slug });
  } catch (error) {
    reportActionError("delete-archive", error);
    return fail(error?.message || "Не удалось удалить работу");
  }
}

export async function saveSocialLink(formData) {
  try {
    const supabase = await requireAdminClient();
    const label = stringValue(formData, "label");
    const href = stringValue(formData, "href");
    const fieldErrors = {};
    if (!label) fieldErrors.label = "Добавь название";
    try { new URL(href); } catch { fieldErrors.href = "Укажи полный URL"; }
    if (Object.keys(fieldErrors).length) return fail("Проверь ссылку", fieldErrors);
    const payload = { label, href, position: numberValue(formData, "position"), is_visible: checkboxValue(formData, "is_visible") };
    const { data, error } = await supabase.from("social_links").upsert(payload, { onConflict: "label" }).select().single();
    if (error) throw error;
    refresh();
    return ok("Ссылка сохранена", data);
  } catch (error) {
    reportActionError("save-social", error);
    return fail(error?.message || "Не удалось сохранить ссылку");
  }
}

export async function deleteSocialLink(formData) {
  try {
    const supabase = await requireAdminClient();
    const label = stringValue(formData, "label");
    const { error } = await supabase.from("social_links").delete().eq("label", label);
    if (error) throw error;
    refresh();
    return ok("Ссылка удалена", { label });
  } catch (error) {
    reportActionError("delete-social", error);
    return fail(error?.message || "Не удалось удалить ссылку");
  }
}
