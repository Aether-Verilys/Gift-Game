import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoryNode, Choice } from '../types';
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
  if (!isVisible || !currentNode || currentNode.isEnding || currentNode.choices.length === 0) {
    return null;
  }

  const handleHover = () => {
    audioService.playHoverChime();
  };

  const handleSelect = (choice: Choice) => {
    audioService.playChoiceConfirm();
    onSelectChoice(choice);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentNode.id}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-20 md:top-24 lg:top-28 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-20 pointer-events-auto text-center"
      >
        <div id={`choice-overlay-${currentNode.id}`} className="relative py-1 px-4">
          {/* Chapter & Celestial Speaker Header: Delicate, Whisper-Quiet */}
          <div className="flex items-center justify-center gap-2.5 text-[11px] md:text-[12px] tracking-[0.14em] text-white/40 font-garamond uppercase mb-2 select-none">
            <span className="tracking-[0.12em]">{currentNode.chapter}</span>
            {currentNode.speaker && (
              <>
                <span className="text-white/20">·</span>
                <span className="tracking-[0.1em] text-white/55">{currentNode.speaker}</span>
              </>
            )}
          </div>

          {/* Prompt: Poetic, Natural Flowing English Typography */}
          <h2 className="text-white/90 font-artistic font-normal text-[15px] md:text-[16px] lg:text-[17px] leading-relaxed tracking-normal mb-4 text-glow-sm max-w-3xl mx-auto select-none">
            {currentNode.prompt}
          </h2>

          {/* Floating Choices: Natural English Spacing */}
          <div className="space-y-2 max-w-3xl mx-auto">
            {currentNode.choices.map((choice, idx) => {
              const romanNums = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
              const numStr = romanNums[idx] || `0${idx + 1}`;
              return (
                <button
                  key={choice.id}
                  id={`choice-btn-${choice.id}`}
                  onClick={() => handleSelect(choice)}
                  onMouseEnter={handleHover}
                  className="group relative w-full text-center py-1.5 px-4 cursor-pointer transition-all duration-300 block focus:outline-none"
                >
                  {/* Subtle Expanding Starlight Beam Underline on Hover */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/5 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-all duration-500 pointer-events-none" />

                  {/* Single-Row / Slender Line Layout */}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                    {/* Number index */}
                    <span className="font-garamond italic text-xs md:text-sm text-white/35 group-hover:text-white/70 transition-colors duration-300">
                      {numStr} ·
                    </span>

                    {/* Main choice title */}
                    <span className="font-artistic text-[14px] md:text-[15px] text-white/80 group-hover:text-white group-hover:text-glow-md tracking-normal transition-all duration-300">
                      {choice.text}
                    </span>

                    {/* Subtext attached seamlessly in natural English cadence */}
                    {choice.subtext && (
                      <span className="font-artistic italic text-[12px] md:text-[13px] text-white/40 group-hover:text-white/70 tracking-normal transition-colors duration-300 before:content-['—'] before:mr-2 before:text-white/20 hidden sm:inline">
                        {choice.subtext}
                      </span>
                    )}
                  </div>

                  {/* Subtext on mobile screens if wrapped */}
                  {choice.subtext && (
                    <div className="font-artistic italic text-[11px] text-white/40 group-hover:text-white/70 tracking-normal mt-0.5 sm:hidden">
                      {choice.subtext}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Minimalist Hint */}
          <div className="mt-3.5 text-[10px] md:text-[11px] text-white/25 font-garamond tracking-[0.14em] uppercase select-none">
            [ Press 1-{currentNode.choices.length} to Choose · Heed the Stars ]
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
