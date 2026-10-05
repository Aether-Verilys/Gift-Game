import React from 'react';
import { motion } from 'motion/react';
import { StageRecord, LLMInterpretation } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';
import { RotateCcw, BookOpen, Sparkles, Feather, Layers } from 'lucide-react';
import { Language, copy, stageLabel, tarotName } from '../i18n';

interface FinalReadingModalProps {
  history: StageRecord[];
  interpretation: LLMInterpretation | null;
  isLoading: boolean;
  onRestart: () => void;
  onOpenChronicle: () => void;
  onOpenCollection: () => void;
  isOpen: boolean;
  isFallback?: boolean;
  language: Language;
}

export const FinalReadingModal: React.FC<FinalReadingModalProps> = ({
  history,
  interpretation,
  isLoading,
  onRestart,
  onOpenChronicle,
  onOpenCollection,
  isOpen,
  isFallback = false,
  language,
}) => {
  if (!isOpen) return null;
  const t = copy[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-lg select-none pointer-events-auto overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-[#08080d]/95 border border-white/20 rounded-[4px] shadow-[0_24px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8 my-auto"
      >
        {/* Subtle corner crosses */}
        <span className="absolute top-2.5 left-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute top-2.5 right-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute bottom-2.5 left-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute bottom-2.5 right-2.5 text-[8px] text-white/30 font-serif">✦</span>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border border-white/20 border-t-white animate-spin" />
              <div className="absolute inset-2 rounded-full border border-red-500/30 border-b-red-400 animate-spin [animation-duration:2.5s]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white/80 animate-pulse" />
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-artistic tracking-[0.14em] text-white/90 mb-2">
              {t.generatingReading}
            </h3>
            <p className="text-xs font-artistic text-white/40 tracking-wider">
              {t.pleaseWait}
            </p>
          </div>
        )}

        {/* Completed Reading */}
        {!isLoading && interpretation && (
          <div>
            {isFallback && (
              <div className="mb-5 rounded border border-amber-300/30 bg-amber-300/[0.06] p-4 text-left">
                <div className="text-xs font-artistic text-amber-200 mb-2">{t.fallbackTitle}</div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  {t.fallbackBody}
                </p>
              </div>
            )}
            {/* Header */}
            <div className="text-center pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] tracking-[0.25em] text-white/40 font-garamond uppercase mb-1">
                <Feather className="w-3.5 h-3.5 text-white/40" />
                <span>{t.reflectionLabel}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-artistic font-normal text-white tracking-[0.08em] text-glow-md">
                {interpretation.metaphorTitle}
              </h2>
            </div>

            {/* Three Cards Spread Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 mb-6 bg-white/[0.03] border border-white/10 rounded-[3px] p-3">
              {history.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="text-[10px] font-artistic text-white/50 mb-1 tracking-wider">
                    {stageLabel(language, step.stage)}
                  </div>
                  <div
                    className={`relative w-12 h-16 sm:w-14 sm:h-20 rounded bg-[#0d0d16] border ${
                      step.orientation === 'reversed' ? 'border-red-400/60' : 'border-white/20'
                    } flex flex-col justify-between p-1.5 mb-1.5 shadow-sm`}
                  >
                    <div className="font-['Cinzel',serif] text-[9px] text-white/60">
                      {step.card.numeral}
                    </div>
                    <div
                      className={`w-6 h-6 mx-auto text-white/80 ${
                        step.orientation === 'reversed' ? 'rotate-180' : ''
                      }`}
                    >
                      <TarotSymbol symbol={step.card.symbol} />
                    </div>
                    <div className="text-[8px] font-artistic text-white/50">
                      {step.orientation === 'reversed' ? t.reversed : t.upright}
                    </div>
                  </div>

                  <div className="text-[11px] font-artistic text-white font-medium">
                    {tarotName(language, step.card.id, language === 'zh' ? step.card.nameZh : step.card.nameEn)}
                  </div>
                  <div className="text-[9px] font-artistic text-white/40">
                    {step.offeredGift ? t.giftGiven : t.giftKept}
                  </div>
                </div>
              ))}
            </div>

            {/* Core Metaphor Prose */}
            <div className="py-4 my-2 max-w-xl mx-auto">
              <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-2 text-center">
                // {t.situationLabel}
              </div>
              <p className="text-sm sm:text-base font-artistic text-white/90 leading-[2] tracking-normal text-justify text-glow-sm bg-white/[0.02] p-4 sm:p-5 rounded border border-white/10">
                {interpretation.situationReading}
              </p>
            </div>

            {/* Journey Reflection */}
            <div className="py-3 my-2 max-w-xl mx-auto">
              <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-1.5">
                // {t.patternLabel}
              </div>
              <p className="text-xs sm:text-sm font-artistic text-white/65 leading-relaxed">
                {interpretation.psychologicalInsight}
              </p>
            </div>

            <div className="max-w-xl mx-auto my-4">
              <div className="p-4 rounded border border-white/10 bg-white/[0.02]">
                <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-2">{t.awarenessLabel}</div>
                <p className="text-xs sm:text-sm font-artistic text-white/75 leading-relaxed">{interpretation.selfAwareness}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={onRestart}
                className="group relative inline-flex items-center gap-2 py-2 px-5 rounded-[3px] bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/60 text-xs sm:text-sm font-artistic tracking-[0.1em] text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
                <span>{t.newJourney}</span>
              </button>

              <button
                onClick={onOpenChronicle}
                className="group relative inline-flex items-center gap-2 py-2 px-5 rounded-[3px] bg-transparent hover:bg-white/5 border border-white/15 hover:border-white/30 text-xs sm:text-sm font-artistic tracking-[0.1em] text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                <span>{t.chronicle}</span>
              </button>
              <button
                onClick={onOpenCollection}
                className="group relative inline-flex items-center gap-2 py-2 px-5 rounded-[3px] bg-transparent hover:bg-white/5 border border-white/15 hover:border-white/30 text-xs sm:text-sm font-artistic tracking-[0.1em] text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                <span>{t.viewCollection}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
