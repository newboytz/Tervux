/**
 * Simple In-Memory Rate Limiter (Multi-Account Enabled)
 * Limits users to a fixed number of commands per time window per account.
 */
class RateLimiter {
    constructor(limit = 5, windowMs = 60000) {
        this.limit = limit;
        this.windowMs = windowMs;
        // Duka la sasa linatunza data kwa mtindo wa: accountName_userId
        this.store = new Map();
    }

    /**
     * Check if a user is within the rate limit for a specific account.
     */
    check(accountName, userId) {
        if (!accountName) return true; // Dharura kama jina halijapita
        
        const now = Date.now();
        const key = `${accountName}_${userId}`; // Kitambulisho cha kipekee kabisa
        const record = this.store.get(key);

        if (!record) {
            this.store.set(key, { count: 1, firstRequest: now });
            return true;
        }

        if (now - record.firstRequest > this.windowMs) {
            // Window expired, reset
            this.store.set(key, { count: 1, firstRequest: now });
            return true;
        }

        if (record.count >= this.limit) {
            console.warn(`⚠️ [RateLimiter] [${accountName}] User ${userId} exceeded limit (${this.limit}/${this.windowMs}ms)`);
            return false;
        }

        record.count++;
        return true;
    }

    /**
     * Get seconds remaining until limit reset for a user.
     */
    getTimeToReset(accountName, userId) {
        const key = `${accountName}_${userId}`;
        const record = this.store.get(key);
        if (!record) return 0;
        const elapsed = Date.now() - record.firstRequest;
        const remaining = Math.max(0, this.windowMs - elapsed);
        return Math.ceil(remaining / 1000);
    }

    /**
     * Clean up old entries to prevent memory leaks.
     */
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.store.entries()) {
            if (now - value.firstRequest > this.windowMs) {
                this.store.delete(key);
            }
        }
    }
}

// Global instance: 5 commands per 60 seconds
export const rateLimiter = new RateLimiter(5, 60000);

// Auto-cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
