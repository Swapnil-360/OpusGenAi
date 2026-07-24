import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_API_KEY,
});

export { fal };

/** Uploads a data-URL image to fal's temp storage, returns a public URL fal models can read. */
export async function uploadDataUrlToFal(dataUrl: string): Promise<string> {
  // Must stay a data: URI — this string comes straight from request JSON, and
  // fetching an attacker-supplied http(s) URL here would be server-side SSRF
  // (internal network / cloud metadata endpoint probing).
  if (typeof dataUrl !== "string" || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(dataUrl)) {
    throw new Error("Invalid image data");
  }
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return fal.storage.upload(blob);
}
