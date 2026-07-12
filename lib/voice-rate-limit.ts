type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const TOKEN_RATE_LIMIT_WINDOW_MS = 60_000;
const TOKEN_RATE_LIMIT_MAX = 20;

const tokenRateLimits = new Map<string, RateLimitEntry>();

export function checkVoiceTokenRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = tokenRateLimits.get(key);

  if (!entry || now >= entry.resetAt) {
    tokenRateLimits.set(key, {
      count: 1,
      resetAt: now + TOKEN_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.count >= TOKEN_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count += 1;
  return { allowed: true };
}
