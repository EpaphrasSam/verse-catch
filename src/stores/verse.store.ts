import { create } from "zustand";
import { VerseDetection } from "@/types/bible.type";

interface VerseStore {
  // State
  detectedVerses: VerseDetection[];
  isLoading: boolean;
  error: string | null;
  lastProcessedSequence: number;

  // Actions
  addVerse: (verse: VerseDetection) => void;
  addVerses: (verses: VerseDetection[]) => void;
  clearVerses: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getVersesByTimeRange: (
    startTime: number,
    endTime: number
  ) => VerseDetection[];
}

export const useVerseStore = create<VerseStore>((set, get) => ({
  // Initial state
  detectedVerses: [],
  isLoading: false,
  error: null,
  lastProcessedSequence: 0,

  // Actions
  addVerse: (verse) =>
    set((state) => ({
      detectedVerses: [verse, ...state.detectedVerses], // Keep full history
      lastProcessedSequence: Math.max(
        state.lastProcessedSequence,
        verse.sequence || 0
      ),
    })),

  addVerses: (verses) =>
    set((state) => ({
      detectedVerses: [...verses, ...state.detectedVerses], // Keep full history
      lastProcessedSequence: Math.max(
        state.lastProcessedSequence,
        ...verses.map((v) => v.sequence || 0)
      ),
    })),

  clearVerses: () =>
    set({
      detectedVerses: [],
      lastProcessedSequence: 0,
    }),

  setError: (error) => set({ error }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Utility function to get verses by time range
  getVersesByTimeRange: (startTime: number, endTime: number) => {
    const state = get();
    return state.detectedVerses.filter(
      (verse) => verse.timestamp >= startTime && verse.timestamp <= endTime
    );
  },
}));
