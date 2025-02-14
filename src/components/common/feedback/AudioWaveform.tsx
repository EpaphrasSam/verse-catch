"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const AudioWaveform = () => {
  const [peaks, setPeaks] = useState<number[]>([]);

  useEffect(() => {
    // Simulate audio peaks
    const interval = setInterval(() => {
      setPeaks(Array.from({ length: 8 }, () => Math.random()));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-[2px] h-full w-full">
      {peaks.map((peak, i) => (
        <motion.div
          key={i}
          initial={{ height: 4 }}
          animate={{ height: Math.max(4, peak * 16) }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="w-[2px] bg-red-500 rounded-full"
        />
      ))}
    </div>
  );
};
