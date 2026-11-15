import { currentUser } from "../../../../lib/auth.js";
import { deleteDraft, getDraft, updateDraft, validateDraftInput } from "../../../../lib/drafts.js";
import { jsonError, readJson, safeJsonResponse } from "../../../../lib/http.js";

export async function GET(_request, context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to view drafts.", 401);
  const { id } = await context.params;
  const draft = getDraft(user.id, id);
  return draft ? safeJsonResponse({ draft }) : jsonError("Draft not found.", 404);
}

export async function PATCH(request, context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to edit drafts.", 401);
  const { id } = await context.params;
  let input;
  try { input = validateDraftInput(await readJson(request), { partial: true }); } catch (error) { return jsonError(error.message); }
  const draft = updateDraft(user.id, id, input);
  return draft ? safeJsonResponse({ draft }) : jsonError("Draft not found.", 404);
}

export async function DELETE(_request, context) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to delete drafts.", 401);
  const { id } = await context.params;
  return deleteDraft(user.id, id) ? safeJsonResponse({ ok: true }) : jsonError("Draft not found.", 404);
}
