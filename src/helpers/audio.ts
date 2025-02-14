import { AudioChunk } from "@/types/bible.type";
import { APP_CONFIG } from "@/config/app.config";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Singleton AudioContext
let sharedAudioContext: AudioContext | null = null;
let isProcessing = false;

export const audioHelpers = {
  validateAudioFormat: (blob: Blob): boolean => {
    return blob.type === "audio/webm" || blob.type === "audio/wav";
  },

  createAudioChunk: (
    blob: Blob,
    duration: number = 3000,
    sequence: number = 0
  ): AudioChunk => ({
    blob,
    timestamp: Date.now(),
    duration,
    sequence,
  }),

  // Convert audio format if needed
  ensureCorrectFormat: async (blob: Blob): Promise<Blob> => {
    if (blob.type === "audio/webm") return blob;
    return blob;
  },

  // Convert WebM to WAV using Web Audio API
  convertToWav: async (webmBlob: Blob): Promise<Blob> => {
    // Wait if another conversion is in progress
    while (isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    isProcessing = true;

    try {
      // Initialize shared context if needed
      if (!sharedAudioContext || sharedAudioContext.state === "closed") {
        const AudioContextClass = (window.AudioContext ||
          window.webkitAudioContext) as typeof AudioContext;
        sharedAudioContext = new AudioContextClass({
          sampleRate: APP_CONFIG.AUDIO.SAMPLE_RATE,
        });
      }

      // Create audio buffer from blob
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await sharedAudioContext.decodeAudioData(arrayBuffer);

      // Create WAV file
      const numberOfChannels = APP_CONFIG.AUDIO.CHANNELS;
      const length = audioBuffer.length * numberOfChannels * 2; // 2 bytes per sample
      const buffer = new ArrayBuffer(44 + length);
      const view = new DataView(buffer);

      // Write WAV header
      // "RIFF" identifier
      view.setUint8(0, 0x52); // R
      view.setUint8(1, 0x49); // I
      view.setUint8(2, 0x46); // F
      view.setUint8(3, 0x46); // F

      // File length
      view.setUint32(4, 36 + length, true);

      // "WAVE" identifier
      view.setUint8(8, 0x57); // W
      view.setUint8(9, 0x41); // A
      view.setUint8(10, 0x56); // V
      view.setUint8(11, 0x45); // E

      // "fmt " chunk
      view.setUint8(12, 0x66); // f
      view.setUint8(13, 0x6d); // m
      view.setUint8(14, 0x74); // t
      view.setUint8(15, 0x20); // " "

      // Format chunk length
      view.setUint32(16, 16, true);
      // Sample format (raw)
      view.setUint16(20, 1, true);
      // Channel count
      view.setUint16(22, numberOfChannels, true);
      // Sample rate
      view.setUint32(24, APP_CONFIG.AUDIO.SAMPLE_RATE, true);
      // Byte rate (sample rate * block align)
      view.setUint32(
        28,
        APP_CONFIG.AUDIO.SAMPLE_RATE * numberOfChannels * 2,
        true
      );
      // Block align (channel count * bytes per sample)
      view.setUint16(32, numberOfChannels * 2, true);
      // Bits per sample
      view.setUint16(34, 16, true);

      // "data" chunk
      view.setUint8(36, 0x64); // d
      view.setUint8(37, 0x61); // a
      view.setUint8(38, 0x74); // t
      view.setUint8(39, 0x61); // a

      // Data chunk length
      view.setUint32(40, length, true);

      // Write audio data
      const floatTo16BitPCM = (
        output: DataView,
        offset: number,
        input: Float32Array
      ) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
      };

      const channelData = new Float32Array(audioBuffer.length);
      const offset = 44;
      for (let channel = 0; channel < numberOfChannels; channel++) {
        audioBuffer.copyFromChannel(channelData, channel);
        floatTo16BitPCM(
          view,
          offset + channel * audioBuffer.length * 2,
          channelData
        );
      }

      return new Blob([buffer], { type: "audio/wav" });
    } catch (error: unknown) {
      console.error("Error converting audio:", error);
      // If we get a decode error, reset the context
      if (error instanceof Error && error.message.includes("decode")) {
        if (sharedAudioContext?.state !== "closed") {
          await sharedAudioContext?.close();
        }
        sharedAudioContext = null;
      }
      throw error;
    } finally {
      isProcessing = false;
    }
  },
};
