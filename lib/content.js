import { createClient } from "@supabase/supabase-js";
import { aboutContent, designArchive, projects, socialLinks } from "@/data/projects";
import { getSupabaseConfig, hasSupabaseConfig } from "./supabase/config";

const fallbackContent = {
  about: aboutContent,
  projects,
  designArchive,
  socialLinks
};

const PUBLIC_MEDIA_MARKER = "/storage/v1/object/public/portfolio-media/";

function toPublicMediaUrl(value) {
  if (typeof value !== "string" || !value.startsWith("http")) return value;

  try {
    const { url } = getSupabaseConfig();
    const source = new URL(value);
    const supabase = new URL(url);

    if (source.origin !== supabase.origin || !source.pathname.startsWith(PUBLIC_MEDIA_MARKER)) return value;

    return `/media/${source.pathname.slice(PUBLIC_MEDIA_MARKER.length)}${source.search}`;
  } catch {
    return value;
  }
}

function getPublicClient() {
  if (!hasSupabaseConfig()) return null;

  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function toProject(row) {
  return {
    id: row.slug,
    title: row.title,
    descriptor: row.descriptor,
    year: row.year,
    category: row.category,
    role: row.role,
    technologies: row.technologies || [],
    liveUrl: row.live_url,
    accent: row.accent,
    image: toPublicMediaUrl(row.image_url),
    gallery: (row.gallery || []).map(toPublicMediaUrl),
    summary: row.summary
  };
}

function toArchiveItem(row) {
  return {
    id: row.slug,
    title: row.title,
    image: toPublicMediaUrl(row.image_url),
    accent: row.accent,
    position: row.position
  };
}

export async function getPortfolioContent() {
  const supabase = getPublicClient();
  if (!supabase) return fallbackContent;

  const [settingsResult, slidesResult, projectsResult, archiveResult, socialResult] = await Promise.all([
    supabase.from("site_settings").select("key,value").in("key", ["about_kicker", "about_title", "about_paragraphs"]),
    supabase.from("about_slides").select("*").eq("is_visible", true).order("position", { ascending: true }),
    supabase.from("projects").select("*").eq("is_visible", true).order("position", { ascending: true }),
    supabase.from("design_archive_items").select("*").eq("is_visible", true).order("position", { ascending: true }),
    supabase.from("social_links").select("*").eq("is_visible", true).order("position", { ascending: true })
  ]);

  if (settingsResult.error || slidesResult.error || projectsResult.error || archiveResult.error || socialResult.error) {
    return fallbackContent;
  }

  const settings = Object.fromEntries(settingsResult.data.map((item) => [item.key, item.value]));
  const nextProjects = projectsResult.data.map(toProject);
  const nextArchive = archiveResult.data.length ? archiveResult.data.map(toArchiveItem) : nextProjects;

  const nextSlides = slidesResult.data.map((slide) => ({
    src: toPublicMediaUrl(slide.image_url),
    alt: slide.alt
  }));

  return {
    about: {
      kicker: settings.about_kicker || aboutContent.kicker,
      title: settings.about_title || aboutContent.title,
      paragraphs: Array.isArray(settings.about_paragraphs) ? settings.about_paragraphs : aboutContent.paragraphs,
      slides: nextSlides.length ? nextSlides : aboutContent.slides
    },
    projects: nextProjects.length ? nextProjects : fallbackContent.projects,
    designArchive: nextArchive.length ? nextArchive : fallbackContent.designArchive,
    socialLinks: socialResult.data.length
      ? socialResult.data.map((link) => ({ label: link.label, href: link.href }))
      : fallbackContent.socialLinks
  };
}

export async function getAdminContent(supabase, section = "projects") {
  const content = { settings: {}, slides: [], projects: [], designArchive: [], socialLinks: [] };
  const queries = {
    projects: () => supabase.from("projects").select("*").order("position", { ascending: true }),
    photos: () => supabase.from("about_slides").select("*").order("position", { ascending: true }),
    archive: () => supabase.from("design_archive_items").select("*").order("position", { ascending: true }),
    social: () => supabase.from("social_links").select("*").order("position", { ascending: true })
  };
  const result = await (queries[section] || queries.projects)();

  if (section === "photos") content.slides = result.data || [];
  else if (section === "archive") content.designArchive = result.data || [];
  else if (section === "social") content.socialLinks = result.data || [];
  else content.projects = result.data || [];

  return content;
}
