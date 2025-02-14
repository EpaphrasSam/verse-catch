import { create } from "zustand";
import { AudioChunk } from "@/types/bible.type";
import toast from "react-hot-toast";

// Toast styling configuration
const toastStyles = {
  success: {
    duration: 4000,
    icon: "📖",
    style: {
      background: "#10B981",
      color: "#FFFFFF",
      padding: "16px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "500",
    },
  },
  error: {
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "#EF4444",
      color: "#FFFFFF",
      padding: "16px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "500",
    },
  },
  loading: {
    icon: "🎙️",
    style: {
      background: "#3B82F6",
      color: "#FFFFFF",
      padding: "16px",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "500",
    },
  },
};

interface AudioStore {
  // State
  isRecording: boolean;
  isProcessing: boolean;
  currentChunk: AudioChunk | null;
  error: string | null;
  connectionStatus: "connected" | "disconnected" | "connecting";

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  setCurrentChunk: (chunk: AudioChunk | null) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (
    status: "connected" | "disconnected" | "connecting"
  ) => void;
  setProcessing: (isProcessing: boolean) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  // Initial state
  isRecording: false,
  isProcessing: false,
  currentChunk: null,
  error: null,
  connectionStatus: "connecting",

  // Actions
  startRecording: () => set({ isRecording: true, error: null }),
  stopRecording: () => set({ isRecording: false }),
  setCurrentChunk: (chunk) => set({ currentChunk: chunk }),
  setError: (error) => {
    set({ error });
    if (error) {
      toast.error(error, toastStyles.error);
    }
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setProcessing: (isProcessing) => {
    set({ isProcessing });
    if (isProcessing) {
      toast.loading("Processing your recording...", {
        id: "processing",
        ...toastStyles.loading,
      });
    } else {
      toast.dismiss("processing");
    }
  },
}));
