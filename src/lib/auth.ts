import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const JWT_SECRET =
  process.env.JWT_SECRET || "playbeat-dev-secret-change-in-production-9f2k4";
const TOKEN_COOKIE = "pb_token";

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function getTokenFromRequest(request: Request): Promise<string | null> {
  // Prefer Authorization header, fallback to cookie
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function getCurrentUser(request: Request) {
  const token = await getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: { vendor: true, affiliate: true },
  });
  if (!user) return null;
  return { ...user, payload };
}

export function requireRole(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  roles: Role[],
) {
  if (!user || !roles.includes(user.role as Role)) return false;
  return true;
}

export function generateLicenseKey(): string {
  const blocks = 4;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const parts: string[] = [];
  for (let b = 0; b < blocks; b++) {
    let block = "";
    for (let i = 0; i < 4; i++) {
      block += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(block);
  }
  return parts.join("-");
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PB-${ts}-${rand}`;
}

export function generateAffiliateCode(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base || "PB"}${rand}`;
}
