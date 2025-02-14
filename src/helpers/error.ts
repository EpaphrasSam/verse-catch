export interface AppError {
  message: string;
  status: number;
  type: string;
}

export const errorHelpers = {
  createTranscriptionError: (message: string): AppError => ({
    message,
    status: 500,
    type: "TRANSCRIPTION_ERROR",
  }),

  createVerseDetectionError: (message: string): AppError => ({
    message,
    status: 500,
    type: "VERSE_DETECTION_ERROR",
  }),

  createDatabaseError: (message: string): AppError => ({
    message,
    status: 500,
    type: "DATABASE_ERROR",
  }),

  createSocketError: (message: string): AppError => ({
    message,
    status: 500,
    type: "SOCKET_ERROR",
  }),

  createAudioProcessingError: (message: string): AppError => ({
    message,
    status: 500,
    type: "AUDIO_PROCESSING_ERROR",
  }),

  isAppError: (error: unknown): error is AppError => {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      "status" in error &&
      "type" in error
    );
  },
};
