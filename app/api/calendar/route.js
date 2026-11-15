import db from "../../../lib/db.js";
import { currentUser } from "../../../lib/auth.js";
import { getDraft, updateDraft, validateDraftInput } from "../../../lib/drafts.js";
import { jsonError, readJson, safeJsonResponse } from "../../../lib/http.js";

export async function GET(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to view your calendar.", 401);
  const url = new URL(request.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if ((start && !Number.isFinite(Date.parse(start))) || (end && !Number.isFinite(Date.parse(end)))) return jsonError("Use valid start and end dates.");
  const clauses = ["user_id = ?", "scheduled_at IS NOT NULL"];
  const params = [user.id];
  if (start) { clauses.push("scheduled_at >= ?"); params.push(new Date(start).toISOString()); }
  if (end) { clauses.push("scheduled_at < ?"); params.push(new Date(end).toISOString()); }
  const items = db.prepare(`SELECT * FROM drafts WHERE ${clauses.join(" AND ")} ORDER BY scheduled_at ASC`).all(...params)
    .map((row) => ({ id: row.id, title: row.title, platform: row.platform, language: row.language, status: row.status, scheduledAt: row.scheduled_at }));
  return safeJsonResponse({ items });
}

export async function POST(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to schedule content.", 401);
  let body;
  try { body = await readJson(request); } catch (error) { return jsonError(error.message); }
  if (typeof body.draftId !== "string" || typeof body.scheduledAt !== "string" || !Number.isFinite(Date.parse(body.scheduledAt))) return jsonError("draftId and a valid scheduledAt date are required.");
  const existing = getDraft(user.id, body.draftId);
  if (!existing) return jsonError("Draft not found.", 404);
  const draft = updateDraft(user.id, body.draftId, validateDraftInput({ status: "scheduled", scheduledAt: new Date(body.scheduledAt).toISOString() }, { partial: true }));
  return safeJsonResponse({ item: { id: draft.id, title: draft.title, platform: draft.platform, scheduledAt: draft.scheduledAt } });
}

export async function DELETE(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to update your calendar.", 401);
  const id = new URL(request.url).searchParams.get("draftId");
  const existing = id && getDraft(user.id, id);
  if (!existing) return jsonError("Scheduled draft not found.", 404);
  updateDraft(user.id, id, { status: "draft", scheduledAt: null });
  return safeJsonResponse({ ok: true });
}
