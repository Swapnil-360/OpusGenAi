-- Already applied to production via Supabase MCP on 2026-08-15 — this file
-- exists for repo history / reproducibility on other environments.
--
-- Replaces the original 8 placeholder video templates (generic motion-style
-- names like "Slow Push-In Hero", camera-movement categories) with 16
-- product-category-specific prompts, one per category — cosmetics, lipstick,
-- skincare, perfume, drinks, soda, energy drink, ice cream, chocolate, shoes,
-- sneakers, clothing, watch/jewelry, food packaging, electronics, and a
-- generic AI-directed fallback. `category` on each row IS the product type,
-- matching the new VIDEO_CATEGORIES list in lib/templates-data.ts — the same
-- value drives both the filter chips and the label shown on the template card.
--
-- All single-image templates (no @ImageN references, no image_slot_labels) —
-- none of these need the multi-image reference-photo feature.

delete from public.templates where template_type = 'video';

insert into public.templates
  (name, template_type, category, description, tags, prompt, accent_color, is_pro, sort_order)
values

($$Cosmetics — Luxury Editorial$$, 'video', 'cosmetics',
 $$Cinematic beauty campaign with flowing textures and elegant macro reveals.$$,
 ARRAY['cosmetics','luxury','macro'],
$$Create a premium cinematic cosmetics advertising video using the uploaded product image as the exact product reference.

Preserve the product's exact packaging, shape, proportions, colors, logo, typography, cap, applicator and visible details throughout the entire video. Never redesign, deform, duplicate, or replace the product.

Begin with a clean elegant beauty composition and slowly reveal the product through cinematic camera movement. Transition into an artistic macro sequence where cosmetic textures such as glossy liquid, cream, pigment, powder or serum flow dynamically around the product.

Create elegant floating particles, smooth flowing textures and controlled product interaction, with the cosmetic texture visually expressing the product's character.

Use sophisticated studio lighting, realistic reflections, soft shadows, shallow depth of field and high-end beauty campaign aesthetics.

Include smooth cinematic camera movements, macro close-ups, slow rotation, elegant push-ins and seamless transitions between scenes.

Finish with a powerful clean hero shot of the product centered in frame.

Photorealistic luxury cosmetics commercial, realistic physics, premium editorial cinematography, high detail, natural motion, no text distortion, no packaging deformation, no duplicate products.$$,
 '#ec4899', true, 10),

($$Lipstick / Lip Tint — Pigment Motion$$, 'video', 'lipstick',
 $$Glossy pigment sweeps and macro texture shots around your product.$$,
 ARRAY['lipstick','beauty','macro'],
$$Create a high-end cinematic lipstick or lip tint advertising video using the uploaded product image as the exact product reference.

Preserve the exact product packaging, tube, cap, applicator, logo, typography, colors and proportions throughout the entire video.

Start with a minimal beauty composition. Slowly move the camera toward the product before introducing flowing cosmetic pigment matching the product's color.

Create beautiful liquid lipstick and glossy pigment strokes that sweep through the scene in slow controlled motion. Let the pigment wrap around, pass behind and partially reveal the product without covering its important branding.

Use macro shots of the cosmetic texture, glossy highlights and realistic material reflections.

Create elegant transitions using flowing pigment as a visual wipe between shots.

Finish with the product floating or standing in a clean premium hero composition.

Luxury beauty commercial, cinematic macro photography, realistic cosmetic physics, sophisticated lighting, smooth camera motion, photorealistic.$$,
 '#f43f5e', true, 20),

($$Skincare / Serum — Liquid & Glass$$, 'video', 'skincare',
 $$Translucent serum streams and elegant glass reflections.$$,
 ARRAY['skincare','serum','liquid'],
$$Create a cinematic luxury skincare commercial using the uploaded product image as the exact product reference.

Preserve the product's exact bottle, dropper, cap, label, logo, typography, proportions and colors.

Begin with the product resting on a minimal premium surface surrounded by subtle water droplets.

Slowly introduce translucent serum flowing around the product. Create realistic liquid streams, suspended droplets, glossy reflections and elegant splashes.

Transition into extreme macro shots of the serum texture and glass surface before returning to the complete product.

Use controlled slow-motion liquid physics and elegant camera movements including macro push-in, orbit and smooth pull-back.

Lighting should be soft, luminous and premium with realistic glass refraction and reflections.

End with a clean hero shot showing the complete product clearly.

Luxury skincare campaign, photorealistic liquid simulation, premium commercial cinematography, realistic materials, sophisticated and minimal.$$,
 '#38bdf8', true, 30),

