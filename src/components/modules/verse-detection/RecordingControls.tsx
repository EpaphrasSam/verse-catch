"use client";

import { AudioWaveform } from "@/components/common/feedback/AudioWaveform";
import { Button, Card } from "@heroui/react";
import {
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/solid";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const RecordingControls = () => {
  const { isRecording, startRecording, stopRecording, connectionStatus } =
    useAudioRecording();
  const [hasStarted, setHasStarted] = useState(false);

  const handleToggleRecording = () => {
    if (!hasStarted) {
      setHasStarted(true);
      startRecording();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // Reset hasStarted when component unmounts (page reload)
  // useEffect(() => {
  //   return () => setHasStarted(false);
  // }, []);

  return (
    <Card className="w-full max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-8 p-6">
        {/* Icon Area - Always visible, changes based on state */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            {isRecording ? (
              <AudioWaveform />
            ) : !hasStarted ? (
              <SpeakerWaveIcon className="h-6 w-6 text-gray-400" />
            ) : (
              <PlayIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Transcribing and detecting Bible quotations in real time.
          </p>
        </div>

        {/* Control Button */}
        <Button
          variant={!hasStarted ? "solid" : isRecording ? "light" : "solid"}
          onPress={handleToggleRecording}
          disabled={connectionStatus !== "connected"}
          className={cn(
            "w-[250px] py-6 justify-center",
            !isRecording ? "!bg-black !text-white" : "!bg-red-500 !text-white"
          )}
          radius="full"
          startContent={
            !hasStarted ? (
              <MicrophoneIcon className="h-5 w-5" />
            ) : isRecording ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <MicrophoneIcon className="h-5 w-5" />
            )
          }
        >
          {!hasStarted
            ? "Start Listening"
            : isRecording
            ? "Stop Listening"
            : "Continue Listening"}
        </Button>
      </div>
    </Card>
  );
};
