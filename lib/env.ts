// Server-only environment access. Never import this from a client component.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
