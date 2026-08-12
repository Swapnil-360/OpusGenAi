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