($$Perfume — Luxury Film$$, 'video', 'perfume',
 $$Atmospheric fragrance film with mist, fabric and dramatic light.$$,
 ARRAY['perfume','fragrance','luxury'],
$$Create a cinematic luxury fragrance advertising film using the uploaded perfume bottle as the exact product reference.

Preserve the bottle's exact shape, glass, liquid color, cap, label, logo, typography and proportions.

Begin with an atmospheric close-up of the bottle emerging from darkness or soft mist.

Gradually introduce elegant environmental elements representing the fragrance character, such as flowing fabric, flowers, water, smoke-like mist, polished stone or botanical particles.

Create slow graceful movement around the bottle while keeping the product stable and recognizable.

Use dramatic directional lighting, beautiful glass reflections, controlled shadows and cinematic depth of field.

Use slow camera orbiting, macro detail shots, elegant push-ins and smooth transitions.

Finish with a luxurious centered hero shot of the perfume bottle.

High-end fragrance commercial, cinematic luxury aesthetic, photorealistic glass, realistic atmosphere, sophisticated lighting, premium fashion-film cinematography.$$,
 '#a78bfa', true, 40),

($$Drinks — Dynamic Liquid$$, 'video', 'drinks',
 $$High-energy splash and fresh-ingredient motion around your can or bottle.$$,
 ARRAY['drinks','beverage','liquid'],
$$Create a dynamic cinematic beverage commercial using the uploaded drink can or bottle image as the exact product reference.

Preserve the exact packaging design, proportions, colors, logo, typography, graphics and product identity throughout the entire video.

Begin with the product in a clean minimal environment with dramatic natural light and subtle shadows.

Slowly rotate and move the product through the frame, then transition into a high-energy liquid sequence.

Create realistic splashing liquid surrounding the product, with droplets moving naturally in slow motion. Introduce fresh ingredients associated with the beverage, such as citrus slices, berries, mint, fruit, ice or other relevant ingredients.

Make the ingredients dynamically fly around the product while the product remains clearly recognizable.

Use seamless transitions between clean product shots, liquid simulations and ingredient sequences.

Include dramatic macro close-ups of condensation, droplets, packaging texture and beverage surface.

Finish with the product floating or standing heroically against a clean colorful background with strong commercial lighting.

Photorealistic beverage advertising, realistic liquid physics, realistic condensation, cinematic camera movement, high-speed commercial photography, premium product film.$$,
 '#06b6d4', true, 50),

($$Soda — Ingredient Explosion$$, 'video', 'soda',
 $$Sparkling burst of ice, bubbles and fresh ingredients.$$,
 ARRAY['soda','beverage','energetic'],
$$Create a high-energy premium soda commercial using the uploaded beverage can or bottle as the exact product reference.

Keep the product's packaging, logo, typography, colors, proportions and graphics perfectly consistent throughout the entire video.

Start with a clean hero shot. The product slowly rotates while condensation forms naturally on its surface.

Suddenly transition into an energetic burst of sparkling liquid, ice cubes and fresh ingredients associated with the flavor.

Create a dynamic frozen-in-time effect where droplets, ice and ingredients fly around the product while the product remains the visual center.

Use fast cinematic camera movement followed by brief slow-motion macro shots.

Show realistic carbonation bubbles, condensation, liquid splashes and detailed surface reflections.

End with all elements settling into a clean premium product composition.

High-end beverage commercial, photorealistic fluid simulation, realistic physics, dramatic lighting, energetic cinematography, premium advertising quality.$$,
 '#f97316', true, 60),

($$Energy Drink — High Energy$$, 'video', 'energy-drink',
 $$Glowing particles and rapid liquid bursts for maximum energy.$$,
 ARRAY['energy-drink','sports','dynamic'],
$$Create an energetic cinematic advertising video using the uploaded energy drink product image as the exact product reference.

Preserve the exact can design, branding, typography, colors and proportions.

Begin with the product suspended in a dark atmospheric environment.

Introduce powerful streams of liquid and rapidly moving particles around the product. Create bursts of energy represented through glowing particles, vapor, splashing liquid and fast-moving environmental elements while keeping the product physically realistic.

Use rapid camera pushes, orbiting movements and controlled speed ramps.

Transition between extreme macro shots of condensation and dramatic full-product shots.

Create a final explosive hero moment where the product is surrounded by its visual energy and then settles into a clean centered composition.

Premium sports and energy drink commercial, cinematic lighting, realistic physics, dynamic motion, photorealistic product rendering.$$,
 '#84cc16', true, 70),

