// Template prompts never reach the browser — they're resolved server-side at
// generation time from a templateId. These helpers are what both the generate
// and generate-video routes use to turn a stored template into the final
// prompt, and what the templates API uses to tell the client *which* fields it
// needs to collect without revealing the prompt itself.

/** Matches a [PLACEHOLDER] token. Bounded length and no newlines so a stray
 *  bracket in prose can't swallow half the prompt. */
const PLACEHOLDER_RE = /\[([^\]\n]{1,60})\]/g;

/**
 * The distinct placeholder labels in a prompt, e.g. ["YOUR BRAND", "VALUE 1"].
 * Safe to send to the client: these are field names, not the prompt.
 */
export function extractPlaceholders(prompt: string): string[] {
  const found = new Set<string>();
  for (const match of prompt.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1].trim());
  }
  return [...found];
}

/**
 * Builds the final prompt: substitutes the user's placeholder values, then
 * appends whatever extra direction they typed.
 *
 * An unfilled placeholder falls back to its own label with the brackets
 * stripped — the client is expected to require these, but if one slips through
 * we'd rather the model read "YOUR HEADLINE" than a literal "[YOUR HEADLINE]",
 * which it would happily render as bracketed text in the image.
 */
export function resolveTemplatePrompt(
  templatePrompt: string,
  values: Record<string, string> = {},
  userAdditions = ""
): string {
  const resolved = templatePrompt.replace(PLACEHOLDER_RE, (_full, rawKey: string) => {
    const key = rawKey.trim();
    const value = values[key];
    return value && value.trim() ? value.trim() : key;
  });

  const extra = userAdditions.trim();
  return extra ? `${resolved} ${extra}` : resolved;
}
