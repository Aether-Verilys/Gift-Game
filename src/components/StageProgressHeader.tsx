import React from 'react';
import { motion } from 'motion/react';
import { StageRecord } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';
import { Gift, Shield, Sparkles } from 'lucide-react';
import { Language, copy, stageCopy } from '../i18n';

interface StageProgressHeaderProps {
  currentStage: number; // 1, 2, or 3
  history: StageRecord[];
  language?: Language;
}

export const StageProgressHeader: React.FC<StageProgressHeaderProps> = ({
  currentStage,
  history,
  language = 'zh',
}) => {
  const stageLabels: Record<number, string> = {
    1: language === 'zh' ? '起因' : 'ORIGIN',
    2: language === 'zh' ? '经过' : 'PASSAGE',
    3: language === 'zh' ? '结果' : 'OUTCOME',
  };

  return (
    <div className="flex flex-col select-none">
      {/* Subtle Title Badge */}
      <div className="flex items-center gap-2 mb-2 text-[10px] tracking-[0.2em] font-garamond uppercase text-white/45">
        <Sparkles className="w-3 h-3 text-white/50" />
        <span>{language === 'zh' ? 'DESTINY ARC · 宿命轨迹' : 'DESTINY ARC · THE JOURNEY'}</span>
      </div>

      {/* 3-Stage Card Tray */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {[1, 2, 3].map((s) => {
          const recorded = history.find((h) => h.stage === s);
          const isCurrent = currentStage === s;
          const isPending = !recorded && !isCurrent;

          if (recorded) {
            const isReversed = recorded.orientation === 'reversed';

            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`relative w-14 h-22 sm:w-16 sm:h-24 rounded-[3px] p-1.5 flex flex-col justify-between backdrop-blur-md transition-all ${
                  isReversed
                    ? 'bg-[#12080d]/85 border border-[#ff4d6d]/60 shadow-[0_4px_16px_rgba(255,77,109,0.25)]'
                    : 'bg-[#0a0a14]/85 border border-[#c8b273]/60 shadow-[0_4px_16px_rgba(200,178,115,0.18)]'
                }`}
                title={`${stageLabels[s]}之章 · ${recorded.card.nameZh} (${isReversed ? '逆位' : '正位'}) - ${
                  recorded.offeredGift ? '已交付红色礼物' : '留存礼物'
                }`}
              >
                {/* Top: Stage + Numeral */}
                <div className="flex items-center justify-between text-[8px] font-['Cinzel',serif] leading-none text-white/70">
                  <span className="font-artistic text-[8px] text-white/50">{stageLabels[s]}</span>
                  <span className="text-[9px] font-medium">{recorded.card.numeral}</span>
                </div>

                {/* Center: Tarot Symbol (Inverted 180° if reversed) */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto flex items-center justify-center transition-transform duration-500 ${
                    isReversed ? 'rotate-180 text-red-300' : 'text-amber-100'
                  }`}
                >
                  <TarotSymbol symbol={recorded.card.symbol} />
                </div>

                {/* Bottom: Card Name & Polarity */}
                <div className="text-center">
                  <div className="text-[9px] font-artistic text-white font-medium truncate leading-tight">
                    {recorded.card.nameZh}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[7px] font-artistic mt-0.5">
                    <span className={isReversed ? 'text-red-400 font-medium' : 'text-[#e5cf8e]'}>
                      {isReversed ? '逆位' : '顺位'}
                    </span>
                    {recorded.offeredGift ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff3355] shadow-[0_0_4px_#ff3355]" title="交付红礼" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40" title="保留礼物" />
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
                  {language === 'zh' ? '进行中' : 'IN PROGRESS'}
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
                {language === 'zh' ? '待抽取' : 'AWAITING DRAW'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
