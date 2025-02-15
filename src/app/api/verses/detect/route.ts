import { NextRequest } from "next/server";
import { processAudioChunk } from "@/services/sermon.service";
import { pusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/utils/pusher";
import { AppError, formatErrorForClient } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const sequence = formData.get("sequence") as string;

    if (!audioFile) {
      return new Response(
        JSON.stringify({
          error: formatErrorForClient(
            new AppError("Audio file is required", "VALIDATION_ERROR", 400)
          ),
        }),
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process audio chunk
    const verses = await processAudioChunk({
      blob: new Blob([buffer], { type: "audio/wav" }),
      timestamp: Date.now(),
      duration: 5000, // 5 seconds
      sequence: parseInt(sequence || "0", 10),
    });

    // Broadcast verses through Pusher if any were detected
    if (verses.length > 0) {
      await pusherServer.trigger(
        PUSHER_CHANNELS.VERSES,
        PUSHER_EVENTS.VERSE_DETECTED,
        {
          verses,
        }
      );
    }

    return new Response(JSON.stringify({ success: true, verses }), {
      status: 200,
    });
  } catch (error) {
    console.error("Audio processing error:", error);
    const formattedError = formatErrorForClient(error);
    return new Response(JSON.stringify({ error: formattedError }), {
      status: error instanceof AppError ? error.statusCode : 500,
    });
  }
}
