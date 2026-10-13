-- Preserve existing single-category choices; an empty array means "Не указано".
alter table public.projects add column filter_categories text[] not null default '{}'
  check (filter_categories <@ array['branding', 'logo', 'website', 'posters', 'print']::text[]);

update public.projects set filter_categories = case
  when filter_category is null then '{}'::text[]
  else array[filter_category]
end;

-- These two cases explicitly contain both kinds of work.
update public.projects set filter_categories = array['branding', 'website']
where slug = 'designers-drama' and filter_category = 'branding';
update public.projects set filter_categories = array['website', 'posters']
where slug = 'lsm-tour' and filter_category = 'website';
