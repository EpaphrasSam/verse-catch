"use client";

import { useAudioRecording } from "@/hooks/useAudioRecording";

export const StatusText = () => {
  const { isRecording, connectionStatus } = useAudioRecording();
  const isConnected = connectionStatus === "connected";

  if (!isConnected) {
    return <p className="text-gray-500">Connecting to server...</p>;
  }

  if (isRecording) {
    return (
      <p className="text-gray-500">
        Transcribing and detecting Bible quotations in real time.
      </p>
    );
  }

  return (
    <p className="text-gray-500">
      Click the button below to start detecting Bible verses.
    </p>
  );
};
