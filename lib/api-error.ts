/**
 * Turns a failed fetch Response into a message worth showing a user.
 *
 * Our own routes always answer with `{ error }`, so normally we just surface
 * that. The cases this exists for are the ones where the response never
 * reached the route: Vercel's proxy rejects an oversized body with a 413 and
 * a plain-text page, and a timed-out request comes back 504 the same way.
 * Both used to fall through to a flat "Generation failed. Try again.", which
 * is exactly wrong advice — retrying an 8MB phone photo over 4G fails again.
 */
export async function readApiError(res: Response, fallback = "Something went wrong. Try again."): Promise<string> {
  const body = await res.json().catch(() => null as { error?: string } | null);
  if (body?.error) return body.error;

  if (res.status === 413) return "That photo is too large to upload. Try a smaller image.";
  if (res.status === 504 || res.status === 408) return "The upload timed out. Check your connection and try again.";
  if (res.status >= 500) return "Our server had a problem. Try again in a moment.";
  return fallback;
}
