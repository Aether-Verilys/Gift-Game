import { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';
import { Layers, X } from 'lucide-react';
import { TarotCardDef } from '../types';
import { TarotArtwork as TarotSymbol } from './TarotArtwork';
import { Language, copy, interpolate, tarotKeyword, tarotName } from '../i18n';

interface TarotCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: TarotCardDef[];
  unlockedCardIds: string[];
  language?: Language;
}

export function TarotCollectionModal({ isOpen, onClose, cards, unlockedCardIds, language = 'zh' }: TarotCollectionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reversedCards, setReversedCards] = useState<Record<string, boolean>>({});
  const flipCard = (id: string) => {
    setReversedCards((previous) => ({ ...previous, [id]: !previous[id] }));
    audioService.playTarotFlip();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      audioService.playTarotFlip();
    }
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const closeWithSound = () => {
    audioService.playUIClick();
    onClose();
  };
  const t = copy[language];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tarot-collection-title"
      onCancel={(event) => { event.preventDefault(); closeWithSound(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded border border-white/20 bg-[#0a0a10] p-0 text-white shadow-2xl backdrop:bg-black/85 backdrop:backdrop-blur-md"
      data-scrollable="true"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0a0a10] p-5 sm:p-6">
        <div>
          <h2 id="tarot-collection-title" className="flex items-center gap-2 text-base font-artistic tracking-wider">
            <Layers className="h-4 w-4 text-white/50" />{t.collectionTitle}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            {interpolate(t.collectionCount, { unlocked: unlockedCardIds.length, total: cards.length })}
          </p>
        </div>
        <button autoFocus onClick={closeWithSound} aria-label={t.closeCollection} className="shrink-0 cursor-pointer rounded p-2 text-white/60 hover:text-white focus-visible:outline focus-visible:outline-white/60">
          <X className="h-5 w-5" />
        </button>
      </div>
      {(
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4 p-5 sm:p-6">
          {cards.map((card) => {
            const unlocked = unlockedCardIds.includes(card.id);
            const reversed = reversedCards[card.id] ?? false;
            const name = tarotName(language, card.id, language === 'zh' ? card.nameZh : card.nameEn);
            return (
            <button key={card.id} type="button" disabled={!unlocked}
              onClick={() => flipCard(card.id)}
              aria-label={unlocked ? `${name} · ${reversed ? t.reversed : t.upright}` : t.locked}
              aria-pressed={unlocked ? reversed : undefined}
              className={`relative isolate overflow-hidden w-full cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 focus-visible:outline-offset-2 flex min-h-[360px] flex-col rounded border p-4 text-center ${unlocked ? 'border-white/20 bg-gradient-to-b from-white/[0.06] to-transparent' : 'border-white/10 bg-[#11111b]'}`}>
              {unlocked ? <>
                <div className={`absolute inset-0 -z-20 transition-transform duration-500 motion-reduce:transition-none ${reversed ? 'rotate-180' : ''}`}><TarotSymbol symbol={card.symbol} /></div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-transparent to-black/95" />
                <div className="pointer-events-none absolute inset-2 border border-white/25" />
                <span className="text-left font-garamond text-sm text-white/70">{card.numeral}</span>
                <div className="min-h-36 flex-1" />
                <span className="font-artistic text-lg tracking-widest">{name}</span>
                <div className="mt-5 space-y-3 border-t border-white/10 pt-4 text-left text-xs leading-relaxed">
                  <span className="block text-white/65">{reversed ? t.reversed : t.upright}</span>
                  <span className="block text-white/90">{tarotKeyword(language, card.id, reversed ? 'reversed' : 'upright', reversed ? card.keywordReversed : card.keywordUpright)}</span>
                </div>
              </> : <>
                <div className="flex flex-1 flex-col items-center justify-center rounded border border-white/10 bg-[radial-gradient(circle_at_center,rgba(130,150,190,0.18),transparent_62%)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 text-3xl text-white/35 shadow-[0_0_30px_rgba(150,170,210,0.12)]">✦</div>
                  <div className="mt-5 text-[10px] tracking-[0.3em] text-white/30">{t.unknownTarot}</div>
                  <div className="mt-2 text-xs text-white/35">{t.locked}</div>
                </div>
                <p className="mt-3 text-xs text-white/25">{t.lockedHint}</p>
              </>}
            </button>
          )})}
        </div>
      )}
      <div className="border-t border-white/10 p-4 text-center">
        <button onClick={closeWithSound} className="cursor-pointer px-4 py-2 text-xs font-artistic text-white/60 hover:text-white">{t.backToReading}</button>
      </div>
    </dialog>
  );
}
