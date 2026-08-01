update public.about_slides
set image_url = replace(image_url, '.png', '.webp')
where image_url in ('/aboutMe/1.png', '/aboutMe/2.png', '/aboutMe/3.png');
