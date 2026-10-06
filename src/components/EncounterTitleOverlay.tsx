import { AnimatePresence, motion } from 'motion/react';
import { TarotCardDef } from '../types';
import { Language } from '../i18n';

export function EncounterTitleOverlay({ card, visible, language }: { card: TarotCardDef | null; visible: boolean; language: Language }) {
  return (
    <AnimatePresence>
      {visible && card && (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(10px)' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-x-0 top-[34%] z-10 flex justify-center text-center"
        >
          <div className="relative px-8 py-2">
            <div className="absolute inset-x-0 top-1/2 -z-10 h-20 -translate-y-1/2 bg-black/20 blur-3xl" />
            <div className="font-artistic text-[clamp(2.8rem,8vw,7.5rem)] leading-[0.85] tracking-[0.12em] text-white/90 text-glow-md uppercase">
              {language === 'zh' ? card.nameZh : card.nameEn}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
