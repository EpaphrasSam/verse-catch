import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // List of possible paths to check
    const possiblePaths = [
      "/tmp/prisma/bible.db",
      "./prisma/bible.db",
      "/var/task/prisma/bible.db",
      path.join(process.cwd(), "prisma/bible.db"),
    ];

    // Add DATABASE_URL path if it exists
    if (process.env.DATABASE_URL) {
      possiblePaths.push(process.env.DATABASE_URL.replace("file:", ""));
    }

    // Check all paths
    const pathResults = possiblePaths.map((dbPath) => ({
      path: dbPath,
      exists: fs.existsSync(dbPath),
      stats: fs.existsSync(dbPath) ? fs.statSync(dbPath) : null,
      absolutePath: path.resolve(dbPath),
    }));

    // System information
    const systemInfo = {
      cwd: process.cwd(),
      tmpExists: fs.existsSync("/tmp"),
      tmpWritable: false,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL,
        PWD: process.env.PWD,
      },
    };

    // Check if /tmp is writable
    try {
      if (fs.existsSync("/tmp")) {
        fs.accessSync("/tmp", fs.constants.W_OK);
        systemInfo.tmpWritable = true;
      }
    } catch {
      systemInfo.tmpWritable = false;
    }

    // Try database connection
    let dbConnection = null;
    try {
      const translation = await prisma.translation.findFirst();
      dbConnection = {
        success: true,
        sampleTranslation: translation?.code,
      };
    } catch (dbError) {
      dbConnection = {
        success: false,
        error:
          dbError instanceof Error
            ? {
                message: dbError.message,
                name: dbError.name,
              }
            : dbError,
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      paths: pathResults.map((result) => ({
        path: result.path,
        absolutePath: result.absolutePath,
        exists: result.exists,
        size: result.stats
          ? `${(result.stats.size / (1024 * 1024)).toFixed(2)}MB`
          : null,
        permissions: result.stats
          ? result.stats.mode.toString(8).slice(-3)
          : null,
      })),
      system: systemInfo,
      database: dbConnection,
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Diagnostic check failed",
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
