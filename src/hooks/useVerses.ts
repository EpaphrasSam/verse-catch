"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { pusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/utils/pusher";
import { useVerseStore } from "@/stores/verse.store";
import { VerseDetection } from "@/types/bible.type";

// Fetcher function for initial verses (if needed)
const fetchVerses = async (): Promise<VerseDetection[]> => {
  // You could fetch initial verses from an API endpoint
  return [];
};

export const useVerses = () => {
  const { addVerses, detectedVerses, isLoading, error } = useVerseStore();

  // SWR hook for initial data and revalidation
  const { mutate } = useSWR("verses", fetchVerses, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    // Subscribe to verse updates
    const channel = pusherClient.subscribe(PUSHER_CHANNELS.VERSES);

    // Handle verse detection events
    channel.bind(
      PUSHER_EVENTS.VERSE_DETECTED,
      (data: { verses: VerseDetection[] }) => {
        addVerses(data.verses);
        // Update SWR cache with new verses
        mutate(
          (currentData: VerseDetection[] = []) => [
            ...data.verses,
            ...currentData,
          ],
          false
        );
      }
    );

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(PUSHER_CHANNELS.VERSES);
    };
  }, [mutate, addVerses]);

  return {
    verses: detectedVerses,
    isLoading,
    error,
    mutate,
  };
};
