import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Compass, Sparkles } from 'lucide-react';
import { Language, copy, stageCopy } from '../i18n';

interface ApproachingOverlayProps {
  card: TarotCardDef | null;
  stage: number;
  onArrive: () => void;
  isVisible: boolean;
  language: Language;
}

export const ApproachingOverlay: React.FC<ApproachingOverlayProps> = ({
  card,
  stage,
  onArrive,
  isVisible,
  language,
}) => {
  if (!isVisible || !card) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.5 }}
        className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto text-center"
      >
        <div className="py-2.5 px-6 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff3355] animate-pulse" />
            <span className="text-xs font-garamond tracking-[0.14em] uppercase text-white/50">
              {stageCopy(language, stage)} · {copy[language].walk}
            </span>
          </div>

          <div className="text-xs sm:text-sm font-artistic tracking-[0.06em] text-white flex items-center gap-1.5">
            <span>{copy[language].approaching}</span>
            <span className="text-white text-glow-sm font-medium">{language === 'zh' ? '即将抵达' : 'Almost there'}</span>
          </div>

          <button
            onClick={onArrive}
            className="group relative ml-2 px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-artistic tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="按下空格或点击立即抵达"
          >
            <Sparkles className="w-3 h-3 text-white/70 group-hover:text-white" />
            <span>{copy[language].arrive}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
