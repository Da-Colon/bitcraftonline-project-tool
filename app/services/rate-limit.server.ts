const requests = new Map<string, number[]>();

export const rateLimit = {
  check(ip: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const userRequests = requests.get(ip) || [];
    
    const validRequests = userRequests.filter(
      time => now - time < windowMs
    );
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(ip, validRequests);
    return true;
  },
};
