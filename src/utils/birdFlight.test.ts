import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleBirdFlight, type BirdFlightPattern } from './birdFlight';

const pattern: BirdFlightPattern = {
  flapDuration: 2.6, glideDuration: 4.8, climbHeight: 0.85, phaseOffset: 0, wingPhase: 0.7,
};

test('powered flight gains height; glide loses height with stationary wings and body', () => {
  let previous = 0;
  for (let t = 0; t <= pattern.flapDuration; t += 0.01) {
    const motion = sampleBirdFlight(t, pattern);
    assert.ok(motion.altitude >= previous);
    assert.ok(motion.altitude >= 0 && motion.altitude <= pattern.climbHeight);
    previous = motion.altitude;
  }
  previous = pattern.climbHeight;
  for (let t = pattern.flapDuration; t < 7.4; t += 0.01) {
    const motion = sampleBirdFlight(t, pattern);
    assert.equal(motion.mode, 'glide');
    assert.equal(motion.flap, 0);
    assert.equal(Math.abs(motion.bodyLift), 0);
    assert.ok(motion.altitude <= previous);
    previous = motion.altitude;
  }
});

test('phase boundaries preserve height and settle the wings without a jump', () => {
  for (const boundary of [2.6, 7.4, 10.0]) {
    const before = sampleBirdFlight(boundary - 0.0001, pattern);
    const after = sampleBirdFlight(boundary + 0.0001, pattern);
    assert.ok(Math.abs(before.altitude - after.altitude) < 0.00001);
    assert.ok(Math.abs(before.flap - after.flap) < 0.00001);
    assert.ok(Math.abs(before.bodyLift - after.bodyLift) < 0.00001);
  }
});

test('long runs stay bounded with a substantial fully still glide interval', () => {
  let still = 0;
  for (let i = 0; i < 6000; i++) {
    const motion = sampleBirdFlight(i / 30, { ...pattern, phaseOffset: 3.1 });
    assert.ok(Number.isFinite(motion.altitude));
    assert.ok(motion.altitude >= 0 && motion.altitude <= pattern.climbHeight);
    if (motion.mode === 'glide') { assert.equal(Math.abs(motion.flap), 0); still++; }
  }
  assert.ok(still / 6000 > 0.6);
});
