create schema if not exists private;
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create or replace function private.is_portfolio_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'portfolio_admin')::boolean, false)
    or exists (
      select 1
      from public.admin_users
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
security invoker
set search_path = public
as $$
  select private.is_portfolio_admin();
$$;

grant execute on function public.is_portfolio_admin() to authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_portfolio_admin() to anon, authenticated;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.about_slides (
  id uuid primary key default gen_random_uuid(),
  position integer not null default 0,
  image_url text not null,
  alt text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  slug text primary key,
  position integer not null default 0,
  title text not null,
  descriptor text not null default '',
  year text not null default '',
  category text not null default '',
  role text not null default '',
  technologies text[] not null default '{}',
  live_url text,
  accent text not null default '#77f7c8',
  image_url text not null,
  gallery text[] not null default '{}',
  summary text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.design_archive_items (
  slug text primary key,
  position integer not null default 0,
  title text not null,
  image_url text not null,
  accent text not null default '#77f7c8',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  label text primary key,
  position integer not null default 0,
  href text not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_site_settings_updated_at on public.site_settings;
create trigger touch_site_settings_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();

drop trigger if exists touch_about_slides_updated_at on public.about_slides;
create trigger touch_about_slides_updated_at
before update on public.about_slides
for each row execute function public.touch_updated_at();

drop trigger if exists touch_projects_updated_at on public.projects;
create trigger touch_projects_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists touch_design_archive_items_updated_at on public.design_archive_items;
create trigger touch_design_archive_items_updated_at
before update on public.design_archive_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_social_links_updated_at on public.social_links;
create trigger touch_social_links_updated_at
before update on public.social_links
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.about_slides enable row level security;
alter table public.projects enable row level security;
alter table public.design_archive_items enable row level security;
alter table public.social_links enable row level security;

drop policy if exists "Admins manage admin users" on public.admin_users;
create policy "Admins manage admin users"
on public.admin_users
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

drop policy if exists "Anyone reads site settings" on public.site_settings;
create policy "Anyone reads site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

drop policy if exists "Anyone reads visible about slides" on public.about_slides;
create policy "Anyone reads visible about slides"
on public.about_slides
for select
to anon, authenticated
using (is_visible or private.is_portfolio_admin());

drop policy if exists "Admins manage about slides" on public.about_slides;
create policy "Admins manage about slides"
on public.about_slides
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

drop policy if exists "Anyone reads visible projects" on public.projects;
create policy "Anyone reads visible projects"
on public.projects
for select
to anon, authenticated
using (is_visible or private.is_portfolio_admin());

drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects"
on public.projects
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

drop policy if exists "Anyone reads visible design archive" on public.design_archive_items;
create policy "Anyone reads visible design archive"
on public.design_archive_items
for select
to anon, authenticated
using (is_visible or private.is_portfolio_admin());

drop policy if exists "Admins manage design archive" on public.design_archive_items;
create policy "Admins manage design archive"
on public.design_archive_items
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

drop policy if exists "Anyone reads visible social links" on public.social_links;
create policy "Anyone reads visible social links"
on public.social_links
for select
to anon, authenticated
using (is_visible or private.is_portfolio_admin());

drop policy if exists "Admins manage social links" on public.social_links;
create policy "Admins manage social links"
on public.social_links
for all
to authenticated
using (private.is_portfolio_admin())
with check (private.is_portfolio_admin());

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone reads portfolio media" on storage.objects;
create policy "Anyone reads portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Admins upload portfolio media" on storage.objects;
create policy "Admins upload portfolio media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-media' and private.is_portfolio_admin());

drop policy if exists "Admins update portfolio media" on storage.objects;
create policy "Admins update portfolio media"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-media' and private.is_portfolio_admin())
with check (bucket_id = 'portfolio-media' and private.is_portfolio_admin());

drop policy if exists "Admins delete portfolio media" on storage.objects;
create policy "Admins delete portfolio media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-media' and private.is_portfolio_admin());

insert into public.site_settings (key, value)
values
  ('about_kicker', '"Обо мне"'::jsonb),
  ('about_title', '"Я Тимур - графический дизайнер и веб-разработчик"'::jsonb),
  (
    'about_paragraphs',
    '[
      "Мне 20 лет, живу в Казани. Работаю на стыке дизайна и разработки, создавая визуальные проекты, в которых важны не только внешний вид, но и сильная идея.",
      "Я умею брать ответственность за результат, быстро погружаться в новые задачи и находить решения там, где другие видят сложности. Люблю нестандартно мыслить, экспериментировать и искать свежий взгляд, но всегда довожу идеи до понятного и качественного результата.",
      "Для меня хороший проект - это сочетание сильной идеи, продуманного исполнения и смелых решений, которые остаются актуальными и спустя время."
    ]'::jsonb
  )
on conflict (key) do nothing;

insert into public.about_slides (position, image_url, alt)
values
  (0, '/aboutMe/1.png', 'Портрет Тимура'),
  (1, '/aboutMe/2.png', 'Тимур в рабочей визуальной среде'),
  (2, '/aboutMe/3.png', 'Тимур, фото для блока обо мне')
on conflict do nothing;

insert into public.projects (slug, position, title, descriptor, year, category, role, technologies, live_url, accent, image_url, gallery, summary)
values
  ('aurora', 0, 'Айдентика Aurora', 'Спокойная визуальная система для wellness-бренда.', '2026', 'Айдентика', 'Арт-дирекшн, логика айдентики, носители, кампейн-визуалы', array['Figma', 'Illustrator', 'Photoshop'], 'https://behance.net', '#ff4d8d', '/projects/aurora.svg', array['/projects/aurora.svg', '/projects/social.svg', '/projects/motion.svg'], 'Для Aurora собрана тихая, но запоминающаяся айдентика: типографика, цвет, правила композиции и набор носителей для запуска. Главная задача - сделать бренд визуально цельным без лишнего шума.'),
  ('creative-studio', 1, 'Портфолио для креативной студии', 'Редакционная подача работ с крупной типографикой и движением.', '2026', 'Веб-дизайн', 'Визуальная концепция, UX, frontend, motion-система', array['Next.js', 'React', 'Framer Motion', 'CSS Modules'], 'https://github.com', '#77f7c8', '/projects/studio.svg', array['/projects/studio.svg', '/projects/saas.svg', '/projects/commerce.svg'], 'Сайт построен как витрина визуальных работ: крупные обложки, короткие описания и быстрый просмотр проектов. Разработка здесь поддерживает дизайн, а не перетягивает внимание на себя.'),
  ('commerce', 2, 'Лендинг для product drop', 'Запусковая страница с сильной обложкой и чистой сеткой.', '2025', 'Лендинг', 'Графическая концепция, веб-дизайн, адаптивная верстка', array['Next.js', 'React', 'CSS Grid'], 'https://github.com', '#7aa7ff', '/projects/commerce.svg', array['/projects/commerce.svg', '/projects/aurora.svg', '/projects/studio.svg'], 'Лендинг для промо-запуска: выразительный первый экран, ясная структура, мобильная адаптация и легкая анимация. Визуальный образ продукта остается главным, интерфейс только помогает продаже.'),
  ('social-system', 3, 'Визуальная система для соцсетей', 'Набор шаблонов для быстрой и узнаваемой кампании.', '2025', 'Графический дизайн', 'Шаблонная система, сетка, типографика, правила кропа', array['Figma', 'Photoshop', 'After Effects'], 'https://behance.net', '#ffd166', '/projects/social.svg', array['/projects/social.svg', '/projects/motion.svg', '/projects/aurora.svg'], 'Модульная система для постов, сторис и кампейн-материалов: сетки, иерархия, правила типографики и заготовки под движение. Такой дизайн легко масштабировать без потери характера.'),
  ('motion-posters', 4, 'Серия motion-постеров', 'Анимированные постеры для digital-запусков и соцсетей.', '2024', 'Motion', 'Графический дизайн, раскадровка, направление анимации', array['After Effects', 'Photoshop', 'Illustrator'], 'https://dribbble.com', '#b388ff', '/projects/motion.svg', array['/projects/motion.svg', '/projects/social.svg', '/projects/saas.svg'], 'Плакатная серия для digital-поверхностей: жесткая сетка, большой масштаб, контраст и движение. Формат рассчитан на быстрый взгляд в ленте, но остается собранным как полноценный постер.'),
  ('saas-dashboard', 5, 'UI-концепт SaaS-дашборда', 'Сдержанный интерфейс с ясной визуальной иерархией.', '2024', 'UI/UX', 'Интерфейсная концепция, визуальная система, прототип', array['Figma', 'React', 'Design Systems'], 'https://github.com', '#55d6ff', '/projects/saas.svg', array['/projects/saas.svg', '/projects/studio.svg', '/projects/commerce.svg'], 'Концепт интерфейса, где графическая дисциплина помогает данным читаться быстрее: спокойная сетка, понятные акценты и компоненты без визуальной тяжести. Веб-навык здесь используется для проверки логики и поведения.')
on conflict (slug) do nothing;

insert into public.design_archive_items (slug, position, title, image_url, accent)
select slug, position, title, image_url, accent
from public.projects
on conflict (slug) do nothing;

insert into public.social_links (label, position, href)
values
  ('EMAIL', 0, 'mailto:bezborodnikovtimur@gmail.com'),
  ('VK', 1, 'https://vk.com/l1lines'),
  ('MAX', 2, 'https://max.ru/u/f9LHodD0cOIh49rvqQYNbhq-jsi0h2Oo_V_FmVt5ZW4K7YYxenIVBbO0b3k'),
  ('TELEGRAM', 3, 'https://t.me/lnsnostylist'),
  ('INSTAGRAM', 4, 'https://www.instagram.com/lnsnostylist'),
  ('PINTEREST', 5, 'https://ru.pinterest.com/lnsnostylist/'),
  ('BEHANCE', 6, 'https://www.behance.net/lnsnostylist'),
  ('GITHUB', 7, 'https://github.com/lnnsss')
on conflict (label) do nothing;
