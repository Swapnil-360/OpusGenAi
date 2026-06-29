text
---
name: premium-ui-architect
description: Luxury editorial design system. Split layout, always-visible product. Clash Display. Copper accent. Zero cards, zero black voids. Nav glass on scroll. Hero video contained.
---

# Premium UI Architect

$15k luxury espresso brand site. **ERASE** SaaS/startup patterns.

## Typography (MANDATORY)
- **Clash Display** via Google Fonts CDN for ALL headings.
- Hero h1: `clamp(4rem, 7vw, 11rem)`, `letter-spacing: -0.03em`, `line-height: 0.88`
- Feature h2: `clamp(2.8rem, 4vw, 6rem)`, `letter-spacing: -0.025em`, `line-height: 0.9`
- CTA heading: `clamp(3.5rem, 7vw, 10rem)`
- Labels: `0.7rem uppercase`, `letter-spacing: 0.22em`, `color: var(--copper)`
- Body: `clamp(0.82rem, 0.95vw, 0.92rem)`, `line-height: 1.85`, `color: rgba(244,244,244,0.5)`

## Colors
```css
:root {
  --bg:         #070707;
  --light:      #F4F4F4;
  --copper:     #C89B7B;
  --copper-dim: rgba(200, 155, 123, 0.18);
  --font:       'Clash Display', 'Helvetica Neue', sans-serif;
}
```

## Layout Rules (CRITICAL)
1. **Split layout**: `display: grid; grid-template-columns: 42fr 58fr`. Text LEFT. Machine RIGHT. Always.
   - 42/58 split gives the visual column more breathing room than 50/50.
2. **Video contained, not cropped**: Hero video uses `object-fit: contain` inside a flex-centered column. Show the FULL machine — never crop it with `cover`.
3. **CSS sticky for machine**: Canvas col uses `position: sticky; top: 0; height: 100vh`. Machine stays on screen the entire scroll journey.
4. **Zero cards/borders/containers**: Text sits directly on dark background. No rounded corners, no box-shadows, no card panels.
5. **Zero empty scroll sections**: Every viewport position has visible content. Never an empty 800vh pinned section.

## Page Sections
| Section | Layout | Notes |
|---|---|---|
| `#hero` | grid 42fr 58fr | text LEFT (clip-path reveal), video RIGHT (contained) |
| `#product-story` | grid 1fr 1fr | features LEFT (scroll), canvas RIGHT (sticky) |
| `#stats` | full-width, pinned | 4 copper stat counters in grid |
| `#final-cta` | full-width | "CRAFTED FOR THE OBSESSED" |
| modal | fixed overlay | blur backdrop, email input |

## Hero Pattern
```
.hero-text (left col):
  - background: #070707 (solid dark)
  - clip-path reveal via JS fromTo (NOT set in CSS)
  - padding: 0 5vw 10vh (extra bottom breathing room)
  - will-change: transform (GPU-accelerated parallax)

.hero-visual (right col):
  - display: flex; align-items: center; justify-content: center
  - will-change: transform
  - <video> width: 90%, max-height: 88vh, object-fit: contain, opacity 0 → 0.85 (JS)
  - .hero-edge-fade: linear-gradient(to right, #070707 0%, rgba(7,7,7,0.65) 18%, transparent 55%)
    blends left edge into text col — no hard seam

#hero::after (bottom fade):
  - position: absolute; bottom: 0; height: 22vh
  - linear-gradient(to bottom, transparent, var(--bg))
  - z-index: 3 — dissolves hero into product-story seamlessly
```

## Nav Glass on Scroll (MANDATORY)
Nav starts transparent. After 80px scroll, gains glass effect:
```css
#nav {
  transition: background 0.5s ease, backdrop-filter 0.5s ease, border-color 0.5s ease;
  border-bottom: 1px solid transparent;
}
#nav.nav--scrolled {
  background: rgba(7, 7, 7, 0.72);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-bottom-color: rgba(244, 244, 244, 0.04);
}
@supports not (backdrop-filter: blur(1px)) {
  #nav.nav--scrolled { background: rgba(7, 7, 7, 0.94); }
}
```
JS: `lenis.on('scroll', ({ scroll }) => nav.classList.toggle('nav--scrolled', scroll > 80));`

