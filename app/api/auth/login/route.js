import db from "../../../../lib/db.js";
import { normalizeIdentifier, publicUser, startSession, verifyPassword } from "../../../../lib/auth.js";
import { jsonError, readJson, safeJsonResponse } from "../../../../lib/http.js";

export async function POST(request) {
  let body;
  try { body = await readJson(request); } catch (error) { return jsonError(error.message); }
  const identifier = normalizeIdentifier(body.identifier ?? body.email ?? body.phone);
  if (!identifier || typeof body.password !== "string") return jsonError("Enter a valid email or phone number and password.", 401);
  const row = db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(identifier);
  if (!row || !verifyPassword(body.password, row.password_hash)) return jsonError("Email or password is incorrect.", 401);
  await startSession(row.id);
  return safeJsonResponse({ user: publicUser(row) });
}
