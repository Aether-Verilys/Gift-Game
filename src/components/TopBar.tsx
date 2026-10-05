import React from 'react';
import { Volume2, VolumeX, BookOpen, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { CameraView, PlayerStats } from '../types';
import { Language, copy } from '../i18n';

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
  language: Language;
  onLanguageChange: (language: Language) => void;
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
  language,
  onLanguageChange,
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
        <span className="tracking-[0.2em]">{copy[language].show}</span>
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
        <span title="对他者感受的敏感度" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          {language === 'zh' ? '共情' : 'Empathy'} <span className="font-garamond text-white/50">{stats.empathy}</span>
        </span>
        <span title="对宇宙秩序与虚空的哲思洞察" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          {language === 'zh' ? '洞察' : 'Insight'} <span className="font-garamond text-white/50">{stats.insight}</span>
        </span>
        <span title="面对选择时的犹豫程度" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          {language === 'zh' ? '犹豫' : 'Hesitation'} <span className="font-garamond text-white/50">{stats.hesitation}</span>
        </span>
        <span title="保护自身界限的倾向" className="hover:text-white/70 transition-colors tracking-[0.06em] uppercase text-[11px]">
          {language === 'zh' ? '边界' : 'Boundaries'} <span className="font-garamond text-white/50">{stats.boundary}</span>
        </span>
      </div>

      {/* Right Controls: Minimalist icons */}
      <div className="flex items-center gap-3 md:gap-4 pointer-events-auto">
        <div className="flex items-center rounded border border-white/15 bg-black/20 p-0.5 text-[10px] font-artistic" aria-label={copy[language].language}>
          <button onClick={() => onLanguageChange('zh')} className={`px-1.5 py-1 cursor-pointer ${language === 'zh' ? 'bg-white/20 text-white' : 'text-white/40'}`}>中</button>
          <button onClick={() => onLanguageChange('en')} className={`px-1.5 py-1 cursor-pointer ${language === 'en' ? 'bg-white/20 text-white' : 'text-white/40'}`}>EN</button>
        </div>
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
