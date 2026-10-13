export const PROJECT_FILTERS = [
  { value: "branding", label: "Брендинг" },
  { value: "logo", label: "Логотип" },
  { value: "website", label: "Сайт" },
  { value: "posters", label: "Афиша" },
  { value: "print", label: "Полиграфия" }
];

// Initial categories for existing cases, also used before the database migration.
// An explicit empty array wins, so clearing categories in the CMS is permanent.
export const INITIAL_PROJECT_FILTERS = {
  "liga-gift-boxes": "print",
  "designers-drama": ["branding", "website"],
  "clothes-for-minem-kiem": "print",
  "liga-arena-banner": null,
  "acc-redesign": "branding",
  "student-goda-premia": "branding",
  "students-playlist-covers": null,
  "tamleme-dustym-logo": "logo",
  "minem-kiem-store": "website",
  "taifun-stickers": "print",
  "infocom-badges": "print",
  "afisha-acc": "posters",
  "kristiee-concert-poster": "posters",
  "lsm-tour": ["website", "posters"],
  aurora: "branding",
  "creative-studio": "website",
  commerce: "website",
  "social-system": "branding",
  "motion-posters": "posters",
  "saas-dashboard": "website"
};

export function getProjectFilters(project) {
  let values = project.filter_categories;
  if (values === undefined) {
    const legacy = project.filter_category !== undefined
      ? project.filter_category
      : INITIAL_PROJECT_FILTERS[project.slug || project.id];
    values = Array.isArray(legacy) ? legacy : legacy ? [legacy] : [];
  }
  if (!Array.isArray(values)) return [];
  return PROJECT_FILTERS.filter((filter) => values.includes(filter.value)).map((filter) => filter.value);
}
