import React from 'react';
import { StoryBanner } from './StoryBanner';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCardDef } from '../types';
import { Language, copy, stageCopy, tarotEncounterName, tarotGiftReaction, tarotKeyword } from '../i18n';

interface EncounterSceneHUDProps {
  card: TarotCardDef;
  stage: number;
  offeredGift: boolean | null;
  decisionTimeLeft?: number;
  autoAdvanceTimeLeft?: number;
  isVisible: boolean;
  language: Language;
  onKeepAndAdvance: () => void;
}

export const EncounterSceneHUD: React.FC<EncounterSceneHUDProps> = ({
  card,
  stage,
  offeredGift,
  decisionTimeLeft = 20,
  autoAdvanceTimeLeft = 7,
  isVisible,
  language,
  onKeepAndAdvance,
}) => {

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
  const currentKeyword = tarotKeyword(
    language,
    card.id,
    currentOrientation,
    currentOrientation === 'reversed' ? card.keywordReversed : card.keywordUpright,
  );
  const orientationLabel = currentOrientation === 'reversed' ? copy[language].reversed : copy[language].upright;
  const tarotSummary = (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-artistic tracking-[0.04em]">
      <span className="text-white font-medium text-glow-sm">
        {tarotEncounterName(language, card.id, card.encounter.name)}
      </span>
      <span className="text-white/35" aria-hidden="true">·</span>
      <span className={currentOrientation === 'reversed' ? 'text-red-300' : 'text-white/80'}>
        {orientationLabel}
      </span>
      <span className="text-white/35" aria-hidden="true">·</span>
      <span className="text-white/75">{currentKeyword}</span>
    </div>
  );


  return (
    <div className="absolute inset-x-0 top-24 sm:top-28 z-40 pointer-events-none flex flex-col items-center px-4">
      <AnimatePresence mode="wait">
        {/* State A: Before Decision - Minimalist Floating In-Scene Drag Guide with Countdown */}
        {isVisible && offeredGift === null && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none max-w-3xl w-full"
          >
            <StoryBanner countdown={{ remaining: decisionTimeLeft, total: 20, label: language === 'zh' ? '选择剩余时间' : 'Time remaining to choose' }} className="flex flex-col items-center justify-center gap-3 text-center">
              {/* Encounter and tarot summary */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-[10px] font-garamond uppercase tracking-[0.16em] text-white/50">
                  <span className="w-2 h-2 rounded-full bg-[#ff3355] animate-ping" />
                  <span>{stageNames[stage]} · {copy[language].encounter}</span>
                </div>
                {tarotSummary}
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] font-artistic tracking-[0.04em]">
                <span className="text-white">
                {copy[language].giftFlipsTarot}
                </span>
                <button
                  type="button"
                  onClick={onKeepAndAdvance}
                  className="pointer-events-auto cursor-pointer px-2.5 py-0.5 rounded border border-white/40 text-white hover:bg-white/15 hover:border-white/70 transition-colors"
                >
                  {copy[language].keepShort}
                </button>
              </div>

            </StoryBanner>
          </motion.div>
        )}

        {/* State B: After Decision - Poetic Resolution Banner with Auto-Advance Progress */}
        {isVisible && offeredGift !== null && (
          <motion.div
            key="reaction"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="pointer-events-none max-w-3xl w-full"
          >
            <StoryBanner countdown={{ remaining: autoAdvanceTimeLeft, total: 7, label: language === 'zh' ? '继续前行剩余时间' : 'Time remaining before continuing' }} className="text-center sm:px-10">
              <div className="flex flex-wrap items-center justify-center gap-3 mb-1">
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

              {tarotSummary}

              <p className="text-xs sm:text-sm font-artistic text-white/90 leading-relaxed tracking-[0.04em] my-2">
                {reactionText}
              </p>

            </StoryBanner>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
