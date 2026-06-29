text
---
name: cinematic-scroll-engine
description: Premium scroll-driven frame animation. Vanilla HTML/CSS/JS + GSAP/ScrollTrigger + Lenis. Split layout. Zero black screens. Always-visible product. Nav glass on scroll. Hero video contained.
---

# Cinematic Scroll Engine

Build ultra-premium scroll-driven experience using **VANILLA HTML/CSS/JS ONLY**. No React/Vue/Svelte.

## Core Technical Mandates (Non-Negotiable)

1. **Lenis Smooth Scroll** — store the return value for downstream use:
   ```js
   function initLenis() {
     const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
     lenis.on('scroll', ScrollTrigger.update);          // REQUIRED — keeps ST in sync with Lenis
     gsap.ticker.add((time) => lenis.raf(time * 1000)); // REQUIRED
     gsap.ticker.lagSmoothing(0);
     return lenis;  // ALWAYS return — needed for nav glass and other scroll listeners
   }

   // In init():
   const lenis = initLenis();
   ```

2. **Canvas: ALWAYS transparent — zero gray bars**:
   ```js
   // DO: clearRect before drawing
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.drawImage(img, x, y, w, h);
   // DON'T: ctx.fillRect (causes gray bars if sampled bg ≠ page bg)
   ```
   CSS: `#product-canvas { background: transparent; }` + `.sticky-visual { background: var(--bg-dark); }`

3. **Frame sequence — GSAP tween pattern** (NOT onUpdate-only):
   ```js
   const frameProxy = { val: 0 };
   gsap.to(frameProxy, {
     val: TOTAL_FRAMES - 1,
     ease: 'none',       // linear mapping scroll → frame
     onUpdate() { drawFrame(frameProxy.val); },
     scrollTrigger: {
       trigger: '#product-story',
       start: 'top top',
       end: 'bottom bottom',
       scrub: 0.6,        // smooth but responsive
     },
   });
   ```
   Using `onUpdate` alone on a `ScrollTrigger.create` without a GSAP tween is unreliable for frame sequences.

4. **CSS Sticky — NOT `position: fixed`**:
   Canvas lives in `.sticky-visual { position: sticky; top: 0; height: 100vh }`. No `pin: true` on the canvas trigger. No dedicated 800vh empty section. CSS handles the sticky; GSAP handles the frame update.

5. **Canvas sizing** — fill the full right column, no scale-down:
   ```js
   function resizeCanvas() {
     const col = document.querySelector('.story-canvas-col');
     canvas.width  = col ? col.offsetWidth : Math.round(window.innerWidth * 0.5);
     canvas.height = window.innerHeight;
   }
   ```

6. **Pinned Stats**: `pin: true`, `scrub: 1`, `end: '+=100vh'`. Counter = `Math.round(self.progress * target)`.

7. **Lead Modal**: At 95% scroll, center modal. `backdrop-filter: blur(10px)` + `-webkit-backdrop-filter`. `@supports not (backdrop-filter)` fallback.

8. **Hero clip-path**: Set only in JS via `gsap.fromTo` — NOT in CSS. If set in CSS the text is invisible on slow/failed JS load.
   ```js
   gsap.fromTo('.hero-text',
     { clipPath: 'circle(0% at 30% 90%)' },
     { clipPath: 'circle(150% at 30% 90%)', duration: 1.8, ease: 'power2.out' }
   );
   ```

9. **Nav Glass on Scroll** — scroll-aware backdrop blur via Lenis event:
   ```js
   function initNavScroll(lenis) {
     const nav = document.getElementById('nav');
     lenis.on('scroll', ({ scroll }) => {
       nav.classList.toggle('nav--scrolled', scroll > 80);
     });
   }
   ```
   CSS: `#nav.nav--scrolled { background: rgba(7,7,7,0.72); backdrop-filter: blur(18px) saturate(180%); -webkit-backdrop-filter: blur(18px) saturate(180%); border-bottom: 1px solid rgba(244,244,244,0.04); }`
   Always provide `@supports not (backdrop-filter)` fallback: `background: rgba(7,7,7,0.94)`.

10. **Canvas fade-in**: Start at `top bottom` (as product-story enters viewport), not `top 90%`.
    ```js
    scrollTrigger: { trigger: '#product-story', start: 'top bottom', toggleActions: 'play none none none' }
    ```

