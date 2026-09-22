import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NarrationOverlayProps {
  narration: string | null;
  onDismiss: () => void;
}

export const NarrationOverlay: React.FC<NarrationOverlayProps> = ({
  narration,
  onDismiss,
}) => {
  if (!narration) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="absolute top-24 md:top-28 lg:top-32 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20 pointer-events-auto text-center"
      >
        <div className="relative py-2 px-4 select-none">
          {/* Subtle Starlight Glyph */}
          <div className="text-white/30 font-garamond text-xs mb-2 select-none">✧</div>

          {/* Elongated Poetic Narration Text */}
          <p className="font-artistic text-white/85 text-[15px] md:text-[16px] lg:text-[17px] tracking-normal leading-[1.8] mb-4 text-glow-sm max-w-2xl mx-auto">
            {narration}
          </p>

          <button
            id="continue-walking-btn"
            onClick={onDismiss}
            className="group relative inline-block py-1 px-3 font-garamond text-[11px] md:text-xs tracking-[0.14em] text-white/45 hover:text-white transition-colors duration-300 uppercase cursor-pointer"
          >
            <span className="font-artistic tracking-[0.12em]">[ Continue Walking ]</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-300" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
