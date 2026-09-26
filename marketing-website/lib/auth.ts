/**
 * Authentication: email + password over opaque database-backed sessions.
 *
 * Sessions live in the `sessions` table and the cookie carries only a random
 * id, so signing a user out (or revoking every session) is a delete.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { newId, nowIso, one, run } from "./db";
import type { User } from "./types";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "mandate_session";
const SESSION_DAYS = 30;
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 14);

/* -------------------------------------------------------------------------- */
/* Passwords                                                                   */
/* -------------------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

async function sweepExpired(): Promise<void> {
  await run(`DELETE FROM sessions WHERE expires_at < $1`, [nowIso()]);
}

export async function createSession(userId: string): Promise<void> {
  await sweepExpired();

  const id = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await run(
    `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)`,
    [id, userId, expires.toISOString(), nowIso()],
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await run(`DELETE FROM sessions WHERE id = $1`, [id]);
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const row = await one<User & { expires_at: string }>(
    `SELECT u.*, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = $1`,
    [id],
  );
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await run(`DELETE FROM sessions WHERE id = $1`, [id]);
    return null;
  }
  return row;
}

/* -------------------------------------------------------------------------- */
/* Users                                                                       */
/* -------------------------------------------------------------------------- */

export async function findUserByEmail(email: string): Promise<User | null> {
  return one<User>(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email.trim()]);
}

export async function createUser(params: {
  email: string;
  name: string;
  password: string;
  firmName: string;
}): Promise<User> {
  const id = newId();
  const passwordHash = await hashPassword(params.password);

  await run(
    `INSERT INTO users (id, email, name, password_hash, firm_name, plan, subscription_status, trial_ends_at, created_at)
     VALUES ($1, $2, $3, $4, $5, 'trial', 'trialing', $6, $7)`,
    [
      id,
      params.email.trim().toLowerCase(),
      params.name.trim(),
      passwordHash,
      params.firmName.trim(),
      trialEndsAt(),
      nowIso(),
    ],
  );

  return (await one<User>(`SELECT * FROM users WHERE id = $1`, [id]))!;
}

export function trialEndsAt(from = new Date()): string {
  return new Date(from.getTime() + TRIAL_DAYS * 86_400_000).toISOString();
}

/** Guard for every page under /app. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
