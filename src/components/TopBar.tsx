import React from 'react';
import { Volume2, VolumeX, BookOpen, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { CameraView, PlayerStats } from '../types';

interface TopBarProps {
  currentChapter: string;
  distance: number;
  view: CameraView;
  onChangeView: (view: CameraView) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenChronicle: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onRestart: () => void;
  stats: PlayerStats;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentChapter,
  distance,
  view,
  onChangeView,
  isMuted,
  onToggleMute,
  onOpenChronicle,
  zenMode,
  onToggleZenMode,
  onRestart,
  stats,
}) => {
  if (zenMode) {
    return (
      <button
        id="exit-zen-btn"
        onClick={onToggleZenMode}
        className="fixed bottom-6 right-6 z-50 p-2.5 text-white/50 hover:text-white transition-all font-artistic text-xs flex items-center gap-2 cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        title="Exit Zen Mode (Press H)"
      >
        <Eye className="w-4 h-4" />
        <span className="tracking-[0.2em]">Show Interface (H)</span>
      </button>
    );
  }

  return (
    <header
      id="top-bar-header"
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 select-none pointer-events-none"
    >
      {/* Left: Brand and Journey Stage Coordinates */}
      <div className="pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-artistic font-normal tracking-[0.14em] text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase">
            Gift for Universe
          </h1>
          <span className="text-[9px] text-white/25 font-garamond tracking-[0.14em] uppercase hidden sm:inline">
            // GIFT FOR UNIVERSE
          </span>
        </div>
        <div className="text-[10px] text-white/45 font-artistic flex items-center gap-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mt-0.5">
          <span className="tracking-[0.08em] uppercase text-white/70">{currentChapter}</span>
          <span className="text-white/20">·</span>
          <span className="font-garamond text-[10px] tracking-[0.08em]">{distance.toFixed(1)} LY</span>
        </div>
      </div>

      {/* Middle Stats (Affinity indicators) */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-artistic text-white/35 pointer-events-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
        <span title="漫步者与白马的心灵羁绊" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Bond <span className="font-garamond text-white/50">{stats.bond}</span>
        </span>
        <span title="对宇宙秩序与虚空的哲思洞察" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Insight <span className="font-garamond text-white/50">{stats.insight}</span>
        </span>
        <span title="抵抗虚无的恒星灵曦" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Starlight <span className="font-garamond text-white/50">{stats.starlight}</span>
        </span>
        <span title="静默与熵增的安宁共处" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Void <span className="font-garamond text-white/50">{stats.voidAffinity}</span>
        </span>
        <span
          title="场景中的绯红礼物：拖拽可直接与造物共鸣"
          className="text-[#ff4d6d]/70 hover:text-[#ff4d6d] transition-colors tracking-[0.06em] uppercase text-[10px] hidden xl:flex items-center gap-1.5 cursor-help"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3355] animate-pulse" />
          <span>Scarlet Gift</span>
        </span>
      </div>

      {/* Right Controls: Minimalist icons */}
      <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
        {/* View Perspective Toggle */}
        <button
          id="view-toggle-btn"
          onClick={() => {
            const nextView: Record<CameraView, CameraView> = {
              normal: 'cinematic',
              cinematic: 'close',
              close: 'normal',
            };
            onChangeView(nextView[view]);
          }}
          className="text-white/45 hover:text-white text-[11px] font-artistic transition-colors cursor-pointer hidden md:inline tracking-[0.08em] uppercase"
          title="Toggle Perspective (or scroll mouse wheel to zoom)"
        >
          [ 视角: {view === 'normal' ? '尾随' : view === 'cinematic' ? '远景' : '特写'} ]
        </button>

        {/* Audio Toggle */}
        <button
          id="audio-toggle-btn"
          onClick={onToggleMute}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? '取消静音' : '静音'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Chronicle Button */}
        <button
          id="chronicle-modal-btn"
          onClick={onOpenChronicle}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="查看旅途手记"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Zen Mode Button */}
        <button
          id="zen-toggle-btn"
          onClick={onToggleZenMode}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="进入纯享模式 (H)"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Restart Button */}
        <button
          id="restart-btn"
          onClick={onRestart}
          className="p-1.5 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          title="开启新的旅途"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
