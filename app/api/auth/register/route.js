import { createUser, normalizeIdentifier, startSession } from "../../../../lib/auth.js";
import { jsonError, readJson, safeJsonResponse } from "../../../../lib/http.js";

export async function POST(request) {
  let body;
  try { body = await readJson(request); } catch (error) { return jsonError(error.message); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const identifier = normalizeIdentifier(body.identifier ?? body.email ?? body.phone);
  const password = body.password;
  const language = typeof body.language === "string" ? body.language.trim() : "English";
  if (name.length < 2 || name.length > 100) return jsonError("Name must be between 2 and 100 characters.");
  if (!identifier) return jsonError("Enter a valid email address or phone number.");
  if (typeof password !== "string" || password.length < 10 || password.length > 200) return jsonError("Password must be at least 10 characters.");
  if (language.length > 40) return jsonError("Language is too long.");
  try {
    const user = createUser({ name, email: identifier, password, language });
    await startSession(user.id);
    return safeJsonResponse({ user: { id: user.id, name: user.name, email: user.email, language: user.language } }, 201);
  } catch (error) {
    if (String(error.message).includes("UNIQUE constraint failed")) return jsonError("An account with that email or phone number already exists.", 409);
    console.error("Registration failed:", error.message);
    return jsonError("Account could not be created.", 500);
  }
}