## Layout Architecture (eliminates black screens)
```
#hero          → grid: 42fr 58fr  (text LEFT | video RIGHT — more space for video)
#product-story → grid: 1fr 1fr    (features LEFT | sticky canvas RIGHT)
#stats         → full-width, pinned
#final-cta     → full-width
```
- Machine is **always on screen** during the scroll journey
- No standalone empty scroll sections
- CSS sticky handles visual pinning; no GSAP pin on canvas

## Hero Section
- `display: grid; grid-template-columns: 42fr 58fr; height: 100vh; overflow: hidden; position: relative`
- `#hero::after`: `position: absolute; bottom: 0; height: 22vh; background: linear-gradient(to bottom, transparent, var(--bg)); z-index: 3` — dissolves hero into product-story
- `.hero-text`: solid dark bg, clip-path wipe animated by JS, text bottom-left, `will-change: transform`
- `.hero-visual`: `display: flex; align-items: center; justify-content: center; will-change: transform`
- `#hero-video`: **flex child** — `width: 90%; height: auto; max-height: 88vh; object-fit: contain` — shows FULL video, no cropping
- `.hero-edge-fade`: `linear-gradient(to right, #070707 0%, rgba(7,7,7,0.65) 18%, transparent 55%)` — seamless blend between columns

## Hero Parallax (Two-Layer Depth)
```js
// Text column: faster drift — appears in front
gsap.to('.hero-text',   { y: -60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 }});
// Video column: slower drift — appears behind
gsap.to('.hero-visual', { y: -30, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 }});
```
Safe: `#hero { overflow: hidden }` clips any overshoot. `will-change: transform` on both elements.

## Scroll-Cue Fade-Out
```js
gsap.to('.scroll-cue', {
  opacity: 0,
  ease: 'power2.in',
  scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true },
});
```

## Product Story (CSS Sticky Pattern)
```html
<section id="product-story">                   <!-- display:grid; 42fr 58fr → product: 1fr 1fr -->
  <div class="story-text-col">                 <!-- 5 features min-height:100vh each -->
  <div class="story-canvas-col">              <!-- right col, no fixed height -->
    <div class="sticky-visual">               <!-- position:sticky; top:0; height:100vh -->
      <div class="canvas-glow">              <!-- dual radial-gradient copper warmth -->
      <canvas id="product-canvas">           <!-- transparent background -->
      <!-- ::after pseudo for bottom vignette -->
    </div>
  </div>
</section>
```

## Premium Visual Details
- `.canvas-glow`: dual-layer radial gradient — inner `rgba(200,155,123,0.11)` + outer `rgba(200,155,123,0.04)`
- `.sticky-visual::after`: bottom vignette `height: 28%`, `linear-gradient(to bottom, transparent, var(--bg) 95%)` — machine fades into dark
- `.feature-bg-num`: Ghost number (01–05) `position:absolute; font-size: clamp(12rem,22vw,28rem); color: rgba(244,244,244,0.025)` — luxury depth
- Feature animations: `blur-reveal` (blur+fade) and `slide-up` (translateY) alternating, stagger 0.12–0.13s
- Persistent nav bar: `position: fixed`, fades in via JS after hero reveal, glass effect on scroll via Lenis

## Structure
- `index.html`, `css/style.css`, `js/app.js`
- Preload all frames with progress bar — `await preloadFrames()` before hiding loader
- `drawFrame(0)` immediately on load — no blank canvas flash
- `ScrollTrigger.refresh()` after 150ms on init and after resize (debounced 150ms)

## What NEVER to do
- Never `object-fit: cover` on hero video — crops the product, ruins the full reveal
- Never `ctx.fillRect` with a sampled bg color → causes gray bars
- Never `position: fixed` for canvas → creates black void sections
- Never set `clip-path: circle(0%)` in CSS for hero text → invisible text if JS fails
- Never use `ScrollTrigger.create` + `onUpdate` alone for frame sequences (no tween = unreliable)
- Never create a standalone empty 800vh scroll section just to pin a canvas
- Never use `backdrop-filter` without `-webkit-backdrop-filter` fallback (Safari breaks)
- Never forget to return `lenis` from `initLenis()` — nav glass and other listeners need it
