import { createHash, randomBytes, scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import db from "./db.js";

const COOKIE_NAME = "creatorpilot_session";
const SESSION_DAYS = 30;
const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

export function verifyPassword(password, stored) {
  const [algorithm, salt, expectedHex] = String(stored).split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function publicUser(row) {
  return row && { id: row.id, name: row.name, email: row.email, language: row.language, createdAt: row.created_at };
}

export function createUser({ name, email, password, language }) {
  const identifier = normalizeIdentifier(email);
  if (!identifier) throw new Error("Enter a valid email address or phone number.");
  const user = { id: randomUUID(), name, email: identifier, passwordHash: hashPassword(password), language, createdAt: new Date().toISOString() };
  db.prepare("INSERT INTO users (id, name, email, password_hash, language, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(user.id, user.name, user.email, user.passwordHash, user.language, user.createdAt);
  return { id: user.id, name: user.name, email: user.email, language: user.language, created_at: user.createdAt };
}

export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, expiresAt, new Date().toISOString());
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  jar.delete(COOKIE_NAME);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = db.prepare(`SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`).get(hashToken(token), Date.now());
  return publicUser(row);
}

export function normalizeIdentifier(value) {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || input.length > 254) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return input.toLowerCase();
  const phone = input.replace(/[\s().-]/g, "");
  return /^\+?\d{8,15}$/.test(phone) ? phone : null;
}

export const sessionCookieName = COOKIE_NAME;
