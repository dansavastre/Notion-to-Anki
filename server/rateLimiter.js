class RateLimiter {
    constructor(tokensPerSecond) {
        this.tokensPerSecond = tokensPerSecond;
        this.tokens = tokensPerSecond;
        this.lastRefillTimestamp = Date.now();
        this.interval = 1000 / tokensPerSecond; // Interval in milliseconds
    }

    async getToken() {
        // Refill the bucket if the interval has passed
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.lastRefillTimestamp;
        const tokensToAdd = Math.floor(elapsedTime / this.interval);

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.tokens + tokensToAdd, this.tokensPerSecond);
            this.lastRefillTimestamp = currentTime;
        }

        // Check if there are available tokens
        if (this.tokens > 0) {
            this.tokens -= 1;
            return true;
        }

        // Wait until a token is available
        await new Promise(resolve => setTimeout(resolve, this.interval));

        // Try again
        return this.getToken();
    }
}

module.exports = RateLimiter;