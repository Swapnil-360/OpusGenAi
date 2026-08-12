-- Run manually in the Supabase SQL Editor.
--
-- Adds a third template_type, 'campaign', plus 8 brand-campaign templates.
--
-- Why a new type rather than reusing 'production': app/api/generate/route.ts
-- appends buildProductEditPrompt() to production templates, which ends with
-- "Remove any other objects, other products, or background clutter — show only
-- this single product as a clean, professional e-commerce product photo."
-- Every prompt below wants the opposite — a crowd at a checkout counter, a
-- 4-pack carrier, an out-of-home billboard, friends at a pool. Filing them as
-- 'production' would have the server actively contradict the prompt.
-- 'universal' is equally wrong: it appends face/identity-preservation language
-- that means nothing for a packaging or billboard shot. buildCampaignEditPrompt()
-- keeps brand/label fidelity (the part that matters when the model redraws
-- packaging) and drops the single-product composition restriction.
--
-- Prompts are adapted from a reference deck of ChatGPT-Image brand-campaign
-- prompts. Two deliberate adaptations:
--   1. The originals are written around a specific sample brand; these say
--      "the uploaded product" instead, so they describe whatever the user
--      actually uploads rather than fighting it.
--   2. The originals assume a multi-image upload (layout ref + logo + variants
--      + lifestyle shots). This app's premium path takes exactly one image, so
--      the brand-identity sheet below is rewritten to work from that single
--      upload rather than referencing assets the user cannot supply.
-- [SQUARE BRACKETS] are left where a real brand name/word must literally
-- appear in the render — same convention as the existing "OpusGen Ai Special"
-- template, whose description tells the user to customise before generating.

alter table public.templates drop constraint if exists templates_template_type_check;
alter table public.templates
  add constraint templates_template_type_check
  check (template_type in ('production', 'universal', 'campaign'));

insert into public.templates
  (name, template_type, category, description, prompt, tags, accent_color, is_pro, sort_order)