($$Ice Cream — Melt & Ingredients$$, 'video', 'ice-cream',
 $$Appetizing slow-motion melt with matching ingredients.$$,
 ARRAY['ice-cream','food','dessert'],
$$Create a premium cinematic ice cream advertising video using the uploaded ice cream product image as the exact product reference.

Preserve the exact packaging, container, colors, logo, typography and proportions.

Begin with a beautifully lit hero shot of the product.

Slowly introduce creamy ice cream textures, melting surfaces and small droplets of condensation.

Create an appetizing slow-motion sequence where the ice cream texture stretches, melts and folds naturally. Introduce relevant ingredients such as strawberries, chocolate, caramel, nuts, vanilla, cookies or fruit depending on the uploaded product.

Let the ingredients float and move naturally around the product before transitioning back to the hero shot.

Use macro photography to capture creamy texture, melting details and realistic highlights.

Finish with the product surrounded by a beautiful arrangement of its ingredients.

Photorealistic food commercial, realistic cream physics, appetizing textures, cinematic slow motion, premium advertising photography, natural lighting.$$,
 '#fb7185', true, 80),

($$Chocolate / Candy — Melting Chocolate$$, 'video', 'chocolate',
 $$Glossy melted chocolate flows with matching ingredients.$$,
 ARRAY['chocolate','candy','food'],
$$Create a luxurious cinematic chocolate advertising film using the uploaded product image as the exact product reference.

Preserve the exact packaging, logo, typography, colors, proportions and product appearance.

Begin with a minimal elegant composition.

Slowly reveal glossy melted chocolate flowing through the scene. Create realistic chocolate streams, droplets and smooth folds surrounding the product.

Introduce relevant ingredients such as cocoa beans, nuts, caramel, hazelnuts, berries or other ingredients suggested by the product.

Use macro shots of glossy chocolate texture and detailed packaging.

Create smooth transitions using flowing chocolate as a visual transition element.

Finish with the product surrounded by carefully arranged ingredients in a premium hero composition.

Luxury food advertising, photorealistic chocolate simulation, realistic textures, cinematic macro photography, sophisticated lighting.$$,
 '#92400e', true, 90),

($$Shoes — Fashion Product Film$$, 'video', 'shoes',
 $$Dramatic orbit and craftsmanship close-ups for footwear.$$,
 ARRAY['shoes','fashion','footwear'],
$$Create a premium cinematic fashion advertisement using the uploaded shoe image as the exact product reference.

Preserve the exact shoe design, silhouette, colors, materials, stitching, sole, logo, patterns and proportions.

Begin with a dramatic close-up revealing the shoe through controlled camera movement.

Slowly orbit around the shoe while revealing its material details and craftsmanship.

Transition into a dynamic fashion environment where the shoe moves naturally through the scene, with subtle dust, fabric movement, water splashes or environmental particles depending on the shoe's style.

Use low-angle hero shots, macro detail shots and smooth tracking movements.

Create elegant speed ramps and seamless transitions between close-ups and full-product compositions.

Finish with the shoe in a powerful hero position with dramatic lighting.

High-end footwear commercial, cinematic fashion film, photorealistic materials, realistic movement, premium studio cinematography.$$,
 '#64748b', true, 100),

($$Sneakers — Street / Dynamic$$, 'video', 'sneakers',
 $$Energetic street-style motion with dust and dramatic light.$$,
 ARRAY['sneakers','street','dynamic'],
$$Create a dynamic cinematic sneaker advertisement using the uploaded sneaker image as the exact product reference.

Preserve the sneaker's exact shape, sole, colors, materials, stitching, logos, patterns and proportions.

Begin with an extreme close-up of the sneaker surface.

Use a smooth rotating camera movement to reveal the entire sneaker.

Transition into a dynamic street-inspired environment with controlled dust, subtle particles and atmospheric movement.

Create energetic camera movements including low-angle tracking, orbiting, rapid push-ins and slow-motion detail shots.

Show the sneaker floating or moving through the environment while maintaining physically realistic motion.

Use dramatic directional lighting and strong shadows to emphasize the shoe's silhouette and materials.

Finish with a clean hero shot.

Premium sneaker commercial, cinematic sports-fashion advertising, realistic materials, dynamic camera movement, photorealistic.$$,
 '#dc2626', true, 110),

