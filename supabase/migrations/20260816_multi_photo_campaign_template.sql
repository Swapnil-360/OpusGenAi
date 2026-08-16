-- Already applied to production via Supabase MCP on 2026-08-16 — this file
-- exists for repo history / reproducibility on other environments.
--
-- One new video template: a multi-shot marketing campaign built from ALL of
-- the user's uploaded reference photos (product-only shots, product+person,
-- lifestyle, macro/detail, etc.), not a single animated image. Uses
-- image_slots_optional (not image_slot_labels) since the prompt itself is
-- written to infer each photo's role from its content rather than needing a
-- specific numbered shot per slot — the user just adds 1-3 of their own
-- photos, however many they have.
--
-- The prompt is stored verbatim from what was supplied, with one deliberate
-- edit: the trailing "OPTIONAL USER CREATIVE DIRECTION ... [USER_CUSTOM_PROMPT]"
-- section was dropped. That section describes exactly the mechanism this app
-- already has — the "Anything to add? (optional)" free-text box, appended
-- automatically by resolveTemplatePrompt(). Keeping a literal
-- "[USER_CUSTOM_PROMPT]" in the stored prompt would have been misread by
-- extractPlaceholders() as a required [FIELD] the user must fill in (its
-- regex matches any bracketed text under 60 chars, not just this app's own
-- [FIELD] convention) — creating a spurious required text box in the UI.

insert into public.templates
  (name, template_type, category, description, tags, prompt, image_slot_labels, image_slots_optional, accent_color, is_pro, sort_order)
values
($$Product Marketing — Multi-Shot Campaign$$, 'video', 'campaign',
 $$Combine several of your own product photos into one cinematic multi-shot ad campaign.$$,
 ARRAY['campaign','multi-image','marketing','commercial','multi-shot'],
$$Create a premium cinematic commercial using ALL uploaded reference images as visual references for the same advertising campaign.

IMPORTANT REFERENCE RULE:

Treat the uploaded images as multiple reference shots belonging to the same product, brand, person, environment, or campaign.

Analyze every uploaded image and maintain visual consistency between them.

Do not simply animate one image. Build a continuous cinematic advertising sequence that moves naturally from one reference image to the next.

The uploaded reference images may contain:

* Product-only shots
* Product with a person or model
* Product being held
* Product being used
* Product texture or application
* Lifestyle scenes
* Secondary product variations
* Detail or macro shots

Use each reference image according to its visual content and role.

PRODUCT CONSISTENCY:

If a product appears in the references, preserve its exact identity throughout the entire video.

Maintain the same:

* Product shape
* Packaging
* Logo
* Typography
* Colors
* Materials
* Cap or applicator
* Proportions
* Surface details

Never redesign, deform, duplicate, replace, or randomly alter the product.

If the same person appears in multiple reference images, maintain consistent facial identity, hairstyle, clothing characteristics and overall appearance.

Do not invent a different person when transitioning between reference images.

CAMPAIGN STRUCTURE:

Create a cinematic multi-shot advertisement rather than a single continuous shot.

Use the uploaded images as the visual foundation for the sequence.

SHOT 1 — CINEMATIC INTRO:

Begin with the strongest product or visual reference.

Create an elegant cinematic opening using a slow camera push-in, subtle camera slide, controlled parallax or macro movement.

Establish the campaign's visual mood immediately.

Use premium commercial lighting, realistic shadows, sophisticated color grading and shallow depth of field.

SHOT 2 — PRODUCT DETAIL:

Transition naturally into a detailed product shot.

Use macro cinematography to reveal packaging, texture, material, logo and craftsmanship.

Create subtle product rotation, camera orbit, focus pull or controlled movement.

Keep the product clearly recognizable.

SHOT 3 — HUMAN / LIFESTYLE:

If a model or person appears in the uploaded references, transition naturally into the human/lifestyle scene.

Preserve the person's identity and appearance from the reference.

Create subtle realistic movement such as breathing, hand movement, turning, applying the product, holding the product or looking toward the camera.

Avoid exaggerated facial movement or unnatural body motion.

If no person reference exists, replace this sequence with an environmental or product-interaction shot appropriate to the product category.

SHOT 4 — PRODUCT INTERACTION:

If the references show the product being used, recreate the interaction naturally.

Examples:

Cosmetics:
product being applied, cream dispensed, serum dropping, lipstick application, skincare application.

Beverage:
can opening, pouring, liquid splash, condensation, drinking or ingredients interacting with the product.

Food:
opening package, serving, pouring, melting, stretching, ingredient interaction.

Fashion:
wearing, fabric movement, walking, close-up of material and stitching.

Technology:
holding, wearing, interacting with or using the device.

Keep the interaction physically realistic.

SHOT 5 — HERO TRANSITION:

Create a visually impressive transition from the human or lifestyle scene back to the product.

Use environmental movement, foreground objects, light transitions, liquid, fabric, particles, focus pulls or camera movement as appropriate.

Do not create random effects that do not belong to the brand.

SHOT 6 — FINAL HERO SHOT:

Finish with a powerful premium product hero shot.

Place the product in a carefully designed cinematic environment inspired by the uploaded references.

Use dramatic but controlled lighting, beautiful highlights, realistic reflections and subtle atmospheric depth.

The product should be clearly visible and recognizable.

CAMERA LANGUAGE:

Use professional commercial cinematography throughout the video.

Include a combination of:

Slow cinematic push-ins
Smooth camera slides
Controlled camera orbits
Macro close-ups
Focus pulls
Low-angle hero shots
Subtle handheld movement where appropriate
Smooth tracking shots
Elegant speed ramps

Avoid random camera movement.

Every camera movement should have a visual purpose.

TRANSITIONS:

Create seamless transitions between the uploaded reference images.

Do not make the transitions look like unrelated clips.

Use visual continuity such as:

Matching camera movement
Matching composition
Foreground wipes
Focus transitions
Light transitions
Object movement
Liquid movement
Fabric movement
Natural environmental motion

The final video should feel like one professionally directed advertising campaign rather than separate AI-generated clips.

LIGHTING:

Use premium commercial lighting appropriate to the product.

Maintain lighting consistency across shots.

Use realistic highlights, shadows, reflections, depth and material response.

Avoid excessive artificial glow or unrealistic CGI lighting.

VISUAL STYLE:

High-end commercial advertising
Luxury editorial cinematography
Photorealistic materials
Premium art direction
Natural human motion
Realistic product physics
Sophisticated color grading
Cinematic depth of field
Professional beauty/fashion/product photography

MOTION QUALITY:

Motion must be smooth, physically believable and controlled.

Hands must remain anatomically correct.

Faces must remain consistent with the reference images.

Products must maintain their exact structure.

Do not introduce random objects, people, packaging or branding that are not present in the references unless required by the campaign concept.

FINAL RESULT:

Create a polished cinematic advertisement that feels like it was produced by a professional commercial production studio.

The uploaded images should act as the visual storyboard and identity references for the entire video.

Do not simply animate each image independently.

Connect the references through coherent camera movement, subject movement, lighting, environment and visual storytelling.

The final result should feel intentional, premium, cinematic and brand-ready.$$,
 ARRAY[]::text[], true,
 '#6366f1', true, 5);
