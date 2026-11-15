import { currentUser } from "../../../lib/auth.js";
import { createDraft, listDrafts, validateDraftInput } from "../../../lib/drafts.js";
import { jsonError, readJson, safeJsonResponse } from "../../../lib/http.js";

export async function GET(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to view your drafts.", 401);
  const status = new URL(request.url).searchParams.get("status");
  if (status && !["draft", "scheduled", "published"].includes(status)) return jsonError("Unknown draft status.");
  return safeJsonResponse({ drafts: listDrafts(user.id, status || undefined) });
}

export async function POST(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to save drafts.", 401);
  let input;
  try { input = validateDraftInput(await readJson(request)); } catch (error) { return jsonError(error.message); }
  return safeJsonResponse({ draft: createDraft(user.id, input) }, 201);
}
