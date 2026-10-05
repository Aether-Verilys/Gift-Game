import React from 'react';
import { motion } from 'motion/react';
import { Choice } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';

interface TarotCardProps {
  choice: Choice;
  index: number;
  isSelected?: boolean;
  isAnySelected?: boolean;
  onSelect: (choice: Choice) => void;
  onHover: () => void;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  choice,
  index,
  isSelected = false,
  isAnySelected = false,
  onSelect,
  onHover,
}) => {
  const tarot = choice.tarot || {
    numeral: '0',
    nameEn: 'THE STAR',
    nameZh: '星辰',
    keyword: 'GUIDANCE · 指引',
    archetype: 'light',
    symbol: 'star' as const,
  };

  return (
    <motion.button
      type="button"
      id={`tarot-card-${choice.id}`}
      layout
      onClick={() => onSelect(choice)}
      onMouseEnter={onHover}
      whileHover={!isAnySelected ? { y: -16, scale: 1.03 } : {}}
      whileTap={!isAnySelected ? { scale: 0.98 } : {}}
      animate={
        isSelected
          ? { scale: 1.08, y: -24, filter: 'drop-shadow(0 0 35px rgba(255,255,255,0.4))' }
          : isAnySelected
          ? { opacity: 0.2, scale: 0.94, filter: 'blur(3px)' }
          : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
      }
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative w-44 sm:w-48 md:w-52 h-[290px] sm:h-[320px] md:h-[350px] cursor-pointer text-left focus:outline-none select-none rounded-[3px] p-[2px] transition-all duration-300"
    >
      {/* Outer Ethereal Shimmer Rim */}
      <div className="absolute inset-0 rounded-[3px] bg-gradient-to-b from-white/25 via-white/10 to-white/5 group-hover:from-white/50 group-hover:via-white/25 group-hover:to-red-500/20 transition-all duration-500" />

      {/* Card Body */}
      <div className="relative w-full h-full bg-[#0a0a0f]/95 backdrop-blur-md rounded-[2px] border border-white/15 group-hover:border-white/40 flex flex-col justify-between p-3.5 sm:p-4 overflow-hidden transition-colors duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.85)]">
        {/* Subtle Sweeping Foil Light Streak on Hover */}
        <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/8 to-transparent rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* Inner Ornamental Frame with Corner Crosses */}
        <div className="absolute inset-1.5 border border-white/10 group-hover:border-white/20 pointer-events-none transition-colors duration-300" />
        <span className="absolute top-2 left-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
        <span className="absolute top-2 right-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
        <span className="absolute bottom-2 left-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>
        <span className="absolute bottom-2 right-2 text-[8px] text-white/30 pointer-events-none font-serif">✦</span>

        {/* Top Header: Roman Numeral & Arcana Badge */}
        <div className="relative z-10 text-center pt-0.5">
          <div className="text-[9px] tracking-[0.25em] text-white/35 font-garamond uppercase mb-0.5 group-hover:text-white/60 transition-colors">
            Major Arcana
          </div>
          <div className="font-['Cinzel',serif] text-sm sm:text-base font-semibold tracking-[0.18em] text-white/85 group-hover:text-white group-hover:text-glow-sm transition-all">
            {tarot.numeral}
          </div>
        </div>

        {/* Center: Sacred Geometry Tarot Linework Illustration */}
        <div className="relative z-10 my-auto flex items-center justify-center py-2">
          <div className="relative w-20 sm:w-24 md:w-28 h-20 sm:h-24 md:h-28 text-white/70 group-hover:text-white transition-all duration-500 group-hover:scale-105">
            {/* Luminous aura behind symbol */}
            <div className="absolute inset-0 rounded-full bg-white/5 blur-md group-hover:bg-white/10 transition-colors" />
            <TarotSymbol symbol={tarot.symbol} />
          </div>
        </div>

        {/* Bottom Section: Tarot Title */}
        <div className="relative z-10 text-center pb-0.5">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h3 className="font-['Cinzel',serif] font-semibold text-xs sm:text-[13px] md:text-sm tracking-[0.16em] text-white group-hover:text-white transition-colors uppercase">
              {tarot.nameEn}
            </h3>
          </div>

          {/* Divination Keyword (Crisp, not a wall of text!) */}
          <div className="text-[10px] sm:text-[11px] font-artistic tracking-[0.06em] text-white/50 group-hover:text-white/90 transition-colors mb-2">
            {tarot.keyword}
          </div>

        </div>
      </div>
    </motion.button>
  );
};
