export interface BibleReference {
  book: {
    number: number;
    name: string;
    shortName: string;
  };
  chapter: number;
  verse: number;
  verseRange?: {
    start: number;
    end: number;
  };
  confidence: number;
  detectionType: "explicit" | "implicit" | "contextual";
  translation?: string; // Bible translation code (e.g., "NIV", "KJV")
}

export interface VerseDetection {
  reference: BibleReference;
  text?: string;
  source: "gemini" | "database" | "hybrid";
  confidence: number;
  timestamp: number;
  processingTime?: number; // Time taken to detect and verify
  sequence: number; // Add sequence number to track order
}

export interface AudioChunk {
  blob: Blob;
  timestamp: number;
  duration: number;
  sequence: number; // To maintain order of chunks
}

export interface ProcessingMetadata {
  transcriptionTime: number;
  detectionTime: number;
  totalTime: number;
  chunkSequence: number;
}