## Feature Section Pattern
Each feature has a **ghost background number** for luxury depth:
```html
<div class="feature" data-animation="blur-reveal|slide-up">
  <span class="feature-bg-num" aria-hidden="true">01</span>  <!-- decorative -->
  <span class="label">Category</span>
  <h2>Heading</h2>
  <p>Description</p>
</div>
```
```css
.feature-bg-num {
  position: absolute; bottom: -0.12em; left: -0.05em;
  font-size: clamp(12rem, 22vw, 28rem);
  color: rgba(244, 244, 244, 0.025); /* nearly invisible — depth only */
  pointer-events: none; user-select: none;
}
```

## Canvas Column Polish
```css
.sticky-visual {
  background: var(--bg); /* dark bg shows through transparent canvas */
}

.canvas-glow { /* dual-layer warm copper atmosphere */
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 55% 45% at 50% 50%,
      rgba(200, 155, 123, 0.11) 0%, transparent 65%),
    radial-gradient(ellipse 90% 80% at 50% 52%,
      rgba(200, 155, 123, 0.04) 0%, transparent 75%);
}

.sticky-visual::after { /* bottom vignette — machine dissolves into dark */
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0; height: 28%;
  background: linear-gradient(to bottom, transparent 0%, var(--bg) 95%);
  z-index: 2; pointer-events: none;
}
```

## Stats Section
- 4-column grid, vertical dividers `border-right: 1px solid rgba(244,244,244,0.05)`
- Counter numbers: `var(--copper)`, `font-size: clamp(3.5rem, 5.5vw, 8rem)`
- Units: `rgba(200,155,123,0.45)`, smaller than the number
- Labels: `0.65rem uppercase`, `letter-spacing: 0.18em`, `rgba(244,244,244,0.25)`

## Nav Bar
Fixed top nav: brand name left, "Reserve" button right.
`opacity: 0` initial → JS fades in after hero reveal at ~1.2s delay.
Button: `border: 1px solid rgba(200,155,123,0.5)`, hover fills copper.
Adds `.nav--scrolled` glass class after 80px scroll via Lenis scroll event.

## Feature Animations
- `blur-reveal`: `{opacity:0, filter:'blur(16px)', y:10}` → `{opacity:1, filter:'blur(0px)', y:0}`
- `slide-up`: `{opacity:0, y:45}` → `{opacity:1, y:0}`
- Both: `duration:1s`, `stagger:0.12–0.13s`, `start:'top 76%'`, `toggleActions:'play none none none'`

## Hero Parallax
Two-layer depth: text col and video col move at different rates on scroll.
```js
gsap.to('.hero-text',   { y: -60, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 }});
gsap.to('.hero-visual', { y: -30, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 }});
```
Safe: `#hero { overflow: hidden }` clips overshoot. `will-change: transform` on both for GPU acceleration.

## Responsive
- `> 1024px`: Full split layout (42fr/58fr hero, 1fr/1fr product-story)
- `768–1024px`: Split layout maintained, stats 2×2 grid
- `< 768px`: Stack vertically — canvas col first (top, 48vh, sticky), text col below; hero video top, text below
- `< 480px`: 2×2 stats, smaller font scale

## What NEVER to do
- Never `object-fit: cover` on hero video — crops the product, ruins the reveal
- Never `video` as a CSS `background-image` or absolute full-bleed behind text
- Never `backdrop-filter` without `-webkit-backdrop-filter` (Safari)
- Never set `clip-path` in CSS for elements that start hidden — JS fromTo only
- Never add unnecessary white space/empty sections between content
- Never use `position: fixed` for the canvas — black void sections appear
- Never `ctx.fillRect` with sampled bg color — gray bars appear on canvas
