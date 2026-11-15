import { randomUUID } from "node:crypto";
import db from "./db.js";

export function serializeDraft(row) {
  return {
    id: row.id,
    title: row.title,
    idea: row.idea,
    businessDetails: row.business_details,
    language: row.language,
    platform: row.platform,
    content: JSON.parse(row.content_json),
    status: row.status,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createDraft(userId, input) {
  const now = new Date().toISOString();
  const draft = {
    id: randomUUID(), userId, title: input.title, idea: input.idea || "",
    businessDetails: input.businessDetails || "", language: input.language,
    platform: input.platform, content: input.content, status: input.status || "draft",
    scheduledAt: input.scheduledAt || null,
  };
  db.prepare(`INSERT INTO drafts (id, user_id, title, idea, business_details, language, platform, content_json, status, scheduled_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(draft.id, userId, draft.title, draft.idea, draft.businessDetails, draft.language, draft.platform,
      JSON.stringify(draft.content), draft.status, draft.scheduledAt, now, now);
  return { ...draft, createdAt: now, updatedAt: now };
}

export function listDrafts(userId, status) {
  const rows = status
    ? db.prepare("SELECT * FROM drafts WHERE user_id = ? AND status = ? ORDER BY updated_at DESC").all(userId, status)
    : db.prepare("SELECT * FROM drafts WHERE user_id = ? ORDER BY updated_at DESC").all(userId);
  return rows.map(serializeDraft);
}

export function getDraft(userId, id) {
  const row = db.prepare("SELECT * FROM drafts WHERE user_id = ? AND id = ?").get(userId, id);
  return row ? serializeDraft(row) : null;
}

export function updateDraft(userId, id, input) {
  const existing = db.prepare("SELECT * FROM drafts WHERE user_id = ? AND id = ?").get(userId, id);
  if (!existing) return null;
  const values = {
    title: input.title ?? existing.title,
    idea: input.idea ?? existing.idea,
    businessDetails: input.businessDetails ?? existing.business_details,
    language: input.language ?? existing.language,
    platform: input.platform ?? existing.platform,
    content: input.content ?? JSON.parse(existing.content_json),
    status: input.status ?? existing.status,
    scheduledAt: input.scheduledAt === undefined ? existing.scheduled_at : input.scheduledAt,
  };
  if (values.status === "scheduled" && !values.scheduledAt) throw new Error("scheduledAt is required for scheduled content.");
  const now = new Date().toISOString();
  db.prepare(`UPDATE drafts SET title = ?, idea = ?, business_details = ?, language = ?, platform = ?, content_json = ?, status = ?, scheduled_at = ?, updated_at = ?
    WHERE user_id = ? AND id = ?`).run(values.title, values.idea, values.businessDetails, values.language, values.platform,
    JSON.stringify(values.content), values.status, values.scheduledAt, now, userId, id);
  return { id, ...values, createdAt: existing.created_at, updatedAt: now };
}

export function deleteDraft(userId, id) {
  return db.prepare("DELETE FROM drafts WHERE user_id = ? AND id = ?").run(userId, id).changes > 0;
}

export function validateDraftInput(input, { partial = false } = {}) {
  const result = {};
  const textFields = { title: 180, idea: 2000, businessDetails: 4000, language: 50, platform: 80 };
  for (const [key, max] of Object.entries(textFields)) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== "string" || input[key].trim().length > max || (!partial && key !== "businessDetails" && !input[key].trim())) {
        throw new Error(`${key} must be a string with at most ${max} characters.`);
      }
      result[key] = input[key].trim();
    } else if (!partial && key !== "idea" && key !== "businessDetails") {
      throw new Error(`${key} is required.`);
    }
  }
  if (input.content !== undefined) {
    if (!input.content || typeof input.content !== "object" || Array.isArray(input.content) || JSON.stringify(input.content).length > 50_000) {
      throw new Error("content must be a JSON object under 50 KB.");
    }
    result.content = input.content;
  } else if (!partial) throw new Error("content is required.");
  if (input.status !== undefined) {
    if (!["draft", "scheduled", "published"].includes(input.status)) throw new Error("status must be draft, scheduled, or published.");
    result.status = input.status;
  }
  if (input.scheduledAt !== undefined) {
    if (input.scheduledAt !== null && (typeof input.scheduledAt !== "string" || !Number.isFinite(Date.parse(input.scheduledAt)))) {
      throw new Error("scheduledAt must be a valid date or null.");
    }
    result.scheduledAt = input.scheduledAt === null ? null : new Date(input.scheduledAt).toISOString();
  }
  if (!partial && result.status === "scheduled" && !result.scheduledAt) throw new Error("scheduledAt is required for scheduled content.");
  return result;
}
