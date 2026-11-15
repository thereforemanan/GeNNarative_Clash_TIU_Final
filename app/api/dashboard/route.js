import db from "../../../lib/db.js";
import { currentUser } from "../../../lib/auth.js";
import { jsonError, safeJsonResponse } from "../../../lib/http.js";

export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to view your dashboard.", 401);
  const stats = db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts,
    SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published
    FROM drafts WHERE user_id = ?`).get(user.id);
  const recent = db.prepare(`SELECT id, title, language, platform, status, scheduled_at, updated_at
    FROM drafts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 8`).all(user.id);
  return safeJsonResponse({
    stats: { total: stats.total || 0, drafts: stats.drafts || 0, scheduled: stats.scheduled || 0, published: stats.published || 0 },
    recent: recent.map((item) => ({ id: item.id, title: item.title, language: item.language, platform: item.platform, status: item.status, scheduledAt: item.scheduled_at, updatedAt: item.updated_at })),
    performance: null,
    note: "Social engagement metrics appear after a social platform is connected.",
  });
}
