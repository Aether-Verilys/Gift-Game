import React from 'react';
import { StoryBanner } from './StoryBanner';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Language, copy, stageCopy } from '../i18n';

interface ApproachingOverlayProps {
  card: TarotCardDef | null;
  stage: number;
  isVisible: boolean;
  language: Language;
}

export const ApproachingOverlay: React.FC<ApproachingOverlayProps> = ({
  card,
  stage,
  isVisible,
  language,
}) => {

  return (
    <AnimatePresence>
      {isVisible && card && <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 1 }}
        className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center"
      >
        <StoryBanner className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff3355] animate-pulse" />
            <span className="text-xs font-garamond tracking-[0.14em] uppercase text-white/50">
              {stageCopy(language, stage)} · {copy[language].walk}
            </span>
          </div>

          <div className="text-xs sm:text-sm font-artistic tracking-[0.06em] text-white flex items-center gap-1.5">
            <span>{copy[language].approaching}</span>
            <span className="text-white text-glow-sm font-medium">{copy[language].almostThere}</span>
          </div>


        </StoryBanner>
      </motion.div>}
    </AnimatePresence>
  );
};
