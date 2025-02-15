import { TranscriptionResult } from "./transcription.service";
import { AppError, TranscriptionError } from "@/utils/errors";

interface AccumulatorState {
  buffer: string;
  lastSequence: number;
  lastTimestamp: number;
}

const state: AccumulatorState = {
  buffer: "",
  lastSequence: -1,
  lastTimestamp: 0,
};

const MAX_BUFFER_SIZE = 10000; // Maximum characters in buffer

const isCompleteSentence = (text: string): boolean => {
  // Check if text ends with sentence-ending punctuation
  return /[.!?]\s*$/.test(text.trim());
};

export const accumulateTranscription = (
  transcription: TranscriptionResult
): {
  text: string | null;
  timestamp: number;
  sequence: number;
} => {
  try {
    // Validate input
    if (!transcription || typeof transcription.text !== "string") {
      throw new TranscriptionError("Invalid transcription input");
    }

    // Check for buffer overflow
    if (state.buffer.length + transcription.text.length > MAX_BUFFER_SIZE) {
      // Clear buffer if it would overflow
      console.warn("Buffer overflow, clearing accumulator");
      state.buffer = "";
    }

    // If sequence is not consecutive, clear buffer
    if (
      state.lastSequence !== -1 &&
      transcription.sequence !== state.lastSequence + 1
    ) {
      console.warn(
        `Non-consecutive sequence detected (expected ${
          state.lastSequence + 1
        }, got ${transcription.sequence}), clearing buffer`
      );
      state.buffer = "";
    }

    // Update state
    state.lastSequence = transcription.sequence;
    state.lastTimestamp = transcription.timestamp;

    // Append new transcription
    state.buffer += " " + transcription.text;
    state.buffer = state.buffer.trim();

    // If we have a complete sentence
    if (isCompleteSentence(state.buffer)) {
      const result = {
        text: state.buffer,
        timestamp: state.lastTimestamp,
        sequence: state.lastSequence,
      };
      state.buffer = ""; // Clear buffer
      return result;
    }

    return {
      text: null,
      timestamp: state.lastTimestamp,
      sequence: state.lastSequence,
    };
  } catch (error) {
    console.error("Transcription accumulation error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new TranscriptionError(
      error instanceof Error
        ? error.message
        : "Failed to accumulate transcription"
    );
  }
};
