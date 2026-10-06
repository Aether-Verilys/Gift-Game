import * as THREE from 'three';

/** Transfer motion between the two Mixamo rigs without replacing the traveler's bone lengths. */
export function retargetTravelerClips(
  target: THREE.Object3D,
  source: THREE.Object3D,
  clips: THREE.AnimationClip[],
) {
  target.updateWorldMatrix(true, true);
  source.updateWorldMatrix(true, true);
  const targetInverse = target.getWorldQuaternion(new THREE.Quaternion()).invert();
  const sourceInverse = source.getWorldQuaternion(new THREE.Quaternion()).invert();
  const targetNodes: THREE.Object3D[] = [];
  target.traverse(node => targetNodes.push(node));
  const sourceBones = new Map<string, THREE.Bone>();
  const boneName = (name: string) => name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  source.traverse(node => {
    if (node instanceof THREE.Bone) sourceBones.set(boneName(node.name), node);
  });
  const targetBones = targetNodes.filter((node): node is THREE.Bone => node instanceof THREE.Bone);
  const targetBone = (name: string) => targetBones.find(bone => boneName(bone.name) === `mixamorig${name}`)!;
  const sourceHip = sourceBones.get('mixamorighips');
  const targetHip = targetBone('hips');
  if (!sourceHip || !targetHip) throw new Error('Traveler animation requires Mixamo Hips bones');

  // Both GLBs are Y-up, but face opposite directions. Align the shoulder axis
  // in model space before applying world-space changes from the source bind pose.
  const side = (left: THREE.Object3D, right: THREE.Object3D, root: THREE.Object3D) => {
    const axis = root.worldToLocal(left.getWorldPosition(new THREE.Vector3()))
      .sub(root.worldToLocal(right.getWorldPosition(new THREE.Vector3())));
    axis.y = 0;
    return axis.normalize();
  };
  const alignment = new THREE.Quaternion().setFromUnitVectors(
    side(sourceBones.get('mixamorigleftarm')!, sourceBones.get('mixamorigrightarm')!, source),
    side(targetBone('leftarm'), targetBone('rightarm'), target),
  );
  const restLocal = new Map(targetNodes.map(node => [node, node.quaternion.clone()]));
  const bindings = targetBones.flatMap(bone => {
    const from = sourceBones.get(boneName(bone.name));
    if (!from) return [];
    const sourceRest = from.getWorldQuaternion(new THREE.Quaternion()).premultiply(sourceInverse);
    const targetRest = bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(targetInverse);
    return [{ bone, from, correction: sourceRest.invert().multiply(alignment.clone().invert()).multiply(targetRest) }];
  });
  const bindingByBone = new Map(bindings.map(binding => [binding.bone as THREE.Object3D, binding]));
  const sourceHipRest = source.worldToLocal(sourceHip.getWorldPosition(new THREE.Vector3()));
  const targetHipRest = target.worldToLocal(targetHip.getWorldPosition(new THREE.Vector3()));
  const hipScale = targetHipRest.y / sourceHipRest.y;
  if (!Number.isFinite(hipScale) || hipScale <= 0) throw new Error('Invalid Mixamo hip height');
  const targetParentInverse = targetHip.parent!.getWorldQuaternion(new THREE.Quaternion())
    .premultiply(targetInverse).invert();
  const targetParentScale = targetHip.parent!.getWorldScale(new THREE.Vector3())
    .divide(target.getWorldScale(new THREE.Vector3()));
  const mixer = new THREE.AnimationMixer(source);
  const worldRotation = new Map<THREE.Object3D, THREE.Quaternion>();
  const rotation = new THREE.Quaternion();
  const position = new THREE.Vector3();

  const result = clips.map(clip => {
    const frames = Math.max(1, Math.ceil(clip.duration * 30));
    const times = Array.from({ length: frames + 1 }, (_, i) => i * clip.duration / frames);
    const rotations = new Map(bindings.map(({ bone }) => [bone, [] as number[]]));
    const hips: number[] = [];
    const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    for (const time of times) {
      mixer.setTime(time);
      source.updateMatrixWorld(true);
      worldRotation.set(target, new THREE.Quaternion());
      for (const node of targetNodes) {
        if (node === target) continue;
        const parentRotation = worldRotation.get(node.parent!)!;
        const binding = bindingByBone.get(node);
        if (binding) {
          binding.from.getWorldQuaternion(rotation).premultiply(sourceInverse);
          rotation.premultiply(alignment).multiply(binding.correction).normalize();
          worldRotation.set(node, rotation.clone());
          rotation.premultiply(parentRotation.clone().invert()).normalize();
          rotations.get(binding.bone)!.push(...rotation.toArray());
        } else {
          worldRotation.set(node, parentRotation.clone().multiply(restLocal.get(node)!));
        }
      }
      // The planet supplies forward movement. Keep only proportional hip bob,
      // in the target parent's axes, so the model never drifts away from its mount.
      source.worldToLocal(sourceHip.getWorldPosition(position));
      position.sub(sourceHipRest).applyQuaternion(alignment).multiplyScalar(hipScale);
      position.set(0, position.y, 0).applyQuaternion(targetParentInverse).divide(targetParentScale);
      position.add(targetHip.position);
      hips.push(...position.toArray());
    }
    action.stop();
    return new THREE.AnimationClip(clip.name, clip.duration, [
      ...bindings.map(({ bone }) => new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, rotations.get(bone)!)),
      new THREE.VectorKeyframeTrack(`${targetHip.name}.position`, times, hips),
    ]);
  });
  mixer.stopAllAction();
  mixer.uncacheRoot(source);
  return result;
}

export function createTravelerAnimationController(target: THREE.Object3D, source: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const walk = clips.find(clip => /^walk$/i.test(clip.name));
  const idle = clips.find(clip => /^idle$/i.test(clip.name));
  if (!walk || !idle) throw new Error('Mixamo library requires Walk and Idle clips');
  const [walkClip, idleClip] = retargetTravelerClips(target, source, [walk, idle]);
  const mixer = new THREE.AnimationMixer(target);
  const walkAction = mixer.clipAction(walkClip);
  const idleAction = mixer.clipAction(idleClip);
  let moving = false;
  let active = idleAction;
  active.play();
  mixer.update(0);
  return {
    update(dt: number, speed: number) {
      moving = Math.abs(speed) > (moving ? 0.005 : 0.02);
      const next = moving ? walkAction : idleAction;
      if (active !== next) {
        active.fadeOut(0.18);
        next.reset().stopFading().setEffectiveWeight(1).fadeIn(0.18).play();
        active = next;
      }
      active.setEffectiveTimeScale(moving ? THREE.MathUtils.clamp(Math.abs(speed), 0.65, 1.8) : 1);
      mixer.update(dt);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(target);
    },
  };
}
