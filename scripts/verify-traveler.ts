// Run with: npx tsx scripts/verify-traveler.ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createTravelerAnimationController, retargetTravelerClips } from '../src/utils/travelerAnimationController';

async function loadAsset(path: string) {
  const bytes = await readFile(new URL(path, import.meta.url));
  // Geometry and skinning run on the CPU; textures are irrelevant to this check.
  const loader = new GLTFLoader().register(() => ({
    name: 'CPU_MATERIAL',
    loadMaterial: async () => new THREE.MeshBasicMaterial(),
  }));
  return loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}

const target = await loadAsset('../public/assets/traveler.glb');
const source = await loadAsset('../public/assets/traveler/Soldier.glb');
const bones: THREE.Bone[] = [];
target.scene.traverse(node => { if (node instanceof THREE.Bone) bones.push(node); });
const rest = new Map(bones.map(bone => [bone, {
  position: bone.position.clone(), scale: bone.scale.clone(), quaternion: bone.quaternion.clone(),
}]));
const clips = retargetTravelerClips(target.scene, source.scene,
  source.animations.filter(clip => /^(Walk|Idle|TPose)$/.test(clip.name)));
assert.equal(clips.length, 3);
for (const clip of clips) {
  const mixer = new THREE.AnimationMixer(target.scene);
  mixer.clipAction(clip).play();
  for (let frame = 0; frame <= 30; frame++) {
    mixer.setTime(frame * clip.duration / 30);
    target.scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(target.scene, true);
    assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite), `${clip.name}: invalid skinned vertex`);
    const size = box.getSize(new THREE.Vector3());
    assert(size.y > 0.8 && size.y < 1.2, `${clip.name}: wrong height ${size.y}`);
    assert(size.x < 1.1 && size.z < 0.8, `${clip.name}: stretched mesh`);
    assert(box.min.y > -0.04 && box.min.y < 0.05, `${clip.name}: feet leave the ground`);
    for (const bone of bones) {
      const initial = rest.get(bone)!;
      assert(bone.scale.equals(initial.scale), `${bone.name}: scale changed`);
      if (bone.name.endsWith('Hips')) {
        assert(Math.abs(bone.position.x - Math.fround(initial.position.x)) < 1e-7, `${bone.name}: hips drift on X`);
        assert(Math.abs(bone.position.z - Math.fround(initial.position.z)) < 1e-7, `${bone.name}: hips drift on Z`);
      } else {
        assert(bone.position.equals(initial.position), `${bone.name}: bone length changed`);
      }
      if (clip.name === 'TPose') {
        assert(bone.quaternion.clone().normalize().angleTo(initial.quaternion.clone().normalize()) < 0.01,
          `${bone.name}: bind rotation was not preserved`);
      }
    }
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(target.scene);
  console.log(`${clip.name}: finite vertices, correct size, grounded feet, preserved bone lengths`);
}

const mount = new THREE.Group();
mount.rotation.y = Math.PI;
mount.scale.setScalar(2.15);
mount.add(target.scene);
const controller = createTravelerAnimationController(target.scene, source.scene, source.animations);
for (let frame = 0; frame < 180; frame++) {
  controller.update(frame === 0 ? 0 : 1 / 60, Math.floor(frame / 30) % 2);
  mount.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mount, true);
  assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
  const height = box.getSize(new THREE.Vector3()).y;
  assert(height > 1.7 && height < 2.5, `Transition changed height to ${height}`);
}
controller.dispose();
console.log('Rotated/scaled mount, zero delta, and repeated Walk/Idle transitions passed.');
