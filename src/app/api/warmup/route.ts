import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    // Check for monitoring token if needed
    const url = new URL(request.url);
    const monitorToken = url.searchParams.get("monitor_key");

    // Optional: validate monitor token
    if (process.env.MONITOR_KEY && monitorToken !== process.env.MONITOR_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Make a light query - just count translations
    const count = await prisma.translation.count();

    // Return 200 OK with basic info
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        translations: count,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Warmup error:", error);

    // Return 500 to trigger monitor alert
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Database warmup failed",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
