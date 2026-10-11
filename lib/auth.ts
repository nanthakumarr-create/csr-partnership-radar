import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. */
export function isAuthorizedCron(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  return safeEqual(authHeader, `Bearer ${secret}`);
}

export function isValidPasscode(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  return safeEqual(given, expected);
}
