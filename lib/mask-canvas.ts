"use client";

/** Converts a File to a base64 data URL (needed since blob: object URLs
 * aren't fetchable from the server). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * A File as an upload-ready data URL: downscaled to `maxEdge` and re-encoded
 * as JPEG.
 *
 * Phone cameras shoot 12-50MP, so a straight fileToDataUrl() of a camera-roll
 * photo is commonly 5-15MB before base64 inflates it another ~33%. On a weak
 * mobile connection that request simply doesn't finish, which is what made
 * generation "sometimes" fail on phones while being fine on desktop (where
 * people tend to upload already-optimised product shots). 2048px is well past
 * what the reference models need, and typically lands under ~500KB.
 *
 * JPEG rather than PNG because these are photographs — PNG would often come
 * out larger than the original. Transparent sources are flattened onto white
 * first so an alpha PNG doesn't pick up black fringing.
 *
 * Falls back to the untouched data URL if decoding fails for any reason —
 * a slow upload is much better than a broken one.
 */
export async function fileToUploadDataUrl(
  file: File,
  { maxEdge = 2048, quality = 0.85 }: { maxEdge?: number; quality?: number } = {}
): Promise<string> {
  const original = await fileToDataUrl(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = original;
    });

    const longest = Math.max(img.width, img.height);
    // Already small enough and not a heavyweight format — leave it alone
    // rather than recompressing and losing quality for no size win.
    if (longest <= maxEdge && file.size <= 1_500_000) return original;

    const scale = Math.min(1, maxEdge / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return original;
  }
}

/** Reads a painted-overlay canvas (semi-transparent strokes) and produces a
 * pure black/white mask: white = painted (area to edit), black = untouched. */
export function extractMaskDataUrl(canvas: HTMLCanvasElement): string {
  const w = canvas.width;
  const h = canvas.height;
  const src = canvas.getContext("2d")!.getImageData(0, 0, w, h);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  const outData = octx.createImageData(w, h);

  for (let i = 0; i < src.data.length; i += 4) {
    const v = src.data[i + 3] > 10 ? 255 : 0;
    outData.data[i] = v;
    outData.data[i + 1] = v;
    outData.data[i + 2] = v;
    outData.data[i + 3] = 255;
  }
  octx.putImageData(outData, 0, 0);
  return out.toDataURL("image/png");
}

/** Downscales a data URL so width*height doesn't exceed maxPixels — fal-ai's
 * flux-pro/v1/fill bills per megapixel, so this caps per-operation cost on
 * oversized uploads. No-op if already under the cap. */
export function resizeDataUrlToMaxPixels(dataUrl: string, maxPixels: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const { width, height } = img;
      if (width * height <= maxPixels) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.sqrt(maxPixels / (width * height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** True if the painted-overlay canvas has at least one painted pixel. */
export function hasMaskPaint(canvas: HTMLCanvasElement): boolean {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) return true;
  }
  return false;
}
