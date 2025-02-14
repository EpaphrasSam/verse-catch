export const APP_CONSTANTS = {
  AUDIO: {
    CHUNK_DURATION: 3000, // 3 seconds
    MAX_CHUNKS_IN_MEMORY: 10,
    SUPPORTED_FORMATS: ["audio/webm", "audio/wav"],
    SAMPLE_RATE: 16000,
  },

  VERSE_DETECTION: {
    MIN_CONFIDENCE: 0.7,
    CONTEXT_WINDOW: 3, // Number of chunks to consider for context
    MAX_VERSES_PER_RESPONSE: 5,
  },

  SOCKET: {
    EVENTS: {
      CONNECT: "connect",
      DISCONNECT: "disconnect",
      AUDIO_CHUNK: "audio-chunk",
      VERSES_DETECTED: "verses-detected",
      ERROR: "error",
    },
    RECONNECT_DELAY: 1000,
  },
} as const;