values
  (
    'Golden Hour Lifestyle',
    'campaign', 'lifestyle',
    'Hand holding the product close to camera, friends blurred behind in warm sunlight',
    'A lifestyle product photograph featuring the uploaded product, shot in an outdoor amusement park seating area under bright warm golden-hour sunlight. In the foreground, a hand holds the product close to the camera, making it the main focus. The product appears sharp, realistic, cold, and detailed with visible condensation droplets. In the softly blurred background, two young friends enjoy the moment together, with a large ferris wheel structure visible behind them. Place a second unit of the product in the background for depth. Use shallow depth of field, candid framing, natural human interaction, and a warm, authentic lifestyle-ad feel. Overall mood is youthful, energetic, and sunny.',
    array['lifestyle','golden-hour','candid','outdoor'],
    '#f59e0b', false, 100
  ),
  (
    'Convenience Store Crowd',
    'campaign', 'lifestyle',
    'Ultra-wide flash photography — a group of friends grabbing the product at a checkout',
    'A high-energy lifestyle campaign photograph featuring the uploaded product, captured inside a retro convenience-store checkout counter using an ultra-wide-angle lens and direct on-camera flash. Show a diverse group of seven young friends crowding around the counter, laughing, reaching forward, and holding multiple units of the product toward the camera. Place several sharp, condensation-covered products prominently in the foreground, while keeping the people and store environment slightly chaotic and candid. Include snack racks, paper shopping bags, a blue checkout counter, and fluorescent ceiling lights. Use exaggerated wide-angle perspective, close framing, natural expressions, realistic hands, bold streetwear, and an energetic documentary-style composition. Overall mood is chaotic, youthful, and bold.',
    array['flash','wide-angle','retail','gen-z'],
    '#3b82f6', false, 110
  ),
  (
    'Multipack Packaging',
    'campaign', 'packaging',
    'Top-down close-up of a multipack carrier with condensation and packaging detail',
    'A premium product packaging photograph featuring the uploaded product, showing a close-up of a 4-pack arranged in a kraft cardboard carrier. Capture the shot from a slightly top-down close-up angle so the tops of the products are clearly visible, with the branded packaging partially revealed below the carrier. Show four units with realistic condensation droplets on both the products and lids for a cold, fresh look. Include packaging details such as white printed line graphics, a QR code, a recyclable icon, small brand copy, and a minimal illustration in the centre of the carrier. Use a clean bright warm yellow backdrop, sharp studio lighting, soft natural shadows, and a minimal commercial composition. Overall mood is fresh, premium, and modern.',
    array['packaging','multipack','studio','top-down'],
    '#eab308', false, 120
  ),
  (
    'Poolside Party',
    'campaign', 'lifestyle',
    'Two friends laughing at a sunny poolside party, product hero in the foreground',
    'A vibrant outdoor lifestyle photograph featuring the uploaded product, showing two young women laughing together at a sunny poolside garden party while each holds a unit of the product. Place one product close to the camera as the main foreground focus, with the second clearly visible beside it. Style the people in bright orange, yellow and red retro streetwear with colourful sunglasses and natural candid expressions. Use a wide-angle perspective, bright midday sunlight, realistic skin texture, gentle motion in the hair, and a softly detailed background featuring a swimming pool, picnic blankets, friends relaxing, a beach ball and green lawn. Overall mood is playful, social, and vibrantly summery.',
    array['poolside','summer','social','vibrant'],
    '#06b6d4', false, 130
  ),
  (
    'Rooftop Billboard',
    'campaign', 'outdoor',
    'Out-of-home billboard mock-up with bold typography and comic-inspired graphics',
    'A bold outdoor billboard advertisement featuring the uploaded product, mounted on top of a modern city rooftop and photographed from street level against a clear blue daytime sky. The billboard features one oversized rendering of the product, tilted dynamically in the centre with realistic condensation droplets and sharp packaging details. Surround it with large playful typography reading "[YOUR HEADLINE]", bold geometric shapes, and illustrated flavour elements such as fruit slices, bubbles, lightning symbols and expressive icons. Use a high-contrast vibrant green and bright yellow background with energetic comic-inspired graphics. Overall mood is loud, refreshing, and playfully urban.',
    array['billboard','ooh','typography','bold'],
    '#22c55e', true, 140
  ),
  (
    'Ice Bucket Carry',
    'campaign', 'lifestyle',
    'Transparent ice bucket packed with the product, carried in bright poolside sun',
    'A bright outdoor lifestyle product photograph featuring the uploaded product, showing a person carrying a transparent ribbed ice bucket filled with ice and multiple units of the product. Keep the bucket and products as the main focus, with each one clearly visible, accurately proportioned, and covered in realistic condensation droplets. Show only part of the person, wearing a bright yellow oversized T-shirt with festival wristbands, for a natural festival or poolside feel. Use strong warm sunlight, crisp shadows, shallow depth of field, and a softly blurred sunny poolside garden background. Overall mood is fresh, playful, and energetic.',
    array['poolside','ice','festival','summer'],
    '#0ea5e9', false, 150
  ),
  (
    'Cheers Splash',
    'campaign', 'lifestyle',
    'Two products clinking mid-air with a dynamic liquid splash frozen in motion',
    'A refreshing outdoor lifestyle product photograph featuring the uploaded product, showing two hands clinking two units of the product at the centre of the frame. Keep both products sharp, accurately branded, and covered with realistic condensation droplets, with a dynamic liquid splash bursting from the top at the moment of impact. Show only the hands and partial sleeves, with a pink striped sleeve, dark nail polish and a minimal wrist tattoo for a natural lifestyle feel. Use warm golden sunlight, fast-action photography, shallow depth of field, and a softly blurred sunny green garden background. Overall mood is fresh, energetic, and celebratory.',
    array['splash','action','golden-hour','cheers'],
    '#f97316', false, 160
  ),
  (
    'Brand Identity Sheet',
    'campaign', 'identity',
    'Customize: replace [YOUR BRAND], tagline and values with your own before generating',
    'Create a premium, realistic vertical brand identity and product showcase sheet built around the uploaded product. Design the sheet with a large hero logo section at the top reading "[YOUR BRAND]", a secondary strip showing that logo on different brand colours, a colour palette section sampled from the product''s own packaging, a typography section, a product lineup section showing realistic renders of the uploaded product, a bottom grid of lifestyle photographs featuring it, and a final row of minimal icon-based brand values reading "[VALUE 1]", "[VALUE 2]", "[VALUE 3]" and "[VALUE 4]". Include the tagline "[YOUR TAGLINE]" beneath the hero logo. Keep the design clean, minimal, premium and realistic — a soft off-white background, balanced spacing, rounded corners, crisp typography, realistic lighting and accurate product proportions, like a professional brand presentation board. Style: realistic, polished, minimal, editorial, high-end branding presentation.',
    array['brand-sheet','identity','editorial','presentation'],
    '#a78bfa', true, 170
  );

