export const APP_CONFIG = {
  API: {
    RATE_LIMIT: 60, // requests per minute
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute in milliseconds
  },
  AUDIO: {
    CHUNK_DURATION: 10000, // 10 seconds
    MAX_DURATION: 3600000, // 1 hour
    SAMPLE_RATE: 16000,
    CHANNELS: 1,
    FORMAT: "audio/wav",
  },
  SOCKET: {
    RECONNECT_DELAY: 1000,
    MAX_RETRIES: 5,
    EVENTS: {
      AUDIO_CHUNK: "audio:chunk",
      VERSES_DETECTED: "verses:detected",
      ERROR: "error",
      PROCESSING_STATUS: "processing:status",
    },
  },
  VERSE_DETECTION: {
    MIN_CONFIDENCE: 0.6,
    BATCH_SIZE: 5,
    MAX_VERSES_PER_CHUNK: 10,
  },
  UI: {
    MAX_VERSES_DISPLAY: 50,
    VERSE_REFRESH_INTERVAL: 1000, // 1 second
    AUDIO_VISUALIZER: {
      WAVE_COLOR: "#4f46e5",
      PROGRESS_COLOR: "#818cf8",
      HEIGHT: 100,
      NORMALIZE: true,
    },
  },
} as const;

// Type for the config
export type AppConfig = typeof APP_CONFIG;

// Helper to get nested config values with type safety
export function getConfig<
  K1 extends keyof AppConfig,
  K2 extends keyof AppConfig[K1]
>(key1: K1, key2: K2): AppConfig[K1][K2] {
  return APP_CONFIG[key1][key2];
}
