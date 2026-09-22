import React from 'react';
import { motion } from 'motion/react';
import { Ending, PlayerStats } from '../types';
import { RotateCcw, BookOpen, Compass } from 'lucide-react';

interface EndingModalProps {
  ending: Ending;
  stats: PlayerStats;
  distance: number;
  onRestart: () => void;
  onOpenChronicle: () => void;
  onContinueEndless: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  ending,
  stats,
  distance,
  onRestart,
  onOpenChronicle,
  onContinueEndless,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        id="ending-container"
        className="relative w-full max-w-xl text-center py-6 px-4"
      >
        <div className="text-xs font-garamond tracking-[0.14em] text-white/35 uppercase mb-3">
          // IMPRINT OF DESTINY · FINALE
        </div>

        <h2 className="text-2xl md:text-3xl font-artistic font-normal tracking-[0.08em] text-white mb-1.5 text-glow-md uppercase">
          {ending.title}
        </h2>
        <div className="text-xs font-garamond text-white/40 tracking-[0.12em] uppercase mb-8">
          {ending.subtitle}
        </div>

        {/* Epitaph */}
        <div className="py-5 my-6 max-w-md mx-auto">
          <p className="text-base md:text-lg font-artistic italic text-white/90 leading-relaxed tracking-normal">
            "{ending.epitaph}"
          </p>
        </div>

        {/* Full Poem with Breathing Room */}
        <div className="space-y-3.5 mb-10 max-w-md mx-auto">
          {ending.fullPoem.map((line, idx) => (
            <p key={idx} className="text-sm md:text-base font-artistic text-white/75 tracking-normal leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* Journey Summary Stats */}
        <div className="flex items-center justify-center gap-6 py-3 text-xs font-garamond text-white/40 mb-8 uppercase tracking-[0.08em]">
          <span>Total Distance {distance.toFixed(1)} LY</span>
          <span className="text-white/20">·</span>
          <span>Bond {stats.bond}</span>
          <span className="text-white/20">·</span>
          <span>Insight {stats.insight}</span>
        </div>

        {/* Borderless Action Buttons with Starlight Underlines */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            id="restart-from-ending-btn"
            onClick={onRestart}
            className="group relative text-white font-artistic text-xs md:text-sm tracking-[0.08em] py-2 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white/70 group-hover:text-white" />
            <span>Restart Journey</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-[1px] bg-white/70 transition-all duration-300" />
          </button>

          <button
            id="open-chronicle-from-ending-btn"
            onClick={onOpenChronicle}
            className="group relative text-white/70 hover:text-white font-artistic text-xs md:text-sm tracking-[0.08em] py-2 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <BookOpen className="w-3.5 h-3.5 text-white/50 group-hover:text-white" />
            <span>View Chronicle</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-[1px] bg-white/70 transition-all duration-300" />
          </button>

          <button
            id="continue-endless-btn"
            onClick={onContinueEndless}
            className="group relative text-white/50 hover:text-white font-artistic text-xs md:text-sm tracking-[0.08em] py-2 px-4 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <Compass className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
            <span>Endless Wander</span>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-[1px] bg-white/70 transition-all duration-300" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
