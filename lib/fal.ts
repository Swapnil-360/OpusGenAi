import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_API_KEY,
});

export { fal };

/** Uploads a data-URL image to fal's temp storage, returns a public URL fal models can read. */
export async function uploadDataUrlToFal(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return fal.storage.upload(blob);
}
