import openai from "@/utils/openai";
import { errorHelpers } from "@/helpers/error";
import fs from "fs";
import path from "path";
import os from "os";

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
// const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (OpenAI's limit)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// async function validateAudioFile(filePath: string): Promise<void> {
//   const stats = await fs.promises.stat(filePath);
//   console.log("Audio file stats:", {
//     size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
//     created: stats.birthtime,
//     modified: stats.mtime,
//   });

//   if (stats.size > MAX_FILE_SIZE) {
//     throw new Error(
//       `File size ${(stats.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${
//         MAX_FILE_SIZE / 1024 / 1024
//       }MB`
//     );
//   }

//   if (stats.size === 0) {
//     throw new Error("Audio file is empty");
//   }
// }

export const transcribeChunk = async (
  audioBuffer: Buffer,
  metadata: TranscriptionMetadata
): Promise<TranscriptionResult> => {
  let tempFilePath: string | null = null;
  let retryCount = 0;

  const attemptTranscription = async () => {
    try {
      // Create and verify the temporary file
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `chunk-${metadata.sequence}.wav`);

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

      // Create a fresh file stream for OpenAI
      const fileStream = fs.createReadStream(tempFilePath);

      console.log(
        "Debug - Attempting OpenAI transcription (attempt ${retryCount + 1})..."
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
        if (error.message.includes("ECONNRESET") && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying transcription (attempt ${retryCount + 1})...`);
          await sleep(RETRY_DELAY * retryCount);
          return attemptTranscription();
        }
      }
      throw error;
    }
  };

  try {
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

    throw errorHelpers.createTranscriptionError(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
    }
  }
};
