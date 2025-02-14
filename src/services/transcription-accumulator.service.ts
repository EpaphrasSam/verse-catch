import { TranscriptionResult } from "./transcription.service";

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
  // If sequence is not consecutive, clear buffer
  if (
    state.lastSequence !== -1 &&
    transcription.sequence !== state.lastSequence + 1
  ) {
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
};
