import React from 'react';
import { StoryBanner } from './StoryBanner';
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

  const currentInfo = {
    subtitle: copy[language].choose,
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && cards.length > 0 && <motion.div
        key={`stage-selection-${stage}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 pointer-events-none text-center px-4"
      >
        <StoryBanner>
          <p className="text-xs sm:text-sm font-artistic text-white/90 tracking-[0.04em] text-glow-sm">
            {currentInfo.subtitle}
          </p>


        </StoryBanner>
      </motion.div>}
    </AnimatePresence>
  );
};
