"use client";

/* ─── Product-preserving composite ────────────────────────────────────
 * The AI never redraws the uploaded product — it only generates the
 * surrounding scene. The real product (background removed) is drawn on
 * top afterward via canvas, so its pixels are never touched by the model.
 * Shared by Generate (product-preserving mode) and Replace BG.
 */
export function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // Needed for cross-origin URLs (e.g. fal.media) so canvas.toDataURL()
    // doesn't throw on a tainted canvas. No-op for same-origin blob/data URLs.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Background-removal output is a full-size canvas with lots of transparent
// padding around the subject. Without trimming that first, "ground contact"
// placement is measured against the padded box instead of the real product
// silhouette, which is why composites can look like they're floating.
export function trimTransparentEdges(img: HTMLImageElement): HTMLCanvasElement {
  const full = document.createElement("canvas");
  full.width = img.width;
  full.height = img.height;
  const fullCtx = full.getContext("2d")!;
  fullCtx.drawImage(img, 0, 0);

  const { data } = fullCtx.getImageData(0, 0, full.width, full.height);
  const ALPHA_THRESHOLD = 10;
  let minX = full.width, minY = full.height, maxX = 0, maxY = 0;
  for (let y = 0; y < full.height; y++) {
    for (let x = 0; x < full.width; x++) {
      if (data[(y * full.width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) return full; // fully transparent — shouldn't happen, fallback

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const trimmed = document.createElement("canvas");
  trimmed.width = w;
  trimmed.height = h;
  trimmed.getContext("2d")!.drawImage(full, minX, minY, w, h, 0, 0, w, h);
  return trimmed;
}

export async function compositeProductOntoBackground(productCutout: Blob, backgroundDataUrl: string): Promise<string> {
  const [bgImg, productImgRaw] = await Promise.all([
    loadImageEl(backgroundDataUrl),
    loadImageEl(URL.createObjectURL(productCutout)),
  ]);
  const product = trimTransparentEdges(productImgRaw);

  const canvas = document.createElement("canvas");
  canvas.width = bgImg.width;
  canvas.height = bgImg.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Ground the product's true (trimmed) base on a fixed baseline — standard
  // product-photography composition, consistent regardless of how much
  // padding the removal step left around the subject.
  const groundY = canvas.height * 0.86;
  const targetH = canvas.height * 0.56;
  const scale = targetH / product.height;
  const targetW = product.width * scale;
  const x = (canvas.width - targetW) / 2;
  const y = groundY - targetH;

  // Contact shadow anchored exactly at the ground line
  ctx.save();
  ctx.filter = "blur(10px)";
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.beginPath();
  ctx.ellipse(x + targetW / 2, groundY + 2, targetW * 0.38, targetW * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(product, x, y, targetW, targetH);

  return canvas.toDataURL("image/png");
}
