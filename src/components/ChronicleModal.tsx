import React from 'react';
import { X, Feather, Compass, Heart, Sparkles, Moon, Gift, Shield } from 'lucide-react';
import { ChronicleEntry, PlayerStats } from '../types';
import { TarotSymbol } from './TarotSvgSymbols';

interface ChronicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ChronicleEntry[];
  stats: PlayerStats;
  distance: number;
}

export const ChronicleModal: React.FC<ChronicleModalProps> = ({
  isOpen,
  onClose,
  entries,
  stats,
  distance,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none">
      <div
        id="chronicle-dialog"
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0a0a10]/95 border border-white/20 rounded p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Feather className="w-4 h-4 text-white/50" />
            <h2 className="text-sm md:text-base font-artistic tracking-[0.25em] text-white uppercase">
              Wanderer's Chronicle · 旅途手记
            </h2>
          </div>
          <button
            id="close-chronicle-btn"
            onClick={onClose}
            className="p-1.5 text-white/45 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 mb-4 border-b border-white/10 font-artistic">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-1 uppercase tracking-wider">
              <Heart className="w-3 h-3 text-white/50" />
              <span>共情</span>
            </div>
            <div className="text-xl font-garamond font-medium text-white">{stats.empathy}</div>
            <div className="text-[10px] text-white/30 mt-0.5 tracking-wider uppercase">对他者感受的敏感度</div>
          </div>

          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-1 uppercase tracking-wider">
              <Compass className="w-3 h-3 text-white/50" />
              <span>洞察</span>
            </div>
            <div className="text-xl font-garamond font-medium text-white">{stats.insight}</div>
            <div className="text-[10px] text-white/30 mt-0.5 tracking-wider uppercase">理解处境的清晰度</div>
          </div>

          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-white/50" />
              <span>犹豫</span>
            </div>
            <div className="text-xl font-garamond font-medium text-white">{stats.hesitation}</div>
            <div className="text-[10px] text-white/30 mt-0.5 tracking-wider uppercase">面对选择的迟疑程度</div>
          </div>

          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-1 uppercase tracking-wider">
              <Moon className="w-3 h-3 text-white/50" />
              <span>边界</span>
            </div>
            <div className="text-xl font-garamond font-medium text-white">{stats.boundary}</div>
            <div className="text-[10px] text-white/30 mt-0.5 tracking-wider uppercase">保护自身的倾向</div>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto py-2 pr-2 space-y-6 font-artistic">
          <div className="text-[11px] text-white/35 mb-2 font-garamond tracking-[0.08em] uppercase">
            // Traveled Distance: {distance.toFixed(1)} Light-Years · Recorded {entries.length} Stage Encounters
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 text-white/35 font-artistic text-xs md:text-sm tracking-normal">
              旅途手记尚无记录。在星空下抽取第一张塔罗牌，开启前行之途。
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={idx}
                className="relative pl-5 pb-6 border-l border-white/15 last:border-l-0 last:pb-0"
              >
                {/* Subtle hesitation node dot on timeline */}
                <div className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />

                <div className="flex items-center justify-between text-[11px] text-white/35 mb-1.5 font-garamond tracking-[0.06em] uppercase">
                  <span className="font-artistic">
                    {entry.stage === 1 ? '起因之章' : entry.stage === 2 ? '经过之章' : '结果之章'}
                  </span>
                  <span>{entry.timestamp}</span>
                </div>

                <div className="flex items-center gap-3 py-2 px-3 rounded bg-white/5 border border-white/10 mb-2">
                  <div className={`w-8 h-8 text-white/70 flex-shrink-0 ${entry.orientation === 'reversed' ? 'rotate-180' : ''}`}>
                    <TarotSymbol symbol={entry.card.symbol} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-['Cinzel',serif] text-white tracking-wider flex items-center gap-1.5">
                      <span className="text-white/40">{entry.card.numeral}</span>
                      <span>·</span>
                      <span>{entry.card.nameEn}</span>
                      <span className="font-artistic text-white/70">({entry.card.nameZh})</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-artistic ml-auto ${
                        entry.orientation === 'reversed' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/80'
                      }`}>
                        {entry.orientation === 'reversed' ? '逆位' : '顺位'}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40 font-artistic flex items-center gap-1.5 mt-0.5">
                      {entry.offeredGift ? (
                        <>
                          <Gift className="w-3 h-3 text-red-400" />
                          <span className="text-red-300/80">已献出红色礼物</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 text-white/40" />
                          <span>保留礼物</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs md:text-[13px] text-white/65 leading-relaxed font-artistic tracking-normal italic">
                  "{entry.reflection}"
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            id="close-chronicle-bottom-btn"
            onClick={onClose}
            className="group relative text-xs font-artistic tracking-[0.1em] text-white/50 hover:text-white py-1.5 px-3 transition-colors cursor-pointer"
          >
            <span>[ 关闭手记 ]</span>
            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-[1px] bg-white/50 transition-all duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
