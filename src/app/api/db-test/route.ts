import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import fs from "fs";

export async function GET() {
  try {
    // Test database connection by running a simple query
    const translation = await prisma.translation.findFirst();

    // Get database file path from environment variable
    const dbPath =
      process.env.NODE_ENV === "production"
        ? "/tmp/prisma/bible.db"
        : "./prisma/bible.db";

    // Check if file exists
    const fileExists = fs.existsSync(dbPath);

    // Get file stats if it exists
    const fileStats = fileExists ? fs.statSync(dbPath) : null;

    return NextResponse.json({
      status: "success",
      message: "Database is connected",
      details: {
        dbPath,
        fileExists,
        fileSize: fileStats
          ? `${(fileStats.size / (1024 * 1024)).toFixed(2)}MB`
          : null,
        filePermissions: fileStats
          ? fileStats.mode.toString(8).slice(-3)
          : null,
        sampleTranslation: translation ? translation.code : null,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to database",
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      },
      { status: 500 }
    );
  }
}
