import React from 'react';
import { Volume2, VolumeX, BookOpen, Eye, EyeOff, Pause, Play, FastForward, RotateCcw } from 'lucide-react';
import { WalkPace, CameraView, PlayerStats } from '../types';

interface TopBarProps {
  currentChapter: string;
  distance: number;
  pace: WalkPace;
  onChangePace: (pace: WalkPace) => void;
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
  pace,
  onChangePace,
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
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2.5 select-none pointer-events-none"
    >
      {/* Left: Brand and Journey Coordinates with Classical Fonts */}
      <div className="pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-artistic font-normal tracking-[0.12em] text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase">
            Celestial Odyssey
          </h1>
          <span className="text-[9px] text-white/25 font-garamond tracking-[0.14em] uppercase hidden sm:inline">
            // WANDERER'S VOYAGE
          </span>
        </div>
        <div className="text-[10px] text-white/40 font-artistic flex items-center gap-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          <span className="tracking-[0.06em] uppercase">{currentChapter}</span>
          <span className="text-white/20">·</span>
          <span className="font-garamond text-[10px] tracking-[0.08em]">{distance.toFixed(1)} LY</span>
        </div>
      </div>

      {/* Middle Stats (Affinity indicators) */}
      <div className="hidden lg:flex items-center gap-6 text-xs font-artistic text-white/35 pointer-events-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
        <span title="Soul affinity between wanderer and steed" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Bond <span className="font-garamond text-white/50">{stats.bond}</span>
        </span>
        <span title="Philosophical insight into the cosmic order" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Insight <span className="font-garamond text-white/50">{stats.insight}</span>
        </span>
        <span title="Inner stellar warmth defying the void" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Starlight <span className="font-garamond text-white/50">{stats.starlight}</span>
        </span>
        <span title="Quiet harmony with silence and entropy" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          Void <span className="font-garamond text-white/50">{stats.voidAffinity}</span>
        </span>
        <span
          title="Draggable Scarlet Core: click & drag across the starry sky to manipulate gravity"
          className="text-[#ff4d6d]/70 hover:text-[#ff4d6d] transition-colors tracking-[0.06em] uppercase text-[10px] hidden xl:flex items-center gap-1.5 cursor-help"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3355] animate-pulse" />
          <span>Scarlet Core</span>
        </span>
      </div>

      {/* Right Controls: Floating borderless controls */}
      <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
        {/* Pace Controls */}
        <div className="flex items-center gap-2 text-xs font-garamond text-white/50">
          <button
            id="pace-pause-btn"
            onClick={() => onChangePace('pause')}
            className={`p-1.5 transition-colors cursor-pointer ${
              pace === 'pause' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'hover:text-white/80'
            }`}
            title="Pause & Reflect (P)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            id="pace-walk-btn"
            onClick={() => onChangePace('walk')}
            className={`p-1.5 transition-colors cursor-pointer ${
              pace === 'walk' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'hover:text-white/80'
            }`}
            title="Gentle Walk (1x)"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            id="pace-trot-btn"
            onClick={() => onChangePace('trot')}
            className={`p-1.5 transition-colors cursor-pointer ${
              pace === 'trot' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'hover:text-white/80'
            }`}
            title="Trot & Travel (1.8x)"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Toggle */}
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
          [ View: {view === 'normal' ? 'Trailing' : view === 'cinematic' ? 'Deep Space' : 'Companion'} ]
        </button>

        {/* Audio Toggle */}
        <button
          id="audio-toggle-btn"
          onClick={onToggleMute}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Soundscape' : 'Mute Soundscape'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Chronicle Button */}
        <button
          id="chronicle-modal-btn"
          onClick={onOpenChronicle}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-artistic tracking-[0.08em] uppercase"
          title="Open Chronicle Journal"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chronicle</span>
        </button>

        {/* Zen Mode Button */}
        <button
          id="zen-mode-toggle-btn"
          onClick={onToggleZenMode}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Zen View (Hide UI, Press H)"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Restart Button */}
        <button
          id="restart-journey-btn"
          onClick={onRestart}
          className="p-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Restart Journey"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
