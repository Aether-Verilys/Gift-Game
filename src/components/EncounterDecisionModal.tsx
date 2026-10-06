import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { TarotArtwork as TarotSymbol } from './TarotArtwork';
import { audioService } from '../services/audioService';
import { Gift, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { copy, tarotGiftReaction } from '../i18n';

interface EncounterDecisionModalProps {
  card: TarotCardDef;
  stage: number;
  onDecision: (offeredGift: boolean) => void;
  onContinue: () => void;
  isOpen: boolean;
  language?: 'zh' | 'en';
}

export const EncounterDecisionModal: React.FC<EncounterDecisionModalProps> = ({
  card,
  stage,
  onDecision,
  onContinue,
  isOpen,
  language = 'en',
}) => {
  const [decisionMade, setDecisionMade] = useState<boolean | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleChoose = (offered: boolean) => {
    if (decisionMade !== null) return;
    setIsFlipping(true);
    setDecisionMade(offered);

    if (offered) {
      audioService.playCrimsonResonance();
      setTimeout(() => {
        audioService.playTarotFlip();
      }, 300);
    } else {
      audioService.playStarlightChime();
      setTimeout(() => {
        audioService.playChoiceConfirm();
      }, 250);
    }

    setTimeout(() => {
      setIsFlipping(false);
      onDecision(offered);
    }, 600);
  };

  const handleNext = () => {
    setDecisionMade(null);
    onContinue();
  };

  const orientation = decisionMade === true ? 'reversed' : 'upright';
  const reactionText = tarotGiftReaction(
    language,
    card.id,
    decisionMade === true,
    decisionMade === true ? card.encounter.giftReactionOffered : card.encounter.giftReactionKept,
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl bg-[#0a0a0f]/95 border border-white/20 rounded-[4px] shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 sm:p-7 overflow-hidden"
      >
        {/* Subtle corner crosses */}
        <span className="absolute top-2.5 left-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute top-2.5 right-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute bottom-2.5 left-2.5 text-[8px] text-white/30 font-serif">✦</span>
        <span className="absolute bottom-2.5 right-2.5 text-[8px] text-white/30 font-serif">✦</span>

        {/* Stage & Encounter Header */}
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] tracking-[0.2em] text-white/40 font-garamond uppercase mb-1">
            <span>STAGE {stage} · ENCOUNTER</span>
            <span className="text-white/20">·</span>
            <span>DESTINY</span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-artistic text-white tracking-[0.08em] text-glow-sm">
            {stage === 1 ? copy[language].encounterLabel : `${copy[language].encounterLabel} ${stage}`}
          </h2>
          <p className="text-xs sm:text-sm font-artistic text-white/70 mt-2 max-w-xl mx-auto leading-relaxed">
            {stage === 1 ? copy[language].encounterFirstHint : copy[language].encounterNextHint}
          </p>
        </div>

        {/* Center: Tarot Card Visualization & Flip State */}
        <div className="flex items-center justify-center my-4">
          <motion.div
            animate={{
              rotate: decisionMade === true ? 180 : 0,
              filter: isFlipping
                ? 'drop-shadow(0 0 30px rgba(255, 77, 109, 0.8))'
                : decisionMade === true
                ? 'drop-shadow(0 0 25px rgba(255, 77, 109, 0.45))'
                : 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))',
            }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className={`relative w-36 sm:w-40 h-[210px] sm:h-[235px] bg-[#0c0c14] border ${
              decisionMade === true ? 'border-[#ff4d6d]/60' : 'border-white/25'
            } rounded-[3px] p-3 flex flex-col justify-between transition-colors duration-500`}
          >
            {/* Inner frame */}
            <div className="absolute inset-1 border border-white/10 pointer-events-none" />

            {/* Top info */}
            <div className="text-center pt-0.5 z-10">
              <span className="text-[8px] tracking-[0.2em] text-white/40 uppercase font-garamond">
                Major Arcana
              </span>
              <div className="font-['Cinzel',serif] text-xs font-semibold text-white/90">
                {card.numeral}
              </div>
            </div>

            {/* Center Symbol */}
            <div className="w-16 h-16 mx-auto text-white/80 my-auto flex items-center justify-center z-10">
              <TarotSymbol symbol={card.symbol} />
            </div>

            {/* Bottom info */}
            <div className="text-center pb-0.5 z-10">
              <div className="font-['Cinzel',serif] text-[11px] font-semibold text-white tracking-wider">
                {card.nameEn} · {card.nameZh}
              </div>
              <div className="text-[9px] font-artistic text-white/60 mt-0.5">
                {decisionMade === true ? card.keywordReversed : card.keywordUpright}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Polarity Badge */}
        <div className="text-center mb-5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-artistic tracking-widest uppercase transition-all ${
              decisionMade === true
                ? 'bg-red-950/40 border border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(255,77,109,0.3)]'
                : decisionMade === false
                ? 'bg-white/10 border border-white/30 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                : 'bg-white/5 border border-white/15 text-white/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                decisionMade === true ? 'bg-red-400 animate-pulse' : 'bg-white/80'
              }`}
            />
            {decisionMade === null
              ? copy[language].presetUpright
              : decisionMade === true
              ? copy[language].activatedReversed
              : copy[language].heldUpright}
          </span>
        </div>

        {/* Phase A: Decision Buttons (Before Choice) */}
        {decisionMade === null && (
          <div className="space-y-3 max-w-lg mx-auto">
            <button
              onClick={() => handleChoose(true)}
              className="group w-full py-3 px-4 rounded-[3px] bg-gradient-to-r from-red-950/40 via-red-900/30 to-red-950/40 hover:from-red-900/60 hover:to-red-900/60 border border-red-500/40 hover:border-red-400 text-left transition-all duration-300 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-300">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-artistic text-white group-hover:text-red-100 font-medium">
                    献出礼物（翻转为逆位）
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-artistic text-red-200/60">
                    {copy[language].offerGiftDescription}
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-red-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => handleChoose(false)}
              className="group w-full py-3 px-4 rounded-[3px] bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/35 text-left transition-all duration-300 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-artistic text-white font-medium">
                    保留礼物，不给（保持顺位）
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-artistic text-white/50">
                    {copy[language].keepGiftDescription}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-white/40 group-hover:text-white/80">
                [ KEEP ]
              </span>
            </button>
          </div>
        )}

        {/* Phase B: Reaction & Proceed (After Choice) */}
        {decisionMade !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center pt-2"
          >
            <p className="text-xs sm:text-sm font-artistic text-white/85 leading-relaxed max-w-lg mx-auto mb-5 italic bg-white/5 p-3.5 rounded border border-white/10">
              "{reactionText}"
            </p>

            <button
              onClick={handleNext}
              className="group relative inline-flex items-center gap-2 py-2 px-6 rounded-[3px] bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/60 text-xs sm:text-sm font-artistic tracking-[0.14em] text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <span>{stage === 3 ? copy[language].revealReading : copy[language].revealNextStage.replace('{stage}', String(stage + 1))}</span>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
