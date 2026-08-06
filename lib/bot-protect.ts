import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

/**
 * Call at the top of any route that spends real money per request (fal.ai /
 * Hugging Face calls). Returns a 403 response for automated traffic, or null
 * when the caller should proceed. Pairs with the <BotIdClient> mount in
 * app/layout.tsx — that component collects the invisible challenge this
 * verifies, so a route protected here must also be listed there.
 */
export async function rejectIfBot(): Promise<NextResponse | null> {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Automated requests aren't allowed here." }, { status: 403 });
  }
  return null;
}
