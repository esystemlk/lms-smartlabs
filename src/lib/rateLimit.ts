const store = new Map<string, { count: number; expires: number }>();

function getIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function rateLimit(req: Request, key: string, limit = 30, windowMs = 60_000) {
  const ip = getIp(req);
  const bucketKey = `${ip}:${key}`;
  const now = Date.now();
  const existing = store.get(bucketKey);
  if (!existing || existing.expires <= now) {
    store.set(bucketKey, { count: 1, expires: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: existing.expires - now };
  }
  existing.count += 1;
  store.set(bucketKey, existing);
  return { allowed: true, remaining: limit - existing.count, resetMs: existing.expires - now };
}
