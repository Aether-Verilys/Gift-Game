import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EncounterData } from '../types';

type EncounterType = EncounterData['type'];
const models: Record<EncounterType, string> = {
  seedling: 'fool', priestess: 'high_priestess', emperor: 'emperor',
  hierophant: 'hierophant', twin_core: 'lovers', chariot: 'chariot',
  lantern: 'hermit', astrolabe: 'wheel_of_fortune', prism: 'tower',
  spring: 'star', sun: 'sun', gateway: 'world',
  beacon: 'tower', monolith: 'high_priestess',
};

/** Each scene owns its loaded resources, including loads completed after teardown. */
function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => {
    texture.dispose();
    const image = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
  });
}

/** Load the prepared sculptures on demand, keeping their authored PBR materials. */
export function createTarotEntities(options: {
  planetRadius: number;
  applyOffering: (model: THREE.Object3D) => void;
}) {
  const loader = new GLTFLoader();
  const groups = {} as Record<EncounterType, THREE.Group>;
  const clearRadius: Partial<Record<EncounterType, number>> = {};
  const pending = new Set<string>();
  const loaded = new Set<string>();
  const retryAfter = new Map<string, number>();
  let disposed = false;

  // Legacy encounter types share the same sculpture and GPU resources.
  const byAsset = new Map<string, THREE.Group>();
  for (const [type, asset] of Object.entries(models)) {
    let group = byAsset.get(asset);
    if (!group) {
      group = new THREE.Group();
      group.name = `tarot-${asset}`;
      group.visible = false;
      byAsset.set(asset, group);
    }
    groups[type as EncounterType] = group;
  }

  function load(type: EncounterType) {
    const asset = models[type];
    if (disposed || pending.has(asset) || loaded.has(asset) || Date.now() < (retryAfter.get(asset) ?? 0)) return;
    pending.add(asset);
    loader.load(`${import.meta.env.BASE_URL}assets/tarot/${asset}.glb`, (gltf) => {
      pending.delete(asset);
      const model = gltf.scene;
      if (disposed) { disposeModel(model); return; }
      // Turn the authored +X front toward the visitors and camera on +Z.
      model.rotateY(-Math.PI / 2);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = Math.min(42 / size.y, 48 / Math.max(size.x, size.z));
      model.scale.multiplyScalar(scale);
      // GLBs are centered at the origin; put their lowest point on the plinth.
      model.position.add(new THREE.Vector3(-center.x * scale, 2.5 - bounds.min.y * scale, -center.z * scale));
      options.applyOffering(model);
      const monument = byAsset.get(asset)!;
      monument.add(model);

      const radius = Math.max(size.x, size.z) * scale * 0.56;
      const stone = new THREE.MeshStandardMaterial({ color: 0x202632, roughness: 0.86, metalness: 0.18 });
      const trim = new THREE.MeshStandardMaterial({ color: 0x9e8c68, roughness: 0.5, metalness: 0.6 });
      // The buried footing reaches below the spherical ground at its outer rim.
      const depth = 1.4 + radius * radius / options.planetRadius;
      for (const [top, bottom, height, y, material] of [
        [radius, radius * 1.04, depth, 0.65 - depth / 2, stone],
        [radius * 0.94, radius, 1.3, 1.3, stone],
        [radius * 0.94, radius * 0.94, 0.16, 2.03, trim],
        [radius * 0.9, radius * 0.94, 0.39, 2.305, stone],
      ] as const) {
        const step = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 64), material);
        step.position.y = y;
        monument.add(step);
      }
      for (const [alias, name] of Object.entries(models)) {
        if (name === asset) clearRadius[alias as EncounterType] = radius * 1.04 / options.planetRadius + 0.1;
      }
      loaded.add(asset);
    }, undefined, (error) => {
      pending.delete(asset);
      retryAfter.set(asset, Date.now() + 15000);
      if (!disposed) console.error(`Failed to load Tarot sculpture: ${asset}`, error);
    });
  }

  return {
    groups, clearRadius, load,
    dispose() {
      disposed = true;
      byAsset.forEach(disposeModel);
    },
  };
}
