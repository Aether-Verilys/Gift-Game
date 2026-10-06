import * as THREE from 'three';

/** The planet moves under the stationary horse, so velocity comes from travel, not its transform. */
export function createHorseAnimationController(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const mixer = new THREE.AnimationMixer(root);
  const nameOf = (clip: THREE.AnimationClip) => clip.name.split('|').pop()!.trim().toLowerCase();
  const walkClip = clips.find(clip => nameOf(clip) === 'walk');
  if (!walkClip) throw new Error('Horse asset has no Walk animation');
  const idleClip = clips.find(clip => /^(1\s*)?(idle|ilde)$/.test(nameOf(clip)));
  const walk = mixer.clipAction(walkClip).setLoop(THREE.LoopRepeat, Infinity);
  const idle = idleClip ? mixer.clipAction(idleClip).setLoop(THREE.LoopRepeat, Infinity) : null;
  let state: 'idle' | 'walk' = 'idle';
  let active = idle ?? walk;
  active.play();
  if (!idle) walk.paused = true;
  mixer.update(0);

  return {
    get state() { return state; },
    update(dt: number, speed: number) {
      // Hysteresis prevents repeated fades near a stop. Every moving pace uses Walk.
      const moving = Math.abs(speed) > (state === 'walk' ? 0.005 : 0.02);
      const nextState = moving ? 'walk' : 'idle';
      if (nextState !== state) {
        const next = moving ? walk : idle ?? walk;
        if (next !== active) {
          active.fadeOut(0.2);
          next.reset().stopFading().setEffectiveWeight(1).fadeIn(0.2).play();
          active = next;
        }
        state = nextState;
      }
      active.enabled = true;
      active.paused = !idle && !moving;
      active.setEffectiveTimeScale(moving ? THREE.MathUtils.clamp(Math.abs(speed), 0.65, 1.8) : 1);
      mixer.update(dt);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
    },
  };
}