-- Beauty/cosmetics campaign set. Same 'campaign' reasoning: these are artistic
-- editorial scenes (cream swatches, powder clouds, serum flow, fabric and mist
-- around a hero product), so production's "clean, professional e-commerce
-- product photo… remove any other objects" suffix would flatten exactly the art
-- direction they ask for. Every one preserves packaging/logo/typography, which
-- is what buildCampaignEditPrompt() reinforces.
insert into public.templates
  (name, template_type, category, description, prompt, tags, accent_color, is_pro, sort_order)
values
  ('Luxury Skincare Editorial', 'campaign', 'skincare',
   'Sculptural cream and botanical textures arranged around a hero skincare product',
   'Create a premium luxury skincare advertising photograph using the uploaded product image as the exact product reference. Keep the product packaging, bottle, cap, shape, proportions, colors, logo, typography, and label details accurate and recognizable. Do not redesign or alter the product. Create an elegant editorial scene inspired by high-end beauty campaigns. Place the product as the clear hero and surround it with refined skincare-inspired elements such as smooth cream textures, translucent water droplets, soft botanical details, glass, stone, or flowing serum textures. Use sculptural textures and carefully arranged elements to create depth and visual storytelling without overcrowding the frame. The composition should feel artistic, expensive, modern, and professionally art-directed. Use soft diffused studio lighting with realistic highlights, subtle shadows, natural reflections, and premium material rendering. Photorealistic commercial beauty photography, macro-level product detail, realistic textures, sophisticated color grading, shallow depth of field. Avoid generic product mockups, excessive props, distorted packaging, fake text, duplicate products, or an obvious AI-generated appearance.',
   array['skincare','editorial','luxury','texture'], '#c9a227', false, 180),
  ('Serum Liquid Flow', 'campaign', 'skincare',
   'Translucent serum, gel textures and glass-like surfaces flowing around the bottle',
   'Create a high-end commercial advertising photograph using the uploaded serum product image as the exact product reference. Preserve the original bottle, dropper or pump, packaging, proportions, colors, logo, typography, and all visible product details exactly. Build a visually artistic serum-inspired scene where translucent liquid, glossy serum droplets, flowing gel textures, and elegant glass-like surfaces interact with the product. Create the feeling that the serum is flowing through or around the composition while keeping the product clearly visible. Use a clean luxury beauty aesthetic with sophisticated lighting, realistic liquid physics, beautiful highlights, controlled reflections, and subtle shadows. Create an editorial composition with strong depth and premium art direction. The final image should resemble an international skincare campaign photographed by a professional beauty photographer, with extremely realistic materials and product details. No packaging distortion, no fake branding, no random text, no duplicate products, no excessive decoration, no CGI-looking render.',
   array['serum','liquid','gloss','editorial'], '#38bdf8', false, 190),
  ('Lip Color Campaign', 'campaign', 'makeup',
   'Flowing pigment and glossy lipstick texture built around the product''s own shade',
   'Create a visually striking luxury cosmetics advertising photograph using the uploaded lip product image as the exact product reference. Preserve the product''s original packaging, tube, cap, applicator, proportions, colors, logo, typography, and label details. Create an artistic beauty campaign centered around the product''s color and texture. Use flowing pigment, glossy lipstick textures, soft cream, silk-like material, liquid color, or abstract cosmetic strokes that visually interact with the product. Make the cosmetic color the dominant visual element and build a sophisticated composition around it. Create elegant movement and texture, similar to premium editorial cosmetics campaigns. Use clean studio lighting with beautiful highlights, realistic glossy surfaces, controlled shadows, subtle reflections, and strong depth. The product must remain the clear hero and its packaging must be recognizable. Photorealistic commercial beauty photography, luxury cosmetics campaign, artistic composition, premium editorial styling, realistic pigment and material textures. Avoid distorted packaging, unreadable branding, duplicate products, excessive props, or artificial CGI appearance.',
   array['lipstick','pigment','gloss','color'], '#e11d48', false, 200),
  ('Foundation Artistry', 'campaign', 'makeup',
   'Creamy swatches and skin-toned sculptural surfaces around the bottle',
   'Create a premium editorial beauty advertising photograph using the uploaded foundation or concealer product image as the exact product reference. Preserve the original packaging, bottle, tube, cap, applicator, shape, proportions, colors, logo, typography, and visible label details. Create a sophisticated makeup-art environment using smooth foundation swatches, creamy cosmetic textures, elegant skin-inspired tones, soft sculptural surfaces, and flowing makeup pigment. Arrange the textures around the product in an artistic editorial composition. Make the foundation or concealer texture visually prominent while keeping the actual product clearly visible and sharply detailed. Use professional studio lighting, realistic cream textures, subtle shadows, natural reflections, soft depth of field, and refined luxury color grading. The result should look like a real high-end makeup campaign photographed for a premium cosmetics brand. No distorted packaging, fake text, duplicate products, unrealistic skin textures, excessive props, or generic e-commerce photography.',
   array['foundation','swatch','cream','editorial'], '#d6a06a', false, 210),
  ('Powder Bloom', 'campaign', 'makeup',
   'Soft pigment clouds and powder particles in the shade''s own colour',
   'Create a premium fashion-editorial cosmetics campaign using the uploaded blush or highlighter product image as the exact product reference. Preserve the original product packaging, compact, pan, colors, logo, typography, proportions, and visible details accurately. Build the scene around the cosmetic''s color and powder texture. Create elegant flowing powder, soft pigment clouds, delicate cosmetic dust, sculptural powder surfaces, or sweeping color strokes surrounding the product. Use the product shade as the dominant visual color and create a sophisticated monochromatic composition around it. Use dramatic yet refined studio lighting with realistic powder particles, soft shadows, subtle highlights, premium reflections, and cinematic depth. The final photograph should feel artistic, fashionable, luxurious, and suitable for a major beauty campaign. Photorealistic cosmetics photography, high-end editorial art direction, realistic powder texture, sophisticated composition. No packaging distortion, fake branding, duplicate products, excessive particles, or obvious AI-generated artifacts.',
   array['blush','powder','pigment','monochrome'], '#f472b6', false, 220),
  ('Mascara Drama', 'campaign', 'makeup',
   'Bold black pigment strokes and glossy curves — dramatic, minimal, high contrast',
   'Create a premium luxury makeup advertising photograph using the uploaded mascara or eyeliner product image as the exact product reference. Preserve the original packaging, tube, brush, applicator, cap, proportions, colors, logo, typography, and label details exactly. Create a dramatic editorial composition inspired by the visual language of eye makeup. Use flowing black pigment, glossy cosmetic strokes, elegant curves, liquid textures, and sculptural shapes surrounding the product. Create a bold yet minimal visual environment with strong contrast and sophisticated styling. The product should remain the central hero of the image. Use directional studio lighting with controlled highlights, deep realistic shadows, glossy material reflections, cinematic depth, and extremely detailed product rendering. Make the result look like a professionally photographed luxury cosmetics campaign rather than a product render. Photorealistic, high-end beauty advertising, editorial makeup photography, dramatic art direction. No distorted packaging, fake text, duplicate products, random props, or artificial CGI appearance.',
   array['mascara','dramatic','contrast','gloss'], '#64748b', false, 230),
  ('Fragrance Atmosphere', 'campaign', 'fragrance',
   'Cinematic perfume scene — fabric, stone, mist and glass reflections',
   'Create an artistic luxury fragrance advertising photograph using the uploaded perfume bottle image as the exact product reference. Preserve the bottle''s original shape, proportions, cap, glass material, liquid color, label, logo, typography, and packaging details accurately. Create an atmospheric luxury scene that visually communicates the character of the fragrance. Use elegant materials such as flowing fabric, polished stone, water reflections, mist, flowers, wood, glass, or subtle botanical elements depending on the visual identity suggested by the product. Create a cinematic composition with the bottle as the unmistakable hero. Use dramatic directional lighting, beautiful glass reflections, realistic shadows, subtle atmospheric depth, and premium color grading. The image should feel like an international fragrance campaign with sophisticated art direction and a strong emotional atmosphere. Photorealistic luxury perfume photography, cinematic lighting, realistic glass and liquid, refined editorial styling, premium advertising quality. Do not alter the bottle design, label, logo, or typography. Avoid generic perfume mockups and excessive decoration.',
   array['perfume','cinematic','glass','atmospheric'], '#8b5cf6', false, 240),
  ('Cleanser Fresh Water', 'campaign', 'skincare',
   'Water, foam and translucent bubbles interacting with the packaging',
   'Create a premium skincare advertising photograph using the uploaded cleanser or face wash product image as the exact product reference. Preserve the original packaging, bottle or tube, pump, cap, colors, proportions, logo, typography, and label details. Create a fresh, clean visual environment using water, translucent bubbles, soft foam, flowing liquid, clean stone, glass, and subtle botanical elements. Create a visually dynamic composition where water or foam interacts naturally with the product while keeping the packaging clearly visible and sharp. Use bright but sophisticated studio lighting with realistic water droplets, natural reflections, soft shadows, clean highlights, and a fresh premium color palette. The result should feel refreshing, modern, luxurious, and professionally photographed for a global skincare campaign. Photorealistic beauty advertising, realistic water and foam physics, premium editorial photography, high product detail. No distorted packaging, fake branding, duplicate products, excessive bubbles, or generic e-commerce appearance.',
   array['cleanser','water','foam','fresh'], '#22d3ee', false, 250),
  ('Sunscreen Sunlight', 'campaign', 'skincare',
   'Warm sunlight, cream texture and sand for an outdoor luxury feel',
   'Create a premium modern sunscreen advertising photograph using the uploaded sunscreen product image as the exact product reference. Preserve the original packaging, tube or bottle, cap, proportions, colors, logo, typography, and label details accurately. Create a bright sun-inspired editorial environment using translucent cream textures, water droplets, soft sand, glass, subtle botanical elements, and elegant sunlight patterns. Use strong natural-looking sunlight passing through the scene to create beautiful highlights and realistic shadows. Incorporate a subtle sense of protection, freshness, warmth, and outdoor luxury. Keep the product as the clear hero and make the sunscreen texture visually appealing through smooth cream shapes and realistic material details. Photorealistic premium beauty campaign, natural sunlight, sophisticated composition, realistic cream and glass textures, high-end commercial photography. Avoid beach clichés, excessive props, distorted packaging, fake text, duplicate products, or generic stock-photo styling.',
   array['sunscreen','sunlight','cream','outdoor'], '#fbbf24', false, 260),
  ('Body Care Ritual', 'campaign', 'bodycare',
   'Rich lotion, fabric and spa-inspired materials — sensual, clean, no model',
   'Create a sophisticated luxury body-care advertising photograph using the uploaded product image as the exact product reference. Preserve the original packaging, bottle or tube, proportions, colors, cap, pump, logo, typography, and label details. Create an immersive tactile environment using rich cream textures, smooth lotion, water, soft fabric, natural stone, botanical elements, or elegant spa-inspired materials. Make the scene feel sensual, clean, relaxing, and premium without showing a model. Use the product as the central hero with sculptural textures and carefully controlled visual movement around it. Use soft cinematic studio lighting, realistic material response, subtle reflections, natural shadows, shallow depth of field, and luxury editorial color grading. The final image should resemble a premium international body-care campaign. Photorealistic commercial beauty photography, tactile textures, sophisticated art direction, realistic product rendering. No distorted packaging, fake branding, duplicate products, excessive props, or artificial CGI appearance.',
   array['bodycare','lotion','spa','tactile'], '#b8a68a', false, 270),
  ('Hair Care Flow', 'campaign', 'haircare',
   'Flowing strands, glossy liquid and silk-like curves suggesting shine and movement',
   'Create a premium professional hair-care advertising photograph using the uploaded product image as the exact product reference. Preserve the original bottle, tube, pump, cap, packaging, proportions, colors, logo, typography, and label details exactly. Create an artistic environment inspired by healthy flowing hair. Use elegant flowing strands, glossy liquid, smooth cream textures, water, botanical elements, silk-like surfaces, or sculptural curves that visually communicate softness, shine, nourishment, and movement. Create dynamic flowing shapes around the product while maintaining a clean luxury composition. The product must remain the central focus. Use professional studio lighting with realistic highlights, glossy reflections, soft shadows, cinematic depth, and premium beauty color grading. The result should look like a high-end global hair-care advertising campaign photographed in a professional studio. Photorealistic, editorial, luxurious, tactile, visually dynamic, realistic materials. No distorted packaging, fake text, duplicate products, unrealistic hair, or obvious AI-generated elements.',
   array['haircare','shine','flow','silk'], '#14b8a6', false, 280);
