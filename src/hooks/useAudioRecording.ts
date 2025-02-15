"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAudioStore } from "@/stores/audio.store";
import { audioHelpers } from "@/helpers/audio";
import { APP_CONFIG } from "@/config/app.config";
import toast from "react-hot-toast";
import { AppError } from "@/utils/errors";

export const useAudioRecording = () => {
  const {
    isRecording,
    startRecording: startStore,
    stopRecording: stopStore,
    setError,
    setConnectionStatus,
    setProcessing,
  } = useAudioStore();

  // Refs to store cleanup functions and recording state
  const cleanupRef = useRef<(() => void) | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef(false);

  // Keep ref in sync with store
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Initialize connection status
  useEffect(() => {
    setConnectionStatus("connected");

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [setConnectionStatus]);

  const startRecording = useCallback(async () => {
    try {
      console.log("🎤 Requesting microphone access...");
      const stream = await navigator.mediaDevices
        .getUserMedia({
          audio: {
            channelCount: APP_CONFIG.AUDIO.CHANNELS,
            sampleRate: APP_CONFIG.AUDIO.SAMPLE_RATE,
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
        .catch(() => {
          throw new AppError(
            "Microphone access denied. Please allow microphone access and try again.",
            "MICROPHONE_ERROR",
            403
          );
        });
      console.log("✅ Microphone access granted");

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
      console.log("📼 MediaRecorder created with state:", recorder.state);

      recorderRef.current = recorder;

      recorder.onstart = () => {
        console.log("🎙️ Recording started");
      };

      recorder.onstop = async () => {
        console.log("⏹️ Recording stopped");
        // Clean up the stream when recording is actually stopped
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onerror = (event) => {
        console.error("❌ Recording error:", event.error);
        throw new AppError(
          "Recording failed: " + event.error.message,
          "RECORDING_ERROR",
          500
        );
      };

      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          console.log(
            "📊 Processing recording, size:",
            event.data.size,
            "bytes"
          );

          try {
            setProcessing(true);
            const wavBlob = await audioHelpers.convertToWav(event.data);
            console.log("🎵 Converted to WAV, new size:", wavBlob.size);

            const formData = new FormData();
            formData.append("audio", wavBlob);
            formData.append("timestamp", Date.now().toString());
            formData.append("duration", String(event.data.size));
            formData.append("isRecordingComplete", "true");

            const response = await fetch("/api/audio", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new AppError(
                errorData.error?.message || "Failed to process audio",
                errorData.error?.code || "PROCESSING_ERROR",
                response.status
              );
            }

            const result = await response.json();
            console.log("✅ Recording processed:", result);

            // Show appropriate toast based on result
            if (result.verses && result.verses.length > 0) {
              toast.success(
                `Detected ${result.verses.length} Bible verse${
                  result.verses.length > 1 ? "s" : ""
                }`,
                {
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
                }
              );
            } else {
              toast.error("No Bible verses detected in the recording", {
                duration: 4000,
                icon: "🔍",
                style: {
                  background: "#4B5563",
                  color: "#FFFFFF",
                  padding: "16px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "500",
                },
              });
            }

            setProcessing(false);
          } catch (error) {
            console.error("Error processing audio:", error);
            setProcessing(false);
            if (error instanceof AppError) {
              setError(error.message);
            } else {
              setError(
                error instanceof Error
                  ? error.message
                  : "Failed to process audio"
              );
            }
          }
        }
      };

      // Start store BEFORE starting recorder
      startStore();

      // Start recording
      recorder.start();

      // Store cleanup function
      cleanupRef.current = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
      };

      return cleanupRef.current;
    } catch (error) {
      console.error("Recording setup error:", error);
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError(
          error instanceof Error ? error.message : "Failed to start recording"
        );
      }
      return undefined;
    }
  }, [startStore, setError, setProcessing]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.requestData(); // Get the final chunk
      recorderRef.current.stop();
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    stopStore();
  }, [stopStore]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    connectionStatus: "connected",
  };
};
