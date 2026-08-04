-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Moves templates from the hardcoded lib/templates-data.ts array into a real
-- table (admin-editable, no code deploy needed), adds a "universal" template
-- type for personal/portrait photos alongside the existing "production"
-- (product photography) type, and sets up storage for real AI-generated
-- preview images (replacing the random picsum.photos placeholders).

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_type text not null default 'production' check (template_type in ('production', 'universal')),
  category text not null,
  description text not null,
  tags text[] not null default '{}',
  prompt text not null,
  cover_image_url text,
  accent_color text not null default '#dc2626',
  is_pro boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.templates enable row level security;

drop policy if exists "public read templates" on public.templates;
create policy "public read templates" on public.templates for select using (true);
-- No insert/update/delete policy: all writes go through the admin API routes'
-- service-role client (lib/supabase/admin.ts), which bypasses RLS entirely.

insert into storage.buckets (id, name, public)
values ('template-previews', 'template-previews', true)
on conflict (id) do nothing;

drop policy if exists "public read template previews" on storage.objects;
create policy "public read template previews" on storage.objects
  for select using (bucket_id = 'template-previews');

-- Seed: the 12 existing production templates, verbatim from lib/templates-data.ts.
-- cover_image_url starts null — filled in by "Generate all previews" in the
-- admin Templates tab after this migration runs.
insert into public.templates (name, template_type, category, description, tags, prompt, accent_color, is_pro, sort_order) values
('Luxury Product Shoot', 'production', 'luxury', 'Rich black marble surface with dramatic side lighting and golden accents', array['marble','dark','dramatic','luxury'], 'on a polished black marble surface with golden hour side lighting, cinematic depth of field, luxury editorial photography style, rich shadows and highlights', '#d4a853', false, 10),
('Minimal White Studio', 'production', 'minimal', 'Clean white background with soft natural diffused light', array['white','clean','minimal','studio'], 'on a clean white studio background with soft diffused lighting, minimal shadows, professional product photography, crisp and clean', '#e2e8f0', false, 20),
('Lifestyle Scene', 'production', 'lifestyle', 'Natural daylight with organic props for an authentic everyday feel', array['natural','daylight','organic','lifestyle'], 'in a natural lifestyle setting with warm morning light, organic props, wooden surfaces and linen textures, authentic and inviting atmosphere', '#84cc16', false, 30),
('Cosmetic Campaign', 'production', 'luxury', 'Soft pastel tones with florals — perfect for beauty brands', array['beauty','soft','pastel','florals'], 'surrounded by delicate rose petals and soft pastel fabrics, feminine editorial lighting, beauty campaign photography, dewy and luminous', '#f9a8d4', false, 40),
('Dark & Moody Editorial', 'production', 'editorial', 'Deep shadows, dramatic lighting — cinematic and bold', array['dark','moody','cinematic','dramatic'], 'in a dark moody setting with dramatic cinematic lighting, deep shadows with selective illumination, editorial fashion photography style, mysterious and sophisticated', '#6366f1', true, 50),
('Premium Packaging', 'production', 'minimal', 'Architectural composition showcasing packaging detail', array['packaging','detail','architectural','clean'], 'precision studio photography showing packaging detail, top-down flat lay on warm concrete, architectural composition, soft gradient shadows', '#94a3b8', false, 60),
('Social Media Ad', 'production', 'social', 'High-contrast vibrant shot optimised for feed performance', array['social','vibrant','high-contrast','ad'], 'bold social media advertisement style, high contrast vibrant colors, clean background with geometric light leaks, optimised for Instagram feed, eye-catching composition', '#f97316', false, 70),
('Fashion Editorial', 'production', 'fashion', 'Magazine-quality editorial framing with fashion-forward aesthetic', array['fashion','editorial','magazine','luxury'], 'high-fashion editorial photography for luxury magazine, dramatic pose on architectural surface, strong directional light creating graphic shadows, Vogue editorial style', '#e879f9', true, 80),
('Food Photography', 'production', 'food', 'Appetising overhead and 45° shots for food and beverage', array['food','beverage','overhead','natural'], 'professional food photography with natural side lighting, on rustic wooden surface with scattered herbs and spices, shallow depth of field, warm and appetizing colors', '#fb923c', false, 90),
('Marble Luxury', 'production', 'luxury', 'White Carrara marble with gold accents and botanical styling', array['marble','gold','botanical','white'], 'on Italian white Carrara marble with delicate gold botanical elements, soft window light casting gentle shadows, luxury home decor photography aesthetic', '#a78bfa', false, 100),
('Outdoor Lifestyle', 'production', 'lifestyle', 'Natural outdoor light with seasonal botanical elements', array['outdoor','natural','seasonal','fresh'], 'in an outdoor lifestyle setting with dappled natural sunlight, surrounded by seasonal botanical elements, fresh and energetic atmosphere, health and wellness aesthetic', '#22c55e', false, 110),
('Minimalist Flat Lay', 'production', 'minimal', 'Perfectly styled overhead composition on a neutral surface', array['flat-lay','overhead','minimal','curated'], 'perfectly curated minimalist flat lay composition, overhead shot on warm grey linen surface, with carefully placed complementary props, even diffused lighting', '#78716c', true, 120);

-- Seed: new "universal" templates — for a person's own photo, not a product.
-- The scene/lighting language below is what the template contributes; identity
-- preservation (face, likeness, expression) is enforced server-side by
-- buildPortraitEditPrompt in lib/scene-prompt.ts, not by this text.
insert into public.templates (name, template_type, category, description, tags, prompt, accent_color, is_pro, sort_order) values
('Professional Headshot', 'universal', 'professional', 'Corporate studio lighting on a neutral backdrop — built for resumes and team pages', array['headshot','corporate','professional','studio'], 'a professional corporate headshot with soft studio lighting, neutral gray backdrop, sharp focus, confident and approachable expression framing, business professional atmosphere', '#3b82f6', false, 210),
('LinkedIn Avatar', 'universal', 'professional', 'Clean natural light optimised for a networking profile photo', array['linkedin','avatar','professional','clean'], 'a clean modern headshot with soft natural window light, subtle blurred office background, warm and approachable tone, optimised for a professional networking profile photo', '#0ea5e9', false, 220),
('Casual Social Portrait', 'universal', 'social', 'Warm golden-hour glow for a natural, feed-ready profile photo', array['casual','social','warm','natural'], 'a bright, candid lifestyle portrait with warm golden hour sunlight, soft bokeh background, relaxed and natural expression, perfect for social media profile and feed photos', '#f97316', false, 230),
('Editorial Portrait', 'universal', 'editorial', 'Dramatic magazine-style lighting and bold contrast', array['editorial','dramatic','fashion','magazine'], 'a high-fashion editorial portrait with dramatic directional lighting, deep shadows and bold contrast, magazine-quality composition, sophisticated and striking mood', '#e879f9', true, 240),
('Studio B&W Portrait', 'universal', 'monochrome', 'Timeless black and white with classic studio lighting', array['black-and-white','studio','classic','fine-art'], 'a timeless black and white studio portrait with classic Rembrandt lighting, rich tonal contrast, soft vignette, fine-art photography aesthetic', '#94a3b8', true, 250),
('Golden Hour Outdoor Portrait', 'universal', 'outdoor', 'Warm natural sun flare with soft greenery in the background', array['outdoor','golden-hour','natural','cinematic'], 'an outdoor portrait during golden hour with warm sun flare, soft rim lighting, natural greenery softly blurred in the background, dreamy and cinematic atmosphere', '#fb923c', false, 260);
