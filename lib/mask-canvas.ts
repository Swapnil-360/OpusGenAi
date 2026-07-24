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

/** True if the painted-overlay canvas has at least one painted pixel. */
export function hasMaskPaint(canvas: HTMLCanvasElement): boolean {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 10) return true;
  }
  return false;
}
