const buckets = new Map<string, number[]>()

/**
 * A small sliding window limiter kept in memory. It protects the AI backed
 * routes from a runaway client. It is per server instance, so it limits bursts
 * rather than guaranteeing a global quota.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= limit) {
    buckets.set(key, recent)
    return false
  }
  recent.push(now)
  buckets.set(key, recent)

  // Keep the map from growing without bound.
  if (buckets.size > 5000) {
    buckets.forEach((times, k) => {
      if (!times.some((time) => now - time < windowMs)) buckets.delete(k)
    })
  }
  return true
}
