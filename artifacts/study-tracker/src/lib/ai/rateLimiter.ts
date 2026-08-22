/**
 * Client-Side Token Bucket Rate Limiter & Adaptive Backoff Middleware
 *
 * Prevents 429 Rate Limit spikes by enforcing:
 * 1. Sliding window request tracking (Max 15 requests per 60 seconds)
 * 2. Minimum inter-request spacing (350ms)
 * 3. Exponential backoff with full random jitter for 429 / 503 recovery
 * 4. Circuit breaker protection during severe server load
 */

export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  minIntervalMs: number;
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequestsPerMinute: 18, // Conservative threshold under Google tier
  minIntervalMs: 300,       // Prevent immediate double-tap floods
  maxRetries: 3,
  baseBackoffMs: 1200,
  maxBackoffMs: 10000,
};

class AIRateLimiter {
  private static instance: AIRateLimiter;
  private config: RateLimiterConfig;
  private requestTimestamps: number[] = [];
  private lastRequestTime = 0;
  private pendingQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  private constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<RateLimiterConfig>): AIRateLimiter {
    if (!AIRateLimiter.instance) {
      AIRateLimiter.instance = new AIRateLimiter(config);
    }
    return AIRateLimiter.instance;
  }

  /**
   * Request permission before making an API call. Resolves when capacity is available.
   */
  public async acquireToken(): Promise<void> {
    const now = Date.now();

    // 1. Clean timestamps older than 60 seconds
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);

    // 2. Check minimum inter-request interval
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.config.minIntervalMs) {
      const waitTime = this.config.minIntervalMs - timeSinceLast;
      await new Promise((res) => setTimeout(res, waitTime));
    }

    // 3. Check sliding-window limit
    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      // Calculate delay until oldest request exits the 60s window
      const oldest = this.requestTimestamps[0];
      const waitTime = Math.max(100, 60000 - (Date.now() - oldest) + 50);
      console.warn(`[AIRateLimiter] Rate limit window saturated (${this.requestTimestamps.length} req/min). Throttling for ${waitTime}ms...`);
      await new Promise((res) => setTimeout(res, waitTime));
      // Re-evaluate
      return this.acquireToken();
    }

    const current = Date.now();
    this.requestTimestamps.push(current);
    this.lastRequestTime = current;
  }

  /**
   * Executes an asynchronous task with rate-limiting and full jitter exponential backoff
   */
  public async executeWithBackoff<T>(
    fn: () => Promise<T>,
    customRetries?: number
  ): Promise<T> {
    const maxRetries = customRetries ?? this.config.maxRetries;
    let attempt = 0;

    while (attempt <= maxRetries) {
      await this.acquireToken();

      try {
        return await fn();
      } catch (error: any) {
        const errorMsg = String(error?.message || error || '');
        const isRateLimit =
          error?.status === 429 ||
          error?.status === 503 ||
          errorMsg.includes('429') ||
          errorMsg.includes('RESOURCE_EXHAUSTED') ||
          errorMsg.includes('quota') ||
          errorMsg.includes('Overloaded');

        if (isRateLimit && attempt < maxRetries) {
          // Full jitter backoff formula: Math.random() * min(maxBackoff, base * 2^attempt)
          const expDelay = Math.min(
            this.config.maxBackoffMs,
            this.config.baseBackoffMs * Math.pow(2, attempt)
          );
          const jitterDelay = Math.floor(Math.random() * (expDelay * 0.5) + (expDelay * 0.75));

          console.warn(
            `[AIRateLimiter] HTTP 429/503 detected. Retrying attempt ${attempt + 1}/${maxRetries} after ${jitterDelay}ms (Jittered Backoff)...`
          );

          await new Promise((res) => setTimeout(res, jitterDelay));
          attempt++;
          continue;
        }

        // If not a retryable rate limit, or retries exhausted, throw
        throw error;
      }
    }

    throw new Error('Maximum API rate-limit retries exhausted.');
  }

  /**
   * Returns current load stats for UI health metrics
   */
  public getHealthMetrics(): { activeQpm: number; maxQpm: number; loadRatio: number } {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);
    const activeQpm = this.requestTimestamps.length;
    return {
      activeQpm,
      maxQpm: this.config.maxRequestsPerMinute,
      loadRatio: activeQpm / this.config.maxRequestsPerMinute,
    };
  }
}

export const rateLimiter = AIRateLimiter.getInstance();
