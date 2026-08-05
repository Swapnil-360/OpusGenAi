-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Adds the 9 product-type scene presets (already used as quick "Prompt ideas"
-- chips in /generate when a photo is uploaded — see PRODUCT_SCENE_PRESETS in
-- app/(dashboard)/generate/page.tsx) as real templates too, tagged by product
-- type. cover_image_url starts null: these are meant to show a real tool
-- output, not an AI-generated marketing preview — upload one per template
-- from the admin Templates tab ("Upload photo") as real results come in.

insert into public.templates (name, template_type, category, description, tags, prompt, accent_color, is_pro, sort_order) values
('Perfume / Body Spray', 'production', 'perfume', 'Pure white studio background with soft water droplets and reflection', array['perfume','body-spray','cosmetic','white'], 'on a solid pure white studio background with soft even lighting, subtle water droplets and a soft reflection below, professional cosmetic product photography', '#f472b6', false, 130),
('Skincare', 'production', 'skincare', 'White marble surface with soft natural side lighting', array['skincare','marble','minimalist','beauty'], 'on a solid white marble surface with soft natural side lighting, a few water droplets nearby, clean minimalist skincare photography', '#34d399', false, 140),
('Jewelry', 'production', 'jewelry', 'Black velvet with a single dramatic spotlight for sparkle', array['jewelry','velvet','luxury','spotlight'], 'on a solid black velvet surface with a single dramatic spotlight creating sparkle and highlights, luxury jewelry photography', '#fbbf24', false, 150),
('Watch', 'production', 'watch', 'Brushed titanium surface with dramatic side lighting', array['watch','titanium','luxury','reflections'], 'on a brushed titanium surface with dramatic side lighting and sharp reflections, luxury watch photography', '#94a3b8', false, 160),
('Supplement / Bottle', 'production', 'supplement', 'Clean white studio background with a subtle floor reflection', array['supplement','bottle','pharmaceutical','clean'], 'on a solid white studio background with soft even lighting and a subtle floor reflection, clean pharmaceutical product photography', '#60a5fa', false, 170),
('Sneakers / Shoes', 'production', 'sneakers', 'Floating on a seamless white background with a soft shadow', array['sneakers','shoes','floating','clean'], 'floating on a solid white seamless background with soft studio lighting and a soft shadow beneath, clean sneaker product photography', '#f97316', false, 180),
('Handbag', 'production', 'handbag', 'Warm wooden table with soft natural window light', array['handbag','wood','editorial','warm'], 'on a warm wooden table with soft natural window light, editorial handbag product photography', '#a78bfa', false, 190),
('Electronics', 'production', 'electronics', 'Dark gradient background with cool blue rim lighting', array['electronics','tech','dark','blue'], 'on a solid dark gradient background with cool blue rim lighting and sharp reflections, modern tech product photography', '#38bdf8', false, 200),
('Candle', 'production', 'candle', 'Concrete surface with warm ambient lighting', array['candle','concrete','cozy','lifestyle'], 'on a solid concrete surface with warm ambient lighting and a soft shadow, cozy lifestyle candle photography', '#fb923c', false, 210);
