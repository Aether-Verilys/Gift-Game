import React from 'react';
import { motion } from 'motion/react';
import { StageRecord, LLMInterpretation } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';
import { RotateCcw, BookOpen, Sparkles, Feather, Layers } from 'lucide-react';
import { Language } from '../i18n';

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
              {language === 'zh' ? '星海正汇聚旅者的三次抉择与赠礼...' : 'The stars are gathering your three choices and gifts...'}
            </h3>
            <p className="text-xs font-artistic text-white/40 tracking-wider">
              {language === 'zh' ? '倾听属于旅者的内在回响' : 'Listening for the echo within'}
            </p>
          </div>
        )}

        {/* Completed Reading */}
        {!isLoading && interpretation && (
          <div>
            {isFallback && (
              <div className="mb-5 rounded border border-amber-300/30 bg-amber-300/[0.06] p-4 text-left">
                <div className="text-xs font-artistic text-amber-200 mb-2">{language === 'zh' ? '当前显示备用解读' : 'Showing a local fallback reading'}</div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  {language === 'zh' ? <>AI 解读接口暂时不可用，以下内容由本地规则生成。要启用完整解读，请配置 <code className="text-amber-100">GEMINI_API_KEY</code>。</> : <>The AI reading service is unavailable, so this reading was generated locally. Configure <code className="text-amber-100">GEMINI_API_KEY</code> to enable the full reading.</>}
                </p>
              </div>
            )}
            {/* Header */}
            <div className="text-center pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] tracking-[0.25em] text-white/40 font-garamond uppercase mb-1">
                <Feather className="w-3.5 h-3.5 text-white/40" />
                <span>SELF-REFLECTION · {language === 'zh' ? '事件与自我认知' : 'EVENT & SELF-AWARENESS'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-artistic font-normal text-white tracking-[0.08em] text-glow-md">
                {interpretation.metaphorTitle}
              </h2>
              <div className="text-[11px] text-white/40 font-artistic mt-1">
                {language === 'zh' ? '这是对当前处境的观察，不是人格诊断或命运结论' : 'An observation of your current situation, not a diagnosis or fate'}
              </div>
            </div>

            {/* Three Cards Spread Strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 py-3 mb-6 bg-white/[0.03] border border-white/10 rounded-[3px] p-3">
              {history.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="text-[10px] font-artistic text-white/50 mb-1 tracking-wider">
                    {language === 'zh' ? (step.stage === 1 ? '起因' : step.stage === 2 ? '经过' : '结果') : (step.stage === 1 ? 'ORIGIN' : step.stage === 2 ? 'PASSAGE' : 'OUTCOME')}
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
                      {language === 'zh' ? (step.orientation === 'reversed' ? '逆位' : '顺位') : (step.orientation === 'reversed' ? 'REVERSED' : 'UPRIGHT')}
                    </div>
                  </div>

                  <div className="text-[11px] font-artistic text-white font-medium">
                    {step.card.nameZh}
                  </div>
                  <div className="text-[9px] font-artistic text-white/40">
                    {language === 'zh' ? (step.offeredGift ? '献出红礼' : '保留红礼') : (step.offeredGift ? 'GIFT GIVEN' : 'GIFT KEPT')}
                  </div>
                </div>
              ))}
            </div>

            {/* Core Metaphor Prose */}
            <div className="py-4 my-2 max-w-xl mx-auto">
              <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-2 text-center">
                // SITUATION · {language === 'zh' ? '这件事正在发生什么' : 'WHAT IS HAPPENING'}
              </div>
              <p className="text-sm sm:text-base font-artistic text-white/90 leading-[2] tracking-normal text-justify text-glow-sm bg-white/[0.02] p-4 sm:p-5 rounded border border-white/10">
                {interpretation.situationReading}
              </p>
            </div>

            {/* Journey Reflection */}
            <div className="py-3 my-2 max-w-xl mx-auto">
              <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-1.5">
                // PSYCHOLOGICAL PATTERN · {language === 'zh' ? '旅者的心理机制' : 'THE TRAVELER’S PATTERN'}
              </div>
              <p className="text-xs sm:text-sm font-artistic text-white/65 leading-relaxed">
                {interpretation.psychologicalInsight}
              </p>
            </div>

            <div className="max-w-xl mx-auto my-4">
              <div className="p-4 rounded border border-white/10 bg-white/[0.02]">
                <div className="text-[10px] tracking-[0.2em] uppercase font-garamond text-white/35 mb-2">SELF-AWARENESS · {language === 'zh' ? '旅者可以看见的自己' : 'WHAT THE TRAVELER CAN SEE'}</div>
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
                <span>{language === 'zh' ? '开启新的旅途' : 'Begin a new journey'}</span>
              </button>

              <button
                onClick={onOpenChronicle}
                className="group relative inline-flex items-center gap-2 py-2 px-5 rounded-[3px] bg-transparent hover:bg-white/5 border border-white/15 hover:border-white/30 text-xs sm:text-sm font-artistic tracking-[0.1em] text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                <span>{language === 'zh' ? '查看旅途手记' : 'View chronicle'}</span>
              </button>
              <button
                onClick={onOpenCollection}
                className="group relative inline-flex items-center gap-2 py-2 px-5 rounded-[3px] bg-transparent hover:bg-white/5 border border-white/15 hover:border-white/30 text-xs sm:text-sm font-artistic tracking-[0.1em] text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
                <span>{language === 'zh' ? '查看已解锁塔罗牌' : 'View unlocked tarot'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
