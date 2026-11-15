import db from "../../../lib/db.js";
import { currentUser } from "../../../lib/auth.js";
import { jsonError, readJson, safeJsonResponse } from "../../../lib/http.js";

export async function GET() {
  const user = await currentUser();
  return user ? safeJsonResponse({ user }) : jsonError("Sign in to view your profile.", 401);
}

export async function PATCH(request) {
  const user = await currentUser();
  if (!user) return jsonError("Sign in to update your profile.", 401);
  let body;
  try { body = await readJson(request); } catch (error) { return jsonError(error.message); }
  const name = body.name === undefined ? user.name : typeof body.name === "string" ? body.name.trim() : "";
  const language = body.language === undefined ? user.language : typeof body.language === "string" ? body.language.trim() : "";
  if (name.length < 2 || name.length > 100) return jsonError("Name must be between 2 and 100 characters.");
  if (!language || language.length > 50) return jsonError("Choose a valid content language.");
  db.prepare("UPDATE users SET name = ?, language = ? WHERE id = ?").run(name, language, user.id);
  return safeJsonResponse({ user: { ...user, name, language } });
}
