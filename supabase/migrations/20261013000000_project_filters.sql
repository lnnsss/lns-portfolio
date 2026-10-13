-- Apply before deploying the filter editor. Existing descriptions stay intact.
alter table public.projects add column filter_category text
  check (filter_category in ('branding', 'logo', 'website', 'posters', 'print'));

update public.projects set filter_category = case slug
  when 'liga-gift-boxes' then 'print'
  when 'designers-drama' then 'branding'
  when 'clothes-for-minem-kiem' then 'print'
  when 'acc-redesign' then 'branding'
  when 'student-goda-premia' then 'branding'
  when 'tamleme-dustym-logo' then 'logo'
  when 'minem-kiem-store' then 'website'
  when 'taifun-stickers' then 'print'
  when 'infocom-badges' then 'print'
  when 'afisha-acc' then 'posters'
  when 'kristiee-concert-poster' then 'posters'
  when 'lsm-tour' then 'website'
  when 'aurora' then 'branding'
  when 'creative-studio' then 'website'
  when 'commerce' then 'website'
  when 'social-system' then 'branding'
  when 'motion-posters' then 'posters'
  when 'saas-dashboard' then 'website'
  else null
end;
