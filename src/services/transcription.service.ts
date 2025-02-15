import openai from "@/utils/openai";
import fs from "fs";
import path from "path";
import { env } from "@/config/env.config";
import {
  AppError,
  FileSizeError,
  StorageError,
  TranscriptionError,
} from "@/utils/errors";

export interface TranscriptionResult {
  text: string;
  timestamp: number;
  sequence: number;
  duration: number;
}

export interface TranscriptionMetadata {
  sequence: number;
  timestamp: number;
  duration: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Size limits
const MAX_TEMP_SIZE = 500 * 1024 * 1024; // 500MB (Vercel /tmp limit)
const MAX_OPENAI_SIZE = 25 * 1024 * 1024; // 25MB (OpenAI's Whisper API limit)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Get temp directory based on environment
const getTempDir = () => {
  // Use /tmp in production (Vercel), local tmp directory in development
  return env.server.NODE_ENV === "production"
    ? "/tmp"
    : path.join(process.cwd(), "tmp");
};

// Validate file size
const validateFileSize = (size: number, type: "temp" | "openai") => {
  const limit = type === "temp" ? MAX_TEMP_SIZE : MAX_OPENAI_SIZE;
  const limitMB = limit / (1024 * 1024);

  if (size > limit) {
    throw new FileSizeError(
      `File size ${(size / (1024 * 1024)).toFixed(2)}MB exceeds ${
        type === "temp" ? "Vercel" : "OpenAI"
      } limit of ${limitMB}MB`
    );
  }
};

export const transcribeChunk = async (
  audioBuffer: Buffer,
  metadata: TranscriptionMetadata
): Promise<TranscriptionResult> => {
  let tempFilePath: string | null = null;
  let retryCount = 0;

  try {
    // Validate buffer size for both Vercel and OpenAI limits
    validateFileSize(audioBuffer.length, "temp");
    validateFileSize(audioBuffer.length, "openai");

    const attemptTranscription = async () => {
      try {
        // Get appropriate temp directory
        const tempDir = getTempDir();

        // Ensure temp directory exists
        if (!fs.existsSync(tempDir)) {
          await fs.promises.mkdir(tempDir, { recursive: true });
        }

        // Check available space in temp directory (production only)
        if (env.server.NODE_ENV === "production") {
          try {
            const stats = await fs.promises.stat("/tmp");
            const availableSpace = stats.blocks * stats.blksize;
            if (availableSpace < audioBuffer.length) {
              throw new StorageError("Insufficient space in temporary storage");
            }
          } catch (error) {
            console.warn("Could not check temp directory space:", error);
          }
        }

        tempFilePath = path.join(
          tempDir,
          `chunk-${metadata.sequence}-${Date.now()}.wav`
        );

        // Write the buffer to file
        await fs.promises.writeFile(tempFilePath, audioBuffer);
        console.log("Debug - File written successfully");

        // Verify the file exists and log its details
        const stats = await fs.promises.stat(tempFilePath);
        console.log("Debug - File details:", {
          path: tempFilePath,
          size: `${(stats.size / 1024).toFixed(2)}KB`,
          exists: fs.existsSync(tempFilePath),
        });

        // Double-check file size before sending to OpenAI
        validateFileSize(stats.size, "openai");

        // Create a fresh file stream for OpenAI
        const fileStream = fs.createReadStream(tempFilePath);

        console.log(
          `Debug - Attempting OpenAI transcription (attempt ${
            retryCount + 1
          })...`
        );
        const response = await openai.audio.transcriptions.create({
          file: fileStream,
          model: "whisper-1",
          response_format: "json",
        });

        return {
          text: response.text,
          timestamp: metadata.timestamp,
          sequence: metadata.sequence,
          duration: metadata.duration,
        };
      } catch (error) {
        if (error instanceof Error) {
          // Check if it's a connection error and we can retry
          if (
            error.message.includes("ECONNRESET") &&
            retryCount < MAX_RETRIES
          ) {
            retryCount++;
            console.log(
              `Retrying transcription (attempt ${retryCount + 1})...`
            );
            await sleep(RETRY_DELAY * retryCount);
            return attemptTranscription();
          }
        }
        throw error;
      }
    };

    return await attemptTranscription();
  } catch (error) {
    console.error("Transcription error:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              cause: error.cause,
            }
          : error,
      file: tempFilePath
        ? {
            exists: fs.existsSync(tempFilePath),
            size: fs.existsSync(tempFilePath)
              ? (await fs.promises.stat(tempFilePath)).size
              : null,
          }
        : null,
    });

    // Convert to TranscriptionError if not already an AppError
    if (!(error instanceof AppError)) {
      throw new TranscriptionError(
        error instanceof Error ? error.message : "Unknown transcription error"
      );
    }
    throw error;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }
  }
};
