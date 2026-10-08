import React, { useLayoutEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TarotCardDef } from '../types';
import { TarotArtwork as TarotSymbol } from './TarotArtwork';

interface CardFlightOverlayProps {
  card: TarotCardDef;
  start: { x: number; y: number };
  stage: number;
  onComplete: () => void;
}

const CARD_WIDTH = 56;
const CARD_HEIGHT = 86;

export const CardFlightOverlay: React.FC<CardFlightOverlayProps> = ({ card, start, stage, onComplete }) => {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    // Keep the effect usable in Zen mode, where the tray is intentionally
    // hidden. The normal path below replaces this fallback with the exact
    // slot rectangle as soon as it is available.
    setTarget({ x: 24 + CARD_WIDTH / 2, y: 64 + CARD_HEIGHT / 2 });
    const slot = document.querySelector<HTMLElement>(`[data-stage-card-slot="${stage}"]`);
    if (!slot) return;
    const updateTarget = () => {
      const rect = slot.getBoundingClientRect();
      setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };
    updateTarget();
    window.addEventListener('resize', updateTarget);
    return () => window.removeEventListener('resize', updateTarget);
  }, [stage]);

  if (!target) return null;

  const targetLeft = target.x - CARD_WIDTH / 2;
  const targetTop = target.y - CARD_HEIGHT / 2;
  const startLeft = start.x - CARD_WIDTH / 2;
  const startTop = start.y - CARD_HEIGHT / 2;
  const midLeft = (startLeft + targetLeft) / 2 + 34;
  const midTop = (startTop + targetTop) / 2 + 16;
  const trailAngle = Math.atan2(target.y - start.y, target.x - start.x) - Math.PI / 2;

  return (
    <motion.div
      className="pointer-events-none fixed z-[85]"
      initial={{ left: startLeft, top: startTop, opacity: 0, scale: 0.7, rotate: -8 }}
      animate={{ left: [startLeft, midLeft, targetLeft], top: [startTop, midTop, targetTop], opacity: [0, 1, 1], scale: [0.7, 1.08, 1], rotate: [-8, 12, 0] }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], times: [0, 0.45, 1] }}
    >
      <motion.div
        className="relative h-[86px] w-14 overflow-visible rounded-[3px] border border-[#f4df9d]/80 bg-[#0b0b14]/95 p-1 shadow-[0_0_22px_rgba(255,214,111,0.9)]"
        animate={{ scale: [1, 1.04, 0.96, 0.82], opacity: [1, 1, 0.98, 0] }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], times: [0, 0.55, 0.88, 1] }}
        onAnimationComplete={onComplete}
      >
        <div className="absolute -inset-8 rounded-full bg-[#ffe7a3]/20 blur-xl" />
        <div className="absolute inset-0 overflow-hidden rounded-[2px] opacity-80">
          <TarotSymbol symbol={card.symbol} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between text-center font-artistic text-white">
          <span className="text-[7px] tracking-[0.18em] text-white/70">{card.numeral}</span>
          <span className="truncate text-[7px] tracking-[0.08em] text-white/90">{card.nameEn}</span>
        </div>
        <div className="card-flight-trail absolute -z-10 left-1/2 top-1/2 h-20 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-[#fff0b8]/70 to-transparent blur-md" style={{ transform: `translate(-50%, -50%) rotate(${trailAngle}rad)` }} />
        <div className="card-flight-trail card-flight-trail-delay absolute -z-10 left-1/2 top-1/2 h-28 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-white/80 to-transparent blur-sm" style={{ transform: `translate(-50%, -50%) rotate(${trailAngle}rad)` }} />
      </motion.div>
    </motion.div>
  );
};
