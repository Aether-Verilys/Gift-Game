import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Gift, Shield, ArrowRight, Move, Clock, Sparkles } from 'lucide-react';
import { Language, copy, interpolate, stageCopy, tarotEncounterName, tarotGiftReaction } from '../i18n';

interface EncounterSceneHUDProps {
  card: TarotCardDef;
  stage: number;
  offeredGift: boolean | null;
  decisionTimeLeft?: number;
  autoAdvanceTimeLeft?: number;
  onDecision: (offeredGift: boolean) => void;
  onContinue: () => void;
  isVisible: boolean;
  language: Language;
}

export const EncounterSceneHUD: React.FC<EncounterSceneHUDProps> = ({
  card,
  stage,
  offeredGift,
  decisionTimeLeft = 10,
  autoAdvanceTimeLeft = 3.5,
  onDecision,
  onContinue,
  isVisible,
  language,
}) => {
  if (!isVisible) return null;

  const stageNames: Record<number, string> = {
    1: stageCopy(language, 1), 2: stageCopy(language, 2), 3: stageCopy(language, 3),
  };

  const reactionText = tarotGiftReaction(
    language,
    card.id,
    offeredGift === true,
    offeredGift === true ? card.encounter.giftReactionOffered : card.encounter.giftReactionKept,
  );
  const drawnOrientation = card.drawnOrientation ?? 'upright';
  const currentOrientation = offeredGift === true
    ? (drawnOrientation === 'upright' ? 'reversed' : 'upright')
    : drawnOrientation;

  const displayDecisionSeconds = Math.max(0, Math.ceil(decisionTimeLeft));
  const displayAdvanceSeconds = Math.max(0, Math.ceil(autoAdvanceTimeLeft));

  return (
    <AnimatePresence>
      <div className="absolute inset-x-0 top-24 sm:top-28 z-40 pointer-events-none flex flex-col items-center px-4">
        {/* State A: Before Decision - Minimalist Floating In-Scene Drag Guide with Countdown */}
        {offeredGift === null && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="pointer-events-auto max-w-3xl w-full"
          >
            <div className="bg-[#070710]/88 border border-white/20 rounded-full px-5 py-3 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              {/* Left Encounter Info */}
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3355] animate-ping" />
                <div>
                  <div className="text-[10px] font-garamond uppercase tracking-[0.16em] text-white/50">
                    {stageNames[stage]} · {copy[language].encounter}
                  </div>
                  <div className="text-xs sm:text-sm font-artistic text-white tracking-[0.04em] font-medium text-glow-sm">
                    {tarotEncounterName(language, card.id, card.encounter.name)}
                  </div>
                </div>
              </div>

              {/* Center Drag Prompt & Decision Countdown Timer */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-artistic text-white/85 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Move className="w-3.5 h-3.5 text-[#ff4d6d] animate-pulse flex-shrink-0" />
                  <span className="truncate">
                    {copy[language].drag}
                  </span>
                </div>

                {/* Countdown Indicator */}
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-garamond border transition-colors ${
                    displayDecisionSeconds <= 3
                      ? 'border-red-500/60 bg-red-950/40 text-red-300 animate-pulse'
                      : 'border-white/15 bg-white/5 text-white/70'
                  }`}
                  title={copy[language].keepGift}
                >
                  <Clock className="w-3 h-3" />
                  <span>{displayDecisionSeconds}s</span>
                  <span className="text-[9px] text-white/40 font-artistic hidden md:inline">{copy[language].defaultKeep}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onDecision(true)}
                  className="py-1.5 px-3 rounded-full bg-red-950/50 hover:bg-red-900/80 border border-red-500/40 hover:border-red-400 text-[11px] font-artistic text-red-200 transition-all cursor-pointer flex items-center gap-1.5"
                  title={copy[language].offerGift}
                >
                  <Gift className="w-3 h-3 text-red-400" />
                  <span>{copy[language].give}</span>
                </button>

                <button
                  onClick={() => onDecision(false)}
                  className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-[11px] font-artistic text-white/80 transition-all cursor-pointer flex items-center gap-1.5"
                  title={copy[language].keepGift}
                >
                  <Shield className="w-3 h-3 text-white/50" />
                  <span>{copy[language].keep}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* State B: After Decision - Poetic Resolution Banner with Auto-Advance Progress */}
        {offeredGift !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-auto max-w-xl w-full"
          >
            <div className="bg-[#090912]/92 border border-white/20 rounded-[4px] p-4 sm:p-5 backdrop-blur-md shadow-[0_16px_50px_rgba(0,0,0,0.9)] text-left relative overflow-hidden">
              {/* Subtle top auto-advance progress bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500/80 to-amber-300/80"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: autoAdvanceTimeLeft, ease: 'linear' }}
                />
              </div>

              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-[10px] font-garamond uppercase tracking-[0.16em] text-white/50">
                  <span>{stageNames[stage]}</span>
                  <span>·</span>
                <span className="text-white/80">{copy[language].entityResponds}</span>
                </div>

                <div
                  className={`text-[10px] font-artistic px-2.5 py-0.5 rounded-full ${
                      currentOrientation === 'reversed'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-white/10 text-white/70 border border-white/20'
                  }`}
                >
                  {currentOrientation === 'reversed' ? copy[language].reversed : copy[language].upright}
                </div>
              </div>

              <p className="text-xs sm:text-sm font-artistic text-white/85 leading-relaxed my-2.5">
                {reactionText}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-artistic text-white/40 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-white/30" />
                  <span>{stage === 3 ? copy[language].preparingReading : interpolate(copy[language].autoAdvance, { s: displayAdvanceSeconds })}</span>
                </span>

                {stage < 3 && (
                  <button
                    onClick={onContinue}
                    className="py-1.5 px-4 rounded-[2px] bg-white/10 hover:bg-white/25 border border-white/25 hover:border-white/50 text-xs font-artistic text-white transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    <span>
                      {stage === 1 ? copy[language].enterPassage : copy[language].enterResult}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
