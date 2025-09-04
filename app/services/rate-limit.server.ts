import { getEnv } from "~/utils/env.server";

const requests = new Map<string, number[]>();

export const rateLimit = {
  check(ip: string, maxRequests?: number, windowMs?: number): boolean {
    const env = getEnv();
    const max = maxRequests ?? env.RATE_LIMIT_MAX;
    const window = windowMs ?? env.RATE_LIMIT_WINDOW;

    const now = Date.now();
    const userRequests = requests.get(ip) || [];

    const validRequests = userRequests.filter((time) => now - time < window);

    if (validRequests.length >= max) {
      return false;
    }

    validRequests.push(now);
    requests.set(ip, validRequests);
    return true;
  },
};