($$Clothing — Fabric Motion$$, 'video', 'clothing',
 $$Elegant fabric movement and macro stitching detail.$$,
 ARRAY['clothing','apparel','fashion'],
$$Create a premium fashion campaign video using the uploaded clothing product image as the exact reference.

Preserve the exact garment design, colors, patterns, logos, graphics, stitching, fabric texture and proportions.

Present the clothing in an elegant fashion environment.

Begin with a close-up of the fabric texture and stitching, then smoothly reveal the complete garment.

Create realistic fabric movement as if affected by a gentle controlled breeze. Allow the garment to naturally fold, unfold and move through the frame.

Use cinematic camera tracking, slow orbiting, macro fabric shots and elegant transitions.

Highlight the material quality through realistic shadows, folds, reflections and fabric movement.

Finish with a strong full-product fashion hero shot.

High-end fashion commercial, photorealistic fabric simulation, luxury editorial cinematography, realistic cloth movement, premium campaign aesthetic.$$,
 '#eab308', true, 120),

($$Watch / Jewelry — Luxury Macro$$, 'video', 'watch-jewelry',
 $$Extreme macro reveal of metal, gemstones and reflections.$$,
 ARRAY['watch','jewelry','luxury'],
$$Create a luxury cinematic product advertisement using the uploaded watch or jewelry image as the exact product reference.

Preserve the exact design, shape, metal, gemstones, dial, hands, bracelet, logo, proportions and surface details.

Begin with an extreme macro shot revealing fine material details.

Slowly move the camera across the product while controlled highlights travel across the metal and glass surfaces.

Introduce elegant reflections, subtle floating particles and premium atmospheric depth.

Use slow cinematic rotation and macro camera movements to reveal craftsmanship from multiple angles.

Create realistic metal reflections, glass refraction and gemstone highlights.

Finish with a perfectly composed luxury hero shot.

Ultra-premium jewelry advertising, photorealistic materials, cinematic macro photography, realistic reflections, luxury fashion-film aesthetic.$$,
 '#c9a227', true, 130),

($$Food Packaging — Ingredient Motion$$, 'video', 'food-packaging',
 $$Fresh ingredients in motion around your package.$$,
 ARRAY['food','packaging','ingredients'],
$$Create a premium cinematic food advertising video using the uploaded food package as the exact product reference.

Preserve the exact packaging, logo, typography, colors, graphics, proportions and product identity.

Begin with a clean hero shot of the package.

Slowly introduce fresh ingredients associated with the product, allowing them to move naturally around the package.

Create appetizing close-ups of relevant food textures, crumbs, sauces, steam, melting ingredients, spices or fresh ingredients depending on the product.

Use dynamic ingredient motion and seamless transitions while keeping the package clearly visible.

Use warm cinematic lighting, realistic food textures, natural shadows and premium commercial photography.

Finish with the package surrounded by beautifully arranged ingredients.

Photorealistic food advertising, appetizing textures, realistic physics, cinematic camera movement, premium commercial quality.$$,
 '#f59e0b', true, 140),

($$Headphones / Electronics — Futuristic$$, 'video', 'electronics',
 $$Sleek futuristic reveal with light trails and particles.$$,
 ARRAY['electronics','tech','futuristic'],
$$Create a premium cinematic technology advertising video using the uploaded product image as the exact product reference.

Preserve the exact product design, shape, colors, materials, buttons, logos and proportions.

Begin with a minimal dark or futuristic environment.

Slowly reveal the product through controlled camera movement and dramatic lighting.

Introduce subtle abstract light trails, particles and atmospheric elements that respond to the product's movement without covering it.

Use smooth product rotation, macro detail shots, cinematic push-ins and elegant transitions.

Highlight premium materials, edges, textures and reflective surfaces.

Finish with a clean centered hero shot against a sophisticated background.

Photorealistic technology commercial, premium product cinematography, realistic materials, cinematic lighting, sophisticated futuristic atmosphere.$$,
 '#3b82f6', true, 150),

($$Generic Product — AI Directed$$, 'video', 'generic',
 $$Let AI direct a premium concept matched to your product.$$,
 ARRAY['generic','universal','ai-directed'],
$$Create a premium cinematic advertising video using the uploaded product image as the exact product reference.

The uploaded image defines the exact identity of the product. Preserve its shape, proportions, packaging, colors, logo, typography, materials and all visible details consistently throughout the entire video.

Analyze the product visually and create an advertising concept that naturally matches its category, material, color palette, purpose and brand character.

Begin with a clean hero composition. Gradually introduce visually relevant environmental elements, materials, textures or ingredients associated with the product.

Create cinematic product movement, realistic physical interaction, elegant camera transitions, macro detail shots and a visually striking hero sequence.

Use professional commercial lighting, realistic shadows, reflections, depth of field and physically believable motion.

The product must remain recognizable and visually consistent throughout the entire video.

End with a strong clean hero shot suitable for a premium advertisement.

Photorealistic commercial cinematography, sophisticated art direction, realistic physics, premium product advertising, natural motion.$$,
 '#8b5cf6', true, 160);
