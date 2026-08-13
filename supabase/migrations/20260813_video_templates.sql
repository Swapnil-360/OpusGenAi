-- Already applied to production via Supabase MCP on 2026-08-13 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Adds a fourth template_type, 'video', for motion prompts that drive the
-- image-to-video generator (a camera-movement brief) rather than a still-image
-- scene. Also adds preview_video_url: video templates advertise themselves with
-- a short looping clip, with cover_image_url acting as the poster/fallback
-- frame until a preview clip has actually been generated.

alter table public.templates drop constraint if exists templates_template_type_check;
alter table public.templates
  add constraint templates_template_type_check
  check (template_type in ('production', 'universal', 'campaign', 'video'));

alter table public.templates
  add column if not exists preview_video_url text;

-- Eight motion templates, written to the same structure the AI Suggest route
-- (app/api/enhance-video-prompt) targets: opening shot and composition, how the
-- camera moves, lighting/atmosphere, an explicit product-preservation clause,
-- and a closing technical-quality line.
insert into public.templates
  (name, template_type, category, description, prompt, tags, accent_color, is_pro, sort_order)
values
  ('Slow Push-In Hero', 'video', 'luxury',
   'Camera glides slowly toward the product — the classic premium hero shot',
   'Open on a wide, perfectly balanced composition with the product centred in frame against a softly lit backdrop. The camera performs a slow, steady push-in toward the product, easing gently as it settles into a tight hero framing. Soft key light rakes across the surface, catching subtle highlights on the edges while deep, controlled shadows fall away behind. The atmosphere is calm, premium and deliberate, with fine dust motes drifting through the light beam. The product must remain absolutely stable and unchanged throughout — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, premium studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['push-in','luxury','hero','cinematic'], '#c9a227', false, 300),
  ('Orbit Reveal', 'video', 'dynamic',
   'Smooth 180° orbit around the product, showing every angle',
   'Open on a three-quarter view of the product resting on a reflective surface. The camera begins a smooth, continuous orbit around the product at a constant radius, sweeping roughly one hundred and eighty degrees so every face of the packaging is revealed in turn. Light sweeps dynamically across the surface as the angle changes, producing travelling highlights and shifting reflections that emphasise the material finish. Background remains softly out of focus, keeping the product isolated and dominant. The product must remain fixed and unchanged for the entire move — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, premium studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['orbit','rotate','reveal','dynamic'], '#3b82f6', false, 310),
  ('Pull-Back Reveal', 'video', 'dynamic',
   'Starts on an extreme close-up detail, pulls back to the full product',
   'Open on an extreme macro close-up of a single detail — the cap edge, a label texture, a droplet on the surface — filling the entire frame with tactile detail. The camera pulls back smoothly and steadily, the frame widening to progressively reveal the full product standing in its environment, settling on a balanced full-product composition. Focus racks subtly during the move, holding the product crisp as the surrounding scene resolves. Lighting is soft and directional, with gentle falloff toward the edges of frame. The product must remain consistent throughout the pull-back — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, premium studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['pull-back','macro','reveal','detail'], '#8b5cf6', false, 320),
  ('Liquid Splash Motion', 'video', 'dynamic',
   'Water and droplets burst around the product in dramatic slow motion',
   'Open tight on the product centred in frame, cold and beaded with condensation. Water surges into the shot from the sides in dramatic slow motion, splashing and curling around the base while individual droplets arc through the air and catch the light. The camera holds steady with a very slight drift inward, letting the liquid motion carry the energy of the shot. Crisp backlighting rims the droplets and makes the splash read sharply against a darker background. The product must stay perfectly stable at the centre and completely unchanged — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, premium studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['splash','liquid','slow-motion','energetic'], '#06b6d4', false, 330),
  ('Golden Hour Drift', 'video', 'natural',
   'Warm natural sunlight drifts across the product with gentle camera motion',
   'Open on the product in a warm, naturally lit setting during golden hour. The camera drifts slowly sideways in a gentle parallax move while warm sunlight rakes across the frame, casting long soft shadows that shift subtly as the move progresses. Dappled light and faint lens flare bloom at the edges, and fine particles drift lazily through the warm beam. The mood is organic, inviting and premium without feeling staged. The product must remain steady and unchanged as the light and camera move around it — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, natural warm lighting, shallow depth of field, high-end commercial cinematography.',
   array['golden-hour','natural','warm','drift'], '#f59e0b', false, 340),
  ('Dramatic Shadow Play', 'video', 'moody',
   'Hard directional light and moving shadows for a bold, moody mood',
   'Open on the product lit by a single hard directional source against a deep, near-black background. A slow-moving shadow pattern travels across the frame — as though cast by a slat or blind drifting past the light — alternately revealing and concealing portions of the product with strong graphic contrast. The camera creeps forward almost imperceptibly, building tension. Highlights are specular and controlled; shadows are rich and deep with clean falloff. The mood is bold, editorial and cinematic. The product must remain fixed and unchanged as the light moves over it — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, dramatic studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['moody','shadow','dramatic','contrast'], '#64748b', true, 350),
  ('Floating Weightless', 'video', 'minimal',
   'The product hovers and rotates slowly in clean, minimal negative space',
   'Open on the product suspended weightlessly in the centre of a clean, minimal, softly gradiented space. It rotates slowly and smoothly on its vertical axis while floating with an almost imperceptible bob, as though gravity has been switched off. The camera holds nearly still, drifting only slightly to add life. Lighting is broad and even with soft wraparound falloff, producing gentle gradients across the surface and a faint contact-free shadow below. The mood is calm, modern and premium. The product must remain intact and unchanged through the entire rotation — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, soft studio lighting, shallow depth of field, high-end commercial cinematography.',
   array['floating','minimal','rotate','clean'], '#e2e8f0', false, 360),
  ('Energetic Snap Zoom', 'video', 'dynamic',
   'Punchy fast zoom with motion energy — built for social and ads',
   'Open on a medium-wide shot of the product with a bright, high-contrast backdrop. The camera executes a punchy, fast snap-zoom toward the product, decelerating hard into a tight hero frame with a brief settle at the end. Light streaks and subtle motion blur trail the move, adding kinetic energy, before everything resolves crisply on the product. Colours are saturated and bold, the pacing quick and confident, tuned for social-first advertising. The product must stay perfectly stable and unchanged through the zoom and settle — preserve its exact shape, colour, proportions, branding, logo and all visible text with zero distortion, morphing, duplication or warping. No people, no hands, no additional products, no added text or logo overlays. Photorealistic, punchy commercial lighting, shallow depth of field, high-end commercial cinematography.',
   array['snap-zoom','energetic','social','bold'], '#dc2626', false, 370);
