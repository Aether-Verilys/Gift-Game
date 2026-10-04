import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Language, copy, stageCopy } from '../i18n';

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
    title: stageCopy(language, stage),
    subtitle: language === 'zh'
      ? (stage === 1 ? '三张牌已准备就绪。选择一张牌，决定旅途从何而起。' : stage === 2 ? '选择一张牌，决定旅途如何展开，并与何种造物相遇。' : '选择终章塔罗牌，决定宿命的归途与结局。')
      : (stage === 1 ? copy.en.choose : stage === 2 ? 'Choose a card to shape the journey and the entity you will meet.' : 'Choose the final card to reveal where destiny leads.')
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`stage-selection-${stage}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-20 pointer-events-none text-center px-4"
      >
        <div className="py-2.5 px-6 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.85)] inline-block">
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] tracking-[0.2em] text-white/50 font-garamond uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
            <span>{currentInfo.title}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/70">{language === 'zh' ? '选择塔罗牌' : 'CHOOSE A TAROT CARD'}</span>
          </div>

          <p className="text-xs sm:text-sm font-artistic text-white/90 tracking-[0.04em] text-glow-sm">
            {currentInfo.subtitle}
          </p>


          <div className="mt-1 text-[10px] text-white/40 font-garamond tracking-widest uppercase">
            [ ✦ {copy[language].cardHint} ✦ ]
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
