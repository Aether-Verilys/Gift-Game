import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryNode, Choice } from '../types';
import { TarotCard } from './TarotCard';
import { audioService } from '../services/audioService';

interface FloatingChoiceOverlayProps {
  currentNode: StoryNode;
  onSelectChoice: (choice: Choice) => void;
  isVisible: boolean;
}

export const FloatingChoiceOverlay: React.FC<FloatingChoiceOverlayProps> = ({
  currentNode,
  onSelectChoice,
  isVisible,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  // Reset selected state when node changes
  useEffect(() => {
    setSelectedChoiceId(null);
  }, [currentNode?.id]);

  if (!isVisible || !currentNode || currentNode.isEnding || !currentNode.choices || currentNode.choices.length === 0) {
    return null;
  }

  const handleHover = () => {
    if (!selectedChoiceId) {
      audioService.playHoverChime();
    }
  };

  const handleSelect = (choice: Choice) => {
    if (selectedChoiceId) return; // Prevent double trigger
    setSelectedChoiceId(choice.id);
    audioService.playTarotFlip();
    setTimeout(() => {
      audioService.playChoiceConfirm();
    }, 150);

    // Give a brief moment for the card flip/ascend animation before dismissing
    setTimeout(() => {
      onSelectChoice(choice);
    }, 450);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentNode.id}
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-16 md:top-20 lg:top-24 left-1/2 -translate-x-1/2 w-full max-w-5xl z-20 pointer-events-auto text-center px-4"
      >
        <div id={`choice-overlay-${currentNode.id}`} className="relative py-2">
          {/* Chapter & Speaker Header: Delicate, Whisper-Quiet */}
          <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs tracking-[0.16em] text-white/45 font-garamond uppercase mb-1.5 select-none">
            <span className="tracking-[0.18em]">{currentNode.chapter}</span>
            {currentNode.speaker && (
              <>
                <span className="text-white/20">·</span>
                <span className="tracking-[0.12em] text-white/60">{currentNode.speaker}</span>
              </>
            )}
          </div>

          {/* Crisp, Poetic Invitation Prompt (No walls of text!) */}
          <h2 className="text-white/95 font-artistic font-normal text-base sm:text-lg md:text-xl tracking-[0.06em] mb-5 text-glow-sm max-w-2xl mx-auto select-none">
            {currentNode.prompt}
          </h2>

          {/* Tarot Cards Spread */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mx-auto max-w-4xl py-2">
            {currentNode.choices.map((choice, idx) => (
              <TarotCard
                key={choice.id}
                choice={choice}
                index={idx}
                isSelected={selectedChoiceId === choice.id}
                isAnySelected={selectedChoiceId !== null}
                onSelect={handleSelect}
                onHover={handleHover}
              />
            ))}
          </div>

          {/* Minimalist Hint */}
          <div className="mt-4 sm:mt-5 text-[10px] sm:text-[11px] text-white/35 font-garamond tracking-[0.18em] uppercase select-none">
            [ Draw a Tarot Card · Press 1-{currentNode.choices.length} or Click to Choose ]
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
