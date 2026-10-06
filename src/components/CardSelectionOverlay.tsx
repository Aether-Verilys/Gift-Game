import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Language, copy } from '../i18n';

interface CardSelectionOverlayProps {
  stage: number; // 1, 2, or 3
  cards: TarotCardDef[];
  onSelectCard: (card: TarotCardDef) => void;
  isVisible: boolean;
  language: Language;
}

export const CardSelectionOverlay: React.FC<CardSelectionOverlayProps> = ({
  stage,
  cards,
  isVisible,
  language,
}) => {
  if (!isVisible || cards.length === 0) return null;

  const currentInfo = {
    subtitle: copy[language].choose,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`stage-selection-${stage}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 pointer-events-none text-center px-4"
      >
        <div className="py-2.5 px-6 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.85)] inline-block">
          <p className="text-xs sm:text-sm font-artistic text-white/90 tracking-[0.04em] text-glow-sm">
            {currentInfo.subtitle}
          </p>


        </div>
      </motion.div>
    </AnimatePresence>
  );
};
