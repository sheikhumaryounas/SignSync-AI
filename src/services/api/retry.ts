import { ApiError } from './types';

// SRS 3.3.2: failed API calls are retried automatically before an error reaches the user.
// Only transport failures are retried; validation and auth errors are final.
export async function withRetry<T>(call: () => Promise<T>, retries = 1, waitMs = 600): Promise<T> {
  try {
    return await call();
  } catch (e) {
    const retryable = !(e instanceof ApiError) || e.code === 'network' || e.code === 'unknown';
    if (!retryable || retries <= 0) throw e;
    await new Promise((r) => setTimeout(r, waitMs));
    return withRetry(call, retries - 1, waitMs * 2);
  }
}
