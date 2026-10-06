import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardInfo } from '../types';
import { TarotArtwork as TarotSymbol } from './TarotArtwork';

interface NarrationOverlayProps {
  narration: string | null;
  drawnTarot?: TarotCardInfo | null;
  onDismiss: () => void;
}

export const NarrationOverlay: React.FC<NarrationOverlayProps> = ({
  narration,
  drawnTarot,
  onDismiss,
}) => {
  // Allow dismissing with Spacebar or Enter
  useEffect(() => {
    if (!narration) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [narration, onDismiss]);

  if (!narration) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 md:top-24 lg:top-28 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-30 pointer-events-auto text-center"
      >
        <div className="relative py-4 px-6 rounded-[3px] bg-[#0c0c12]/95 border border-white/20 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.9)] select-none">
          {/* Subtle Starlight Corner Ornaments */}
          <span className="absolute top-2 left-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
          <span className="absolute top-2 right-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
          <span className="absolute bottom-2 left-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
          <span className="absolute bottom-2 right-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>

          {/* Drawn Tarot Arcana Badge */}
          {drawnTarot && (
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="w-10 h-10 text-white/80 mb-1.5 flex items-center justify-center">
                <TarotSymbol symbol={drawnTarot.symbol} />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-['Cinzel',serif] tracking-[0.2em] text-white/80 uppercase">
                <span className="text-white/40">{drawnTarot.numeral}</span>
                <span>·</span>
                <span>{drawnTarot.nameEn}</span>
                <span className="font-artistic tracking-normal text-white/60">({drawnTarot.nameZh})</span>
              </div>
              <div className="text-[10px] font-artistic tracking-[0.08em] text-white/40 mt-0.5">
                {drawnTarot.keywordUpright}
              </div>
            </div>
          )}

          {/* Short Poetic Revelation */}
          <p className="font-artistic text-white/90 text-sm sm:text-base md:text-[17px] tracking-normal leading-[1.8] my-3 text-glow-sm max-w-lg mx-auto">
            {narration}
          </p>

          {/* Dismiss button */}
          <div className="pt-2">
            <button
              id="continue-walking-btn"
              onClick={onDismiss}
              className="group relative inline-flex items-center gap-2 py-1.5 px-4 font-garamond text-xs tracking-[0.16em] text-white/50 hover:text-white transition-colors duration-300 uppercase cursor-pointer border border-white/10 hover:border-white/30 bg-white/5 rounded-sm"
            >
              <span className="font-artistic tracking-[0.14em]">[ Continue Wandering · 继续漫行 ]</span>
            </button>
            <div className="text-[9px] text-white/30 font-garamond tracking-widest mt-1.5 uppercase">
              (or press Space / Enter)
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
