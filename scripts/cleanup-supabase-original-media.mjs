import { readFile } from "node:fs/promises";

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
const DRY_RUN = process.argv.includes("--dry-run");
const MEDIA_EXTENSIONS = /\.(png|jpe?g)(?:$|[?#])/i;

const tables = [
  {
    name: "about_slides",
    select: "image_url",
    fields: ["image_url"]
  },
  {
    name: "projects",
    select: "image_url,gallery",
    fields: ["image_url", "gallery"]
  },
  {
    name: "design_archive_items",
    select: "image_url",
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

function storagePathFromUrl(url) {
  const index = String(url || "").indexOf(PUBLIC_MARKER);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + PUBLIC_MARKER.length).split("?")[0]);
}

async function getRows(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table.name}?select=${encodeURIComponent(table.select)}`;
  const response = await fetch(url, { headers: apiHeaders() });
  if (!response.ok) throw new Error(`Failed to read ${table.name}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function getReferencedStoragePaths() {
  const references = new Set();

  for (const table of tables) {
    const rows = await getRows(table);
    for (const row of rows) {
      for (const field of table.fields) {
        const value = row[field];
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
          const path = storagePathFromUrl(item);
          if (path) references.add(path);
        }
      }
    }
  }

  return references;
}

async function listObjects(prefix = "") {
  const found = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: apiHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({
        prefix,
        limit,
        offset,
        sortBy: { column: "name", order: "asc" }
      })
    });

    if (!response.ok) throw new Error(`Failed to list ${prefix || "/"}: ${response.status} ${await response.text()}`);

    const items = await response.json();
    if (!items.length) break;

    for (const item of items) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) found.push(...await listObjects(path));
      else found.push(path);
    }

    if (items.length < limit) break;
    offset += limit;
  }

  return found;
}

async function deleteObjects(paths) {
  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: apiHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ prefixes: chunk })
    });
    if (!response.ok) throw new Error(`Failed to delete originals: ${response.status} ${await response.text()}`);
  }
}

async function main() {
  const [references, allObjects] = await Promise.all([
    getReferencedStoragePaths(),
    listObjects()
  ]);

  const unusedOriginals = allObjects
    .filter((path) => MEDIA_EXTENSIONS.test(path))
    .filter((path) => !references.has(path))
    .sort();

  if (!DRY_RUN) await deleteObjects(unusedOriginals);

  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    count: unusedOriginals.length,
    deleted: DRY_RUN ? [] : unusedOriginals,
    wouldDelete: DRY_RUN ? unusedOriginals : []
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
