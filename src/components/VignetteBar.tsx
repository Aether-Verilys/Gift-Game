import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VignetteBarProps {
  quote: string;
  author: string;
  visible: boolean;
}

export const VignetteBar: React.FC<VignetteBarProps> = ({ quote, author, visible }) => {
  if (!visible || !quote) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 1.2 }}
        className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center max-w-md px-4"
      >
        <p className="font-artistic text-xs text-white/45 tracking-normal leading-relaxed">
          {quote}
        </p>
        <span className="inline-block mt-0.5 text-[10px] font-garamond text-white/25 tracking-[0.1em] uppercase">
          — {author}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};
