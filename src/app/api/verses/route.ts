import { NextRequest } from "next/server";
import { detectVerses } from "@/services/verse-detection.service";
import { useVerseStore } from "@/stores/verse.store";
import { AppError, formatErrorForClient } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcription } = body;

    if (!transcription) {
      return new Response(
        JSON.stringify({
          error: formatErrorForClient(
            new AppError("Transcription is required", "VALIDATION_ERROR", 400)
          ),
        }),
        { status: 400 }
      );
    }

    const verses = await detectVerses(transcription);
    return new Response(JSON.stringify({ verses }), { status: 200 });
  } catch (error) {
    console.error("Verse detection error:", error);
    const formattedError = formatErrorForClient(error);
    return new Response(JSON.stringify({ error: formattedError }), {
      status: error instanceof AppError ? error.statusCode : 500,
    });
  }
}

// Get verses by time range from in-memory store
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!startTime || !endTime) {
      return new Response(
        JSON.stringify({
          error: formatErrorForClient(
            new AppError(
              "Start and end time are required",
              "VALIDATION_ERROR",
              400
            )
          ),
        }),
        { status: 400 }
      );
    }

    // Use verse store's time range function
    const verses = useVerseStore
      .getState()
      .getVersesByTimeRange(parseInt(startTime), parseInt(endTime));

    return new Response(JSON.stringify({ verses }), { status: 200 });
  } catch (error) {
    console.error("Verse fetch error:", error);
    const formattedError = formatErrorForClient(error);
    return new Response(JSON.stringify({ error: formattedError }), {
      status: error instanceof AppError ? error.statusCode : 500,
    });
  }
}
