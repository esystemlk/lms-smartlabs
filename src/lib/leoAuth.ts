import { rateLimit } from "@/lib/rateLimit";

export function requireLeoKey(req: Request) {
  const rl = rateLimit(req, "api/leo", 60, 60_000);
  if (!rl.allowed) return { ok: false as const, status: 429, error: "Too many requests" };

  const key = req.headers.get("x-api-key");
  if (!key || key !== process.env.LEO_API_KEY) {
    return { ok: false as const, status: 401, error: "Invalid or missing API key" };
  }
  return { ok: true as const };
}
