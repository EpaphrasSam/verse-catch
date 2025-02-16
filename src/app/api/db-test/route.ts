import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";

type Diagnostics = {
  connection: {
    status: "connected" | "error";
    message: string;
    error?: unknown;
  } | null;
  counts: {
    translations: number;
    books: number;
    chapters: number;
    verses: number;
  } | null;
  sampleData:
    | {
        translation: { code: string; name: string } | null;
        book: { name: string; shortName: string } | null;
        verse: {
          text: string;
          translation: string;
          book: string;
          chapter: number;
          number: number;
        } | null;
      }
    | {
        error: string;
      }
    | null;
  environment: {
    DATABASE_URL: "Set" | "Not set";
    NODE_ENV: string | undefined;
  };
};

export async function GET() {
  try {
    // Test database connection and data
    const diagnostics: Diagnostics = {
      connection: null,
      counts: null,
      sampleData: null,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set",
        NODE_ENV: process.env.NODE_ENV,
      },
    };

    // Test connection and get counts
    try {
      const [translationCount, bookCount, chapterCount, verseCount] =
        await Promise.all([
          prisma.translation.count(),
          prisma.book.count(),
          prisma.chapter.count(),
          prisma.verseTranslation.count(),
        ]);

      diagnostics.counts = {
        translations: translationCount,
        books: bookCount,
        chapters: chapterCount,
        verses: verseCount,
      };

      diagnostics.connection = {
        status: "connected",
        message: "Successfully connected to database",
      };
    } catch (dbError) {
      diagnostics.connection = {
        status: "error",
        message:
          dbError instanceof Error ? dbError.message : "Unknown database error",
        error: dbError,
      };
    }

    // Try to get sample data if connection succeeded
    if (diagnostics.connection?.status === "connected") {
      try {
        const [sampleTranslation, sampleBook, sampleVerse] = await Promise.all([
          prisma.translation.findFirst(),
          prisma.book.findFirst(),
          prisma.verseTranslation.findFirst({
            include: {
              translation: true,
              chapter: {
                include: {
                  book: true,
                },
              },
            },
          }),
        ]);

        diagnostics.sampleData = {
          translation: sampleTranslation
            ? {
                code: sampleTranslation.code,
                name: sampleTranslation.name,
              }
            : null,
          book: sampleBook
            ? {
                name: sampleBook.name,
                shortName: sampleBook.shortName,
              }
            : null,
          verse: sampleVerse
            ? {
                text: sampleVerse.text,
                translation: sampleVerse.translation.code,
                book: sampleVerse.chapter.book.name,
                chapter: sampleVerse.chapter.number,
                number: sampleVerse.number,
              }
            : null,
        };
      } catch (sampleError) {
        diagnostics.sampleData = {
          error:
            sampleError instanceof Error
              ? sampleError.message
              : "Failed to fetch sample data",
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ...diagnostics,
    });
  } catch (error) {
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
