import React from 'react';
import { motion } from 'motion/react';
import { StageRecord, TarotCardDef } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';
import { Gift, Shield, Sparkles } from 'lucide-react';
import { Language, copy, stageLabel, tarotName } from '../i18n';

interface StageProgressHeaderProps {
  currentStage: number; // 1, 2, or 3
  history: StageRecord[];
  selectedCard?: TarotCardDef | null;
  giftOffered?: boolean | null;
  language?: Language;
}

export const StageProgressHeader: React.FC<StageProgressHeaderProps> = ({
  currentStage,
  history,
  selectedCard = null,
  giftOffered = null,
  language = 'zh',
}) => {
  const t = copy[language];
  const stageLabels: Record<number, string> = {
    1: stageLabel(language, 1),
    2: stageLabel(language, 2),
    3: stageLabel(language, 3),
  };

  return (
    <div className="flex flex-col select-none">
      {/* Subtle Title Badge */}
      <div className="flex items-center gap-2 mb-2 text-[10px] tracking-[0.2em] font-garamond uppercase text-white/45">
        <Sparkles className="w-3 h-3 text-white/50" />
        <span>{t.destinyArc}</span>
      </div>

      {/* 3-Stage Card Tray */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {[1, 2, 3].map((s) => {
          const recorded = history.find((h) => h.stage === s);
          const isCurrent = currentStage === s;
          const isPending = !recorded && !isCurrent;

          if (recorded || (isCurrent && selectedCard)) {
            const displayCard = recorded?.card ?? selectedCard!;
            const drawnOrientation = displayCard.drawnOrientation ?? 'upright';
            const displayOrientation = recorded?.orientation ?? (
              giftOffered === true
                ? (drawnOrientation === 'upright' ? 'reversed' : 'upright')
                : drawnOrientation
            );
            const displayOffered = recorded?.offeredGift ?? giftOffered === true;
            const isReversed = displayOrientation === 'reversed';
            const isBeingInserted = !recorded && isCurrent;

            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`relative w-14 h-22 sm:w-16 sm:h-24 rounded-[3px] p-1.5 flex flex-col justify-between backdrop-blur-md transition-all ${isBeingInserted ? 'card-slot-inset' : ''} ${
                  isReversed
                    ? 'bg-[#12080d]/85 border border-[#ff4d6d]/60 shadow-[0_4px_16px_rgba(255,77,109,0.25)]'
                    : 'bg-[#0a0a14]/85 border border-[#c8b273]/60 shadow-[0_4px_16px_rgba(200,178,115,0.18)]'
                }`}
                title={`${stageLabels[s]} · ${tarotName(language, displayCard.id, language === 'zh' ? displayCard.nameZh : displayCard.nameEn)} (${isReversed ? copy[language].reversed : copy[language].upright})`}
              >
                {/* Top: Stage + Numeral */}
                <div className="flex items-center justify-between text-[8px] font-['Cinzel',serif] leading-none text-white/70">
                  <span className="font-artistic text-[8px] text-white/50">{stageLabels[s]}</span>
                  <span className="text-[9px] font-medium">{displayCard.numeral}</span>
                </div>

                {/* Center: Tarot Symbol (Inverted 180° if reversed) */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto flex items-center justify-center transition-transform duration-500 ${
                    isReversed ? 'text-red-300' : 'text-amber-100'
                  }`}
                >
                  <TarotSymbol symbol={displayCard.symbol} />
                </div>

                {/* Bottom: Card Name & Polarity */}
                <div className="text-center">
                  <div className="text-[9px] font-artistic text-white font-medium truncate leading-tight">
                    {tarotName(language, displayCard.id, language === 'zh' ? displayCard.nameZh : displayCard.nameEn)}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[7px] font-artistic mt-0.5">
                    <span className={isReversed ? 'text-red-400 font-medium' : 'text-[#e5cf8e]'}>
                      {isReversed ? copy[language].reversed : copy[language].upright}
                    </span>
                    {displayOffered ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff3355] shadow-[0_0_4px_#ff3355]" title={t.offerGift} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" title={t.keepGift} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          if (isCurrent) {
            return (
              <div
                key={s}
                className="w-14 h-22 sm:w-16 sm:h-24 rounded-[3px] p-1.5 flex flex-col justify-between bg-white/[0.04] border border-white/30 border-dashed backdrop-blur-sm animate-pulse"
              >
                <div className="text-[8px] font-artistic text-white/60">
                  {stageLabels[s]}
                </div>
                <div className="text-center text-[10px] text-white/40 font-artistic">
                  ✦
                </div>
                <div className="text-center text-[8px] font-artistic text-white/70">
                  {t.inProgress}
                </div>
              </div>
            );
          }

          return (
            <div
              key={s}
              className="w-14 h-22 sm:w-16 sm:h-24 rounded-[3px] p-1.5 flex flex-col justify-between bg-white/[0.02] border border-white/10 border-dotted"
            >
              <div className="text-[8px] font-artistic text-white/25">
                {stageLabels[s]}
              </div>
              <div className="text-center text-[8px] text-white/20 font-serif">
                ·
              </div>
              <div className="text-center text-[8px] font-artistic text-white/25">
                {t.awaitingDraw}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
