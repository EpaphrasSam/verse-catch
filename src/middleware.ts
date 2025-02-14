import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { APP_CONFIG } from "@/config/app.config";

// Simple in-memory store for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  const now = Date.now();
  const windowStart = now - APP_CONFIG.API.RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [key, value] of rateLimit.entries()) {
    if (value.timestamp < windowStart) {
      rateLimit.delete(key);
    }
  }

  // Get current rate limit data
  const currentLimit = rateLimit.get(ip) ?? { count: 0, timestamp: now };

  // Reset if outside window
  if (currentLimit.timestamp < windowStart) {
    currentLimit.count = 0;
    currentLimit.timestamp = now;
  }

  // Increment count
  currentLimit.count++;
  rateLimit.set(ip, currentLimit);

  // Check if over limit
  if (currentLimit.count > APP_CONFIG.API.RATE_LIMIT) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil(
          (currentLimit.timestamp + APP_CONFIG.API.RATE_LIMIT_WINDOW - now) /
            1000
        ),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil(
            (currentLimit.timestamp + APP_CONFIG.API.RATE_LIMIT_WINDOW - now) /
              1000
          ).toString(),
        },
      }
    );
  }

  const response = NextResponse.next();

  // Add rate limit headers
  response.headers.set(
    "X-RateLimit-Limit",
    APP_CONFIG.API.RATE_LIMIT.toString()
  );
  response.headers.set(
    "X-RateLimit-Remaining",
    (APP_CONFIG.API.RATE_LIMIT - currentLimit.count).toString()
  );
  response.headers.set(
    "X-RateLimit-Reset",
    (currentLimit.timestamp + APP_CONFIG.API.RATE_LIMIT_WINDOW).toString()
  );

  return response;
}
