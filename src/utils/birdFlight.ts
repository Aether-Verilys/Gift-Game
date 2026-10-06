export interface BirdFlightPattern {
  flapDuration: number;
  glideDuration: number;
  climbHeight: number;
  phaseOffset: number;
  wingPhase: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp01(n);
  return clamp01(t * t * t * (t * (t * 6 - 15) + 10));
};

/** Bounded, frame-rate independent powered flight and unpowered glide cycle. */
export function sampleBirdFlight(elapsed: number, pattern: BirdFlightPattern) {
  const duration = pattern.flapDuration + pattern.glideDuration;
  const remainder = (elapsed + pattern.phaseOffset) % duration;
  const phase = remainder < 0 ? remainder + duration : remainder;
  const powered = phase < pattern.flapDuration;
  const progress = powered
    ? phase / pattern.flapDuration
    : (phase - pattern.flapDuration) / pattern.glideDuration;
  // Both ends of the climb/descent have zero velocity and acceleration.
  const altitude = pattern.climbHeight * (powered ? ease(progress) : 1 - ease(progress));
  const wingWeight = powered
    ? ease(phase / 0.3) * ease((pattern.flapDuration - phase) / 0.45)
    : 0;
  const wingbeat = elapsed * 18 + pattern.wingPhase;
  return {
    mode: powered ? 'flap' as const : 'glide' as const,
    altitude,
    wingWeight,
    flap: powered ? Math.sin(wingbeat) * 0.7 * wingWeight : 0,
    bodyLift: powered ? Math.sin(wingbeat - Math.PI * 0.5) * 0.045 * wingWeight : 0,
  };
}
