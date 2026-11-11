// Shared access code. When ACCESS_CODE is set, every /api route except
// /api/login and /api/session requires a signed cookie obtained by entering
// the code once per device. When it is not set (local use), access is open.
import crypto from "node:crypto";

const COOKIE = "edu_access";
const ONE_YEAR = 60 * 60 * 24 * 365;

const accessCode = () => (process.env.ACCESS_CODE || "").trim();
export const authEnabled = () => accessCode().length > 0;

// The cookie holds an HMAC of the code, so changing ACCESS_CODE logs everyone out.
const token = () =>
  crypto.createHmac("sha256", process.env.SESSION_SECRET || accessCode()).update("educapp:" + accessCode()).digest("hex");

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export const isAuthed = (req) => !authEnabled() || safeEqual(readCookie(req, COOKIE) || "", token());

export function requireAccess(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: "ACCESS_REQUIRED" });
}

export async function login(req, res) {
  const code = String(req.body?.code || "").trim();
  if (!authEnabled()) return res.json({ ok: true });
  if (!safeEqual(code, accessCode())) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return res.status(401).json({ error: "WRONG_CODE" });
  }
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ONE_YEAR}${secure ? "; Secure" : ""}`,
  );
  res.json({ ok: true });
}

export function logout(req, res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
}
