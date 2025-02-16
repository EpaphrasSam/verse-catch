import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

// Remove edge runtime as it might be causing timeout issues
// export const runtime = "edge";

export async function GET(request: Request) {
  try {
    // Add timeout to the database query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 25000)
    );

    // Make a lighter query - just check if we can connect
    const dbPromise = prisma.$queryRaw`SELECT 1 as alive`;

    // Race between timeout and query
    await Promise.race([timeoutPromise, dbPromise]);

    // If we get here, the database is responsive
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
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
  } finally {
    // Ensure connection is properly closed
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
  }
}
