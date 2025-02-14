import { NextRequest } from "next/server";
import { detectVerses } from "@/services/verse-detection.service";
import { errorHelpers } from "@/helpers/error";
import { useVerseStore } from "@/stores/verse.store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcription } = body;

    if (!transcription) {
      return new Response(
        JSON.stringify({ error: "Transcription is required" }),
        { status: 400 }
      );
    }

    const verses = await detectVerses(transcription);
    return new Response(JSON.stringify({ verses }), { status: 200 });
  } catch (error) {
    console.error("Verse detection error:", error);
    const appError = errorHelpers.createVerseDetectionError(
      "Failed to detect verses"
    );
    return new Response(JSON.stringify({ error: appError.message }), {
      status: appError.status,
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
        JSON.stringify({ error: "Start and end time are required" }),
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
    const appError = errorHelpers.createDatabaseError("Failed to fetch verses");
    return new Response(JSON.stringify({ error: appError.message }), {
      status: appError.status,
    });
  }
}
