import { currentUser } from "../../../../lib/auth.js";
import { jsonError, safeJsonResponse } from "../../../../lib/http.js";

export async function GET() {
  const user = await currentUser();
  return user ? safeJsonResponse({ user }) : jsonError("Sign in to continue.", 401);
}
