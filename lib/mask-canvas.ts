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
