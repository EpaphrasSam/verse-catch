import { NextRequest } from "next/server";
import { transcribeChunk } from "@/services/transcription.service";
import { detectVerses } from "@/services/verse-detection.service";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/utils/pusher";
import { VerseDetection } from "@/types/bible.type";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const timestamp = parseInt(formData.get("timestamp") as string);
    const duration = parseInt(formData.get("duration") as string);
    const isRecordingComplete = formData.get("isRecordingComplete") === "true";

    // Validate required fields
    if (!audioFile) {
      return new Response(JSON.stringify({ error: "Audio file is required" }), {
        status: 400,
      });
    }

    if (isNaN(timestamp) || isNaN(duration)) {
      return new Response(
        JSON.stringify({ error: "Invalid timestamp or duration" }),
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Processing recording at ${timestamp} (${duration}ms)`);

    // 1. Transcribe audio with metadata
    const transcription = await transcribeChunk(buffer, {
      sequence: 0, // No longer using sequences
      timestamp,
      duration,
    });

    console.log("Transcription:", transcription);

    // 2. Detect verses from the transcription
    const verses = await detectVerses(transcription.text);
    console.log("Verses:", verses);

    // 3. If verses were detected and this is the final recording
    if (verses.length > 0 && isRecordingComplete) {
      // Add timestamp to verses
      const versesWithTimestamp: VerseDetection[] = verses.map((verse) => ({
        ...verse,
        timestamp,
      }));

      // Trigger Pusher event with new verses
      await pusherServer.trigger(
        PUSHER_CHANNELS.VERSES,
        PUSHER_EVENTS.VERSE_DETECTED,
        {
          verses: versesWithTimestamp,
          isComplete: true,
        }
      );
    }

    return new Response(
      JSON.stringify({
        transcription: transcription.text,
        verses,
        timestamp,
        duration,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Audio processing error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process audio",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
