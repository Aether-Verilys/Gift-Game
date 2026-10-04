import React from 'react';
import { TarotCardInfo } from '../types';

interface TarotSymbolProps {
  symbol: TarotCardInfo['symbol'];
  className?: string;
}

export const TarotSymbol: React.FC<TarotSymbolProps> = ({ symbol, className = 'w-full h-full' }) => {
  switch (symbol) {
    case 'star':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Outer dashed halo */}
          <circle cx="50" cy="50" r="42" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="50" cy="50" r="34" strokeWidth="0.6" opacity="0.3" />
          {/* 8-pointed radiant compass star */}
          <path d="M50 8 L54 42 L88 46 L58 54 L66 88 L50 62 L34 88 L42 54 L12 46 L46 42 Z" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="5" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
          {/* Starlight coordinates */}
          <line x1="50" y1="2" x2="50" y2="98" strokeWidth="0.5" opacity="0.25" strokeDasharray="2 4" />
          <line x1="2" y1="50" x2="98" y2="50" strokeWidth="0.5" opacity="0.25" strokeDasharray="2 4" />
          <circle cx="50" cy="20" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="50" cy="80" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="20" cy="50" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="80" cy="50" r="1.5" fill="currentColor" opacity="0.7" />
        </svg>
      );

    case 'hermit':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Crescent cosmic moon */}
          <path d="M58 20 A30 30 0 1 0 58 80 A24 24 0 1 1 58 20 Z" strokeWidth="1" opacity="0.7" />
          {/* Solitary hanging celestial lantern */}
          <line x1="45" y1="18" x2="45" y2="40" strokeWidth="0.8" strokeDasharray="1 2" />
          <polygon points="45,40 52,48 48,64 42,64 38,48" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <circle cx="45" cy="53" r="3" fill="currentColor" opacity="0.9" />
          {/* Lantern radiant rays */}
          <line x1="45" y1="53" x2="68" y2="42" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
          <line x1="45" y1="53" x2="72" y2="56" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
          <line x1="45" y1="53" x2="64" y2="70" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.5" />
          {/* Ground ridge */}
          <path d="M15 88 Q45 78 85 88" strokeWidth="0.8" opacity="0.4" />
        </svg>
      );

    case 'sun':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Central blazing sun core */}
          <circle cx="50" cy="50" r="16" strokeWidth="1.2" fill="currentColor" fillOpacity="0.15" />
          <circle cx="50" cy="50" r="24" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.5" />
          <circle cx="50" cy="50" r="36" strokeWidth="0.5" opacity="0.3" />
          {/* Geometric Solar rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              <line x1="50" y1="20" x2="50" y2="8" strokeWidth={deg % 90 === 0 ? "1.2" : "0.7"} />
              {deg % 60 === 0 && <circle cx="50" cy="6" r="1.2" fill="currentColor" />}
            </g>
          ))}
          {/* Inner solar flare dot */}
          <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.8" />
        </svg>
      );

    case 'chariot':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Twin celestial wheels */}
          <circle cx="30" cy="68" r="14" strokeWidth="1" />
          <circle cx="30" cy="68" r="4" fill="currentColor" opacity="0.7" />
          <circle cx="70" cy="68" r="14" strokeWidth="1" />
          <circle cx="70" cy="68" r="4" fill="currentColor" opacity="0.7" />
          {/* Connecting chariot axle */}
          <line x1="30" y1="68" x2="70" y2="68" strokeWidth="1.2" />
          {/* Forward hyper-vector chevron */}
          <path d="M50 12 L78 48 L64 48 L50 30 L36 48 L22 48 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.12" />
          <line x1="50" y1="12" x2="50" y2="68" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.4" />
          <circle cx="50" cy="24" r="2" fill="currentColor" />
          <path d="M20 84 Q50 76 80 84" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.3" />
        </svg>
      );

    case 'abyss':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Gravitational event horizon ellipse */}
          <ellipse cx="50" cy="50" rx="38" ry="16" strokeWidth="1" opacity="0.6" transform="rotate(-15 50 50)" />
          <ellipse cx="50" cy="50" rx="44" ry="24" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.35" transform="rotate(-15 50 50)" />
          {/* Black hole dark nucleus */}
          <circle cx="50" cy="50" r="18" fill="#000000" stroke="currentColor" strokeWidth="1.5" />
          {/* Warped accretion halo */}
          <path d="M22 42 Q50 16 78 42" strokeWidth="1.2" opacity="0.8" />
          <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.9" />
          <circle cx="28" cy="46" r="1.5" fill="currentColor" />
          <circle cx="72" cy="54" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'beacon':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Beacon obelisk spire */}
          <polygon points="50,14 56,82 44,82" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <line x1="50" y1="14" x2="50" y2="82" strokeWidth="0.6" opacity="0.4" />
          {/* Concentric spherical beacon broadcasts */}
          <path d="M36 28 A18 18 0 0 1 64 28" strokeWidth="0.8" opacity="0.7" />
          <path d="M26 22 A30 30 0 0 1 74 22" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.5" />
          <path d="M18 16 A42 42 0 0 1 82 16" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3" />
          <circle cx="50" cy="14" r="2.5" fill="currentColor" />
          {/* Base pedestal */}
          <rect x="38" y="82" width="24" height="4" strokeWidth="1" />
        </svg>
      );

    case 'lovers':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Intertwined infinity/lemniscate starlight ribbons */}
          <path d="M28 50 C28 35 44 35 50 50 C56 65 72 65 72 50 C72 35 56 35 50 50 C44 65 28 65 28 50 Z" strokeWidth="1.2" />
          {/* Radiant central starlight seed */}
          <circle cx="50" cy="50" r="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="26" x2="50" y2="74" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
          {/* Twin star points */}
          <circle cx="34" cy="44" r="2" fill="currentColor" />
          <circle cx="66" cy="56" r="2" fill="currentColor" />
          <path d="M20 20 L24 24 M80 20 L76 24 M20 80 L24 76 M80 80 L76 76" strokeWidth="0.8" opacity="0.4" />
        </svg>
      );

    case 'prism':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Sacred faceted prism diamond */}
          <polygon points="50,14 78,42 50,86 22,42" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
          <line x1="22" y1="42" x2="78" y2="42" strokeWidth="0.8" opacity="0.6" />
          <line x1="50" y1="14" x2="50" y2="86" strokeWidth="0.8" opacity="0.6" />
          <line x1="36" y1="28" x2="50" y2="42" strokeWidth="0.6" opacity="0.4" />
          <line x1="64" y1="28" x2="50" y2="42" strokeWidth="0.6" opacity="0.4" />
          {/* Refracted spectrum beams */}
          <line x1="78" y1="42" x2="94" y2="34" strokeWidth="0.8" opacity="0.7" />
          <line x1="78" y1="42" x2="96" y2="44" strokeWidth="0.8" opacity="0.7" />
          <line x1="78" y1="42" x2="92" y2="54" strokeWidth="0.8" opacity="0.7" />
          <line x1="6" y1="42" x2="22" y2="42" strokeWidth="1" opacity="0.9" />
        </svg>
      );

    case 'rings':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Giant planet body */}
          <circle cx="50" cy="50" r="22" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          {/* Majestic orbital Saturnian rings */}
          <ellipse cx="50" cy="50" rx="46" ry="14" strokeWidth="1.2" transform="rotate(-22 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="10" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.6" transform="rotate(-22 50 50)" />
          <ellipse cx="50" cy="50" rx="48" ry="16" strokeWidth="0.5" opacity="0.35" transform="rotate(-22 50 50)" />
          {/* Shepherd moons */}
          <circle cx="20" cy="62" r="2" fill="currentColor" />
          <circle cx="82" cy="38" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'monolith':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Floating hypercube / 4D tesseract */}
          <rect x="34" y="24" width="32" height="52" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <rect x="40" y="32" width="20" height="36" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
          {/* Isometric projection lines */}
          <line x1="34" y1="24" x2="40" y2="32" strokeWidth="0.8" />
          <line x1="66" y1="24" x2="60" y2="32" strokeWidth="0.8" />
          <line x1="34" y1="76" x2="40" y2="68" strokeWidth="0.8" />
          <line x1="66" y1="76" x2="60" y2="68" strokeWidth="0.8" />
          {/* Cosmic center core dot */}
          <circle cx="50" cy="50" r="2.5" fill="currentColor" />
          {/* Ground shadow projection */}
          <ellipse cx="50" cy="88" rx="20" ry="4" strokeWidth="0.6" opacity="0.3" />
        </svg>
      );

    case 'world':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Cosmic Ouroboros ring */}
          <circle cx="50" cy="50" r="38" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
          <circle cx="50" cy="50" r="34" strokeWidth="0.7" opacity="0.3" />
          {/* Pegasus / Winged Celestial Steed Constellation */}
          <path d="M34 64 L42 46 L58 46 L68 34 M42 46 L50 28 L62 26 L58 38 M58 46 L64 64" strokeWidth="1.2" />
          <circle cx="34" cy="64" r="2" fill="currentColor" />
          <circle cx="42" cy="46" r="2" fill="currentColor" />
          <circle cx="58" cy="46" r="2" fill="currentColor" />
          <circle cx="50" cy="28" r="2" fill="currentColor" />
          <circle cx="62" cy="26" r="2.5" fill="currentColor" />
          <circle cx="68" cy="34" r="2" fill="currentColor" />
          <circle cx="64" cy="64" r="2" fill="currentColor" />
          {/* Surrounding 4 Cardinal Arcana glyphs */}
          <circle cx="50" cy="8" r="1.5" fill="currentColor" />
          <circle cx="50" cy="92" r="1.5" fill="currentColor" />
          <circle cx="8" cy="50" r="1.5" fill="currentColor" />
          <circle cx="92" cy="50" r="1.5" fill="currentColor" />
        </svg>
      );

    case 'fool':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Open cosmic cradle hands */}
          <path d="M22 68 C34 78 46 80 50 80 C54 80 66 78 78 68" strokeWidth="1.2" opacity="0.7" />
          <path d="M18 58 Q24 72 32 76" strokeWidth="0.8" opacity="0.5" />
          <path d="M82 58 Q76 72 68 76" strokeWidth="0.8" opacity="0.5" />
          {/* The Pale Blue Dot suspended in space */}
          <circle cx="50" cy="42" r="14" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
          <circle cx="50" cy="42" r="4" fill="currentColor" opacity="0.9" />
          <ellipse cx="50" cy="42" rx="20" ry="7" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
          {/* Starlight speckle trail */}
          <circle cx="34" cy="24" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="64" cy="20" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="70" cy="34" r="1" fill="currentColor" opacity="0.6" />
        </svg>
      );

    case 'watcher':
    default:
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className}>
          {/* Cosmic astrolabe / Balance scale of time */}
          <circle cx="50" cy="50" r="38" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 3" />
          {/* Hourglass geometry */}
          <polygon points="32,24 68,24 50,50" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
          <polygon points="50,50 68,76 32,76" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
          <line x1="28" y1="24" x2="72" y2="24" strokeWidth="1.2" />
          <line x1="28" y1="76" x2="72" y2="76" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="2.5" fill="currentColor" />
          <circle cx="50" cy="66" r="3" fill="currentColor" opacity="0.8" />
        </svg>
      );
  }
};
