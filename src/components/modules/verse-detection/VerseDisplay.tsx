"use client";

import { useVerses } from "@/hooks/useVerses";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { VerseDetection } from "@/types/bible.type";
import { useAudioStore } from "@/stores/audio.store";

const formatReference = (verse: VerseDetection) => {
  const { book, chapter, verse: verseNum, verseRange } = verse.reference;
  if (verseRange) {
    return `${book.name} ${chapter}:${verseRange.start}-${verseRange.end}`;
  }
  return `${book.name} ${chapter}:${verseNum}`;
};

const formatVerseText = (verse: VerseDetection): string => {
  // If it's already a combined text from a verse range, return as is
  if (verse.reference.verseRange) {
    return verse.text || "";
  }

  // For single verses, ensure proper formatting
  return verse.text || "";
};

const combineVerses = (verses: VerseDetection[]): VerseDetection[] => {
  if (verses.length === 0) return [];

  const combined: VerseDetection[] = [];
  let current: VerseDetection = { ...verses[0] };

  for (let i = 1; i < verses.length; i++) {
    const nextVerse = verses[i];
    const currRef = current.reference;
    const nextRef = nextVerse.reference;

    // Check if verses are consecutive in the same book and chapter
    if (
      currRef.book.name === nextRef.book.name &&
      currRef.chapter === nextRef.chapter &&
      (currRef.verseRange?.end || currRef.verse) + 1 === nextRef.verse
    ) {
      // Update verse range
      current.reference.verseRange = {
        start: currRef.verseRange?.start || currRef.verse,
        end: nextRef.verse,
      };
      // Combine the text content
      current.text = `${formatVerseText(current)} ${formatVerseText(
        nextVerse
      )}`;
      // Update timestamp to latest
      current.timestamp = Math.max(current.timestamp, nextVerse.timestamp);
    } else {
      // Push current group and start a new one
      combined.push(current);
      current = { ...nextVerse };
    }
  }

  // Don't forget to push the last group
  combined.push(current);

  return combined;
};

export const VerseDisplay = () => {
  const { verses } = useVerses();
  const { isRecording, isProcessing } = useAudioStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Show loading state if recording but no verses
  if (verses.length === 0) {
    if (isRecording) {
      return (
        <div className="max-w-4xl w-full mx-auto">
          <div className="min-h-[300px] flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-8">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <SpeakerWaveIcon className="h-6 w-6 text-gray-400" />
            </motion.div>
            <p className="mt-4 text-sm text-gray-500">
              Listening for Bible verses...
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const combinedVerses = combineVerses(verses);
  const currentVerse = combinedVerses[currentIndex];
  const reference = formatReference(currentVerse);
  const translation = currentVerse.reference.translation;
  const text = formatVerseText(currentVerse);
  const timestamp = new Date(currentVerse.timestamp)
    .toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  const nextVerse = () => {
    setCurrentIndex((prev) => (prev + 1) % combinedVerses.length);
  };

  const prevVerse = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + combinedVerses.length) % combinedVerses.length
    );
  };

  return (
    <div className="relative w-full">
      {/* Show loading bar when processing or recording */}
      {(isProcessing || isRecording) && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 overflow-hidden">
          <div
            className={`h-full bg-blue-500 ${
              isProcessing ? "animate-pulse" : "animate-progress"
            }`}
          />
        </div>
      )}
      <div className="max-w-4xl w-full mx-auto">
        <div className="relative min-h-[300px] flex flex-col bg-white rounded-lg shadow-sm p-8">
          <div className="flex-1 relative">
            {verses.length > 1 && (
              <button
                onClick={prevVerse}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10"
                aria-label="Previous verse"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="px-4 sm:px-16"
              >
                <div className="text-center space-y-6">
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    {reference} ({translation})
                  </h2>
                  <div className="max-h-[180px] overflow-y-auto">
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      {text}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {verses.length > 1 && (
              <button
                onClick={nextVerse}
                className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10"
                aria-label="Next verse"
              >
                <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
          </div>

          {/* Bottom info - naturally positioned */}
          <div className="mt-6 flex justify-center items-center text-sm px-4 sm:px-8 relative">
            <div className="absolute left-2 sm:left-8 text-gray-500">
              {timestamp}
            </div>
            {verses.length > 1 ? (
              <div className="text-gray-400">
                {currentIndex + 1} of {verses.length}
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
