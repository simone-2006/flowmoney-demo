const buckets = new Map();

/**
 * Rate limiter in-memory (per istanza). Adatto a single-user / poca traffico.
 * In serverless cold start il bucket si resetta: meglio di niente su login/register.
 */
export function rateLimit({ windowMs = 60_000, max = 20, key = "default" } = {}) {
    return (req, res, next) => {
        const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown")
            .split(",")[0]
            .trim();
        const bucketKey = `${key}:${ip}`;
        const now = Date.now();
        let entry = buckets.get(bucketKey);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            buckets.set(bucketKey, entry);
        }

        entry.count += 1;
        if (entry.count > max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader("Retry-After", String(retryAfter));
            return res.status(429).json({
                error: "Troppe richieste, riprova tra poco"
            });
        }

        next();
    };
}
