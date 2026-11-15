import { endSession } from "../../../../lib/auth.js";
import { safeJsonResponse } from "../../../../lib/http.js";

export async function POST() {
  await endSession();
  return safeJsonResponse({ ok: true });
}
