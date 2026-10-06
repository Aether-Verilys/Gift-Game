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
  let sacredBaseTemplate: THREE.Object3D | null = null;
  let sacredBaseLoading = false;
  const sacredBaseWaiters: Array<{ monument: THREE.Group; statueAsset: string; statueFootprint: number }> = [];
  let sacredBaseDiameter = 1;
  let sacredBaseHeight = 0;
  const sculptures = new Map<string, THREE.Object3D>();
  const heights: Partial<Record<EncounterType, number>> = {};

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

  function loadTarotAsset(asset: string, ready: (model: THREE.Object3D) => void) {
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
      model.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });
      ready(model);
      loaded.add(asset);
    }, undefined, (error) => {
      pending.delete(asset);
      retryAfter.set(asset, Date.now() + 15000);
      if (!disposed) console.error(`Failed to load Tarot sculpture: ${asset}`, error);
    });
  }

  function load(type: EncounterType) {
    const asset = models[type];
    loadTarotAsset(asset, model => {
      options.applyOffering(model);
      const monument = byAsset.get(asset)!;
      sculptures.set(asset, model);

      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.z) * 0.56;
      monument.add(model);
      // The sacred P2 pedestal is loaded separately so a missing asset leaves
      // the encounter root empty at the base instead of allocating procedural
      // cylinders. The fitted pedestal lifts the statue to its actual top.
      for (const [alias, name] of Object.entries(models)) {
        if (name === asset) {
          clearRadius[alias as EncounterType] = radius / options.planetRadius + 0.1;
          heights[alias as EncounterType] = size.y + 2.5;
        }
      }
      attachSacredBase(monument, asset, Math.max(size.x, size.z));
    });
  }

  function expandClearRadius(statueAsset: string, baseRadius: number) {
    for (const [alias, name] of Object.entries(models)) {
      if (name === statueAsset) clearRadius[alias as EncounterType] = Math.max(
        clearRadius[alias as EncounterType] ?? 0,
        baseRadius / options.planetRadius + 0.1,
      );
    }
  }

  function addSacredBaseCopy(monument: THREE.Group, statueAsset: string, statueFootprint: number) {
    if (!sacredBaseTemplate) return;
    const copy = sacredBaseTemplate.clone(true);
    // Fit width/depth to 60% and height to 20% of the original fitted size.
    // Raise the sculpture to the actual top of its fitted pedestal.
    const originalDiameter = THREE.MathUtils.clamp(statueFootprint * 1.35, 12, 60);
    const originalScale = originalDiameter / sacredBaseDiameter;
    const targetDiameter = originalDiameter * 0.6;
    copy.scale.multiply(new THREE.Vector3(originalScale * 0.6, originalScale * 0.2, originalScale * 0.6));
    const baseHeight = sacredBaseHeight * originalScale * 0.2;
    // Bury the bottom tenth while keeping the lights above the surface.
    const burialDepth = baseHeight * 0.3;
    copy.position.y -= burialDepth;
    const baseTop = baseHeight - burialDepth;
    const sculpture = sculptures.get(statueAsset)!;
    sculpture.position.y += baseTop - 2.5;
    for (const [alias, name] of Object.entries(models)) {
      if (name === statueAsset) heights[alias as EncounterType] =
        (heights[alias as EncounterType] ?? 44.5) + baseTop - 2.5;
    }
    const baseAssembly = new THREE.Group();
    baseAssembly.name = 'sacred-base-assembly';
    baseAssembly.add(copy);
    const baseLightColors = [0xffd9a3, 0x9fcaff, 0xc4b5ff, 0xa8f0ff];
    copy.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const readableMaterials = sourceMaterials.map(source => {
        const material = source.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          material.color.lerp(new THREE.Color(0x9ca8c2), 0.42);
          material.emissive.set(0x263653);
          material.emissiveIntensity = 0.48;
          material.roughness = Math.min(material.roughness, 0.72);
          material.metalness = Math.min(material.metalness, 0.28);
        }
        return material;
      });
      object.material = Array.isArray(object.material) ? readableMaterials : readableMaterials[0];
    });
    // Local ring lights keep the wide pedestal readable even when the world
    // key light is grazing the planet surface. They follow the model instance
    // and do not allocate shadow maps.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const light = new THREE.PointLight(baseLightColors[i], 7.5, 22, 1.55);
      light.name = 'sacred-base-local-light';
      light.position.set(Math.cos(a) * targetDiameter * 0.34, 0.72, Math.sin(a) * targetDiameter * 0.34);
      light.castShadow = false;
      baseAssembly.add(light);
    }
    options.applyOffering(copy);
    monument.add(baseAssembly);
    expandClearRadius(statueAsset, targetDiameter * 0.56);
  }

  function attachSacredBase(monument: THREE.Group, statueAsset: string, statueFootprint: number) {
    if (sacredBaseTemplate) {
      addSacredBaseCopy(monument, statueAsset, statueFootprint);
      return;
    }
    sacredBaseWaiters.push({ monument, statueAsset, statueFootprint });
    if (sacredBaseLoading) return;
    sacredBaseLoading = true;
    loader.load(`${import.meta.env.BASE_URL}assets/ecology/sacred-colossus-base.glb`, gltf => {
      if (disposed) { disposeModel(gltf.scene); return; }
      const base = gltf.scene;
      base.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(base);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      // Normalize with a wrapper, retaining the GLB's authored transforms.
      const centered = new THREE.Group();
      centered.position.set(-center.x, -bounds.min.y, -center.z);
      centered.add(base);
      const normalized = new THREE.Group();
      normalized.add(centered);
      normalized.scale.setScalar(1 / Math.max(size.x, size.z, 0.001));
      base.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = true;
        object.receiveShadow = true;
      });
      sacredBaseTemplate = normalized;
      sacredBaseDiameter = 1;
      sacredBaseHeight = size.y / Math.max(size.x, size.z, 0.001);
      for (const waiter of sacredBaseWaiters.splice(0)) {
        addSacredBaseCopy(waiter.monument, waiter.statueAsset, waiter.statueFootprint);
      }
    }, undefined, error => {
      sacredBaseLoading = false;
      sacredBaseWaiters.length = 0;
      if (!disposed) console.error('Failed to load sacred colossus base', error);
    });
  }

  return {
    groups, clearRadius, heights, load,
    dispose() {
      disposed = true;
      byAsset.forEach(disposeModel);
      if (sacredBaseTemplate) disposeModel(sacredBaseTemplate);
    },
  };
}
