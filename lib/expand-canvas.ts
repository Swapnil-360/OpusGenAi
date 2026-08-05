"use client";

import { loadImageEl } from "@/lib/image-composite";

export type ExpandDirection = "all" | "top-bottom" | "left-right" | "top" | "bottom";

// fal-ai/flux-pro/v1/fill bills per megapixel of the canvas sent to it — cap the
// expanded canvas here so an oversized upload can't blow up per-operation cost.
const MAX_PIXELS = 1_048_576; // ~1 megapixel

function parseRatio(ratioId: string): number {
  const [w, h] = ratioId.split(":").map(Number);
  return w / h;
}

/** Computes the new canvas size and where the original image sits inside it. */
function computeExpandLayout(origW: number, origH: number, ratioId: string, direction: ExpandDirection) {
  const targetAspect = parseRatio(ratioId);
  let canvasW: number, canvasH: number, offsetX: number, offsetY: number;

  if (direction === "left-right") {
    canvasH = origH;
    canvasW = Math.max(origW, Math.round(canvasH * targetAspect));
    offsetX = Math.round((canvasW - origW) / 2);
    offsetY = 0;
  } else if (direction === "top-bottom") {
    canvasW = origW;
    canvasH = Math.max(origH, Math.round(canvasW / targetAspect));
    offsetX = 0;
    offsetY = Math.round((canvasH - origH) / 2);
  } else if (direction === "top") {
    canvasW = origW;
    canvasH = Math.max(origH, Math.round(canvasW / targetAspect));
    offsetX = 0;
    offsetY = canvasH - origH; // original anchored to bottom, new space appears above
  } else if (direction === "bottom") {
    canvasW = origW;
    canvasH = Math.max(origH, Math.round(canvasW / targetAspect));
    offsetX = 0;
    offsetY = 0; // original anchored to top, new space appears below
  } else {
    // "all" — grow both dimensions to hit target aspect, original centered
    let h = origH, w = Math.round(h * targetAspect);
    if (w < origW) { w = origW; h = Math.round(w / targetAspect); }
    canvasW = Math.max(w, origW);
    canvasH = Math.max(h, origH);
    offsetX = Math.round((canvasW - origW) / 2);
    offsetY = Math.round((canvasH - origH) / 2);
  }

  return { canvasW, canvasH, offsetX, offsetY };
}

/** Builds the expanded base image (original pasted in place, rest filled) and its
 * companion mask (white = new area for the model to fill, black = keep as-is). */
export async function buildExpandedImageAndMask(
  src: string,
  ratioId: string,
  direction: ExpandDirection
): Promise<{ image: string; mask: string }> {
  const img = await loadImageEl(src);
  let { canvasW, canvasH, offsetX, offsetY } = computeExpandLayout(img.width, img.height, ratioId, direction);

  let drawW = img.width;
  let drawH = img.height;
  if (canvasW * canvasH > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (canvasW * canvasH));
    canvasW = Math.round(canvasW * scale);
    canvasH = Math.round(canvasH * scale);
    offsetX = Math.round(offsetX * scale);
    offsetY = Math.round(offsetY * scale);
    drawW = Math.round(drawW * scale);
    drawH = Math.round(drawH * scale);
  }

  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = canvasW;
  imageCanvas.height = canvasH;
  const imageCtx = imageCanvas.getContext("2d")!;
  imageCtx.fillStyle = "#808080";
  imageCtx.fillRect(0, 0, canvasW, canvasH);
  imageCtx.drawImage(img, offsetX, offsetY, drawW, drawH);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvasW;
  maskCanvas.height = canvasH;
  const maskCtx = maskCanvas.getContext("2d")!;
  maskCtx.fillStyle = "#ffffff";
  maskCtx.fillRect(0, 0, canvasW, canvasH);
  maskCtx.fillStyle = "#000000";
  maskCtx.fillRect(offsetX, offsetY, drawW, drawH);

  return { image: imageCanvas.toDataURL("image/png"), mask: maskCanvas.toDataURL("image/png") };
}
