import { ReactNode } from 'react';

/** Shared floating surface for in-scene story prompts and reactions. */
export function StoryBanner({ children, className = '', countdown }: { children: ReactNode; className?: string; countdown?: { remaining: number; total: number; label: string } }) {
  return (
    <div className={`relative isolate rounded-none text-white/90 px-6 py-1.5 ${className}`}>
      {countdown && (
        <div
          role="progressbar"
          aria-label={countdown.label}
          aria-valuemin={0}
          aria-valuemax={countdown.total}
          aria-valuenow={Math.max(0, Math.min(countdown.total, countdown.remaining))}
          className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 w-2/5 max-w-60 h-[2px] overflow-hidden bg-white/[0.06]"
        >
          <div className="h-full w-full origin-left bg-white/60 transition-transform duration-100 ease-linear motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.max(0, Math.min(1, countdown.remaining / countdown.total))})` }} />
        </div>
      )}
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-3/5 max-w-80 bottom-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent">
        <div className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[3px]" />
      </div>
    </div>
  );
}
