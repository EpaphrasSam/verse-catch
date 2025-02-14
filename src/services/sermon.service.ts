import { transcribeChunk, TranscriptionResult } from "./transcription.service";
import { detectVerses } from "./verse-detection.service";
import {
  AudioChunk,
  VerseDetection,
  ProcessingMetadata,
} from "@/types/bible.type";
import { errorHelpers } from "@/helpers/error";
import { APP_CONFIG } from "@/config/app.config";

interface ProcessingState {
  isProcessing: boolean;
  queue: AudioChunk[];
  pendingTranscription: TranscriptionResult | null;
  lastSequence: number;
  processingMetadata: ProcessingMetadata[];
}

const state: ProcessingState = {
  isProcessing: false,
  queue: [],
  pendingTranscription: null,
  lastSequence: 0,
  processingMetadata: [],
};

const processQueue = async (): Promise<VerseDetection[]> => {
  if (state.isProcessing || state.queue.length === 0) return [];

  state.isProcessing = true;
  const chunk = state.queue.shift()!;
  const startTime = Date.now();

  try {
    // Validate audio duration
    if (chunk.duration > APP_CONFIG.AUDIO.MAX_DURATION) {
      throw errorHelpers.createTranscriptionError(
        "Audio chunk exceeds maximum duration"
      );
    }

    // Convert audio chunk to buffer
    const arrayBuffer = await chunk.blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Start transcription immediately
    const transcriptionPromise = transcribeChunk(buffer);
    let verseDetectionPromise: Promise<VerseDetection[]> | null = null;

    // While transcribing, process any pending verse detections
    if (state.pendingTranscription) {
      verseDetectionPromise = detectVerses(state.pendingTranscription.text);
    }

    // Wait for current transcription
    const transcriptionEndTime = Date.now();
    const transcription = await transcriptionPromise;

    // If we had pending verses, get them
    if (verseDetectionPromise) {
      const verses = await verseDetectionPromise;
      const detectionEndTime = Date.now();

      // Add processing metadata
      state.processingMetadata.push({
        transcriptionTime: transcriptionEndTime - startTime,
        detectionTime: detectionEndTime - transcriptionEndTime,
        totalTime: detectionEndTime - startTime,
        chunkSequence: chunk.sequence,
      });

      // Keep only recent metadata
      if (
        state.processingMetadata.length > APP_CONFIG.VERSE_DETECTION.BATCH_SIZE
      ) {
        state.processingMetadata = state.processingMetadata.slice(
          -APP_CONFIG.VERSE_DETECTION.BATCH_SIZE
        );
      }

      // Return verses with timestamps and sequence
      return verses.map((verse) => ({
        ...verse,
        timestamp: transcription.timestamp,
        sequence: transcription.sequence,
      }));
    }

    state.pendingTranscription = transcription;
    return [];
  } catch (error) {
    console.error("Processing error:", error);
    throw errorHelpers.createTranscriptionError(
      "Failed to process audio chunk"
    );
  } finally {
    state.isProcessing = false;
    // Process next chunk if available
    if (state.queue.length > 0) {
      void processQueue(); // void to ignore promise
    }
  }
};

export const processAudioChunk = async (
  chunk: AudioChunk
): Promise<VerseDetection[]> => {
  // Add sequence number if not present
  const processedChunk = {
    ...chunk,
    sequence: chunk.sequence ?? ++state.lastSequence,
  };

  // Add to queue and process
  state.queue.push(processedChunk);
  return processQueue();
};

// Utility to get processing statistics
export const getProcessingStats = () => {
  const metadata = [...state.processingMetadata];
  state.processingMetadata = []; // Clear after reading
  return metadata;
};
