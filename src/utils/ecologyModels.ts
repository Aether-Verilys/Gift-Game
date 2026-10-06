import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface EcologyGroupReplacement {
  root: THREE.Group;
  /** Authored model base relative to the existing animated root. */
  baseY?: number;
}

/**
 * The moon GLB uses KHR_materials_unlit (MeshBasicMaterial). It can cast
 * shadows, but cannot receive them. Convert receivers to lit materials while
 * retaining the authored texture; castShadow/receiveShadow alone is not enough.
 */
export function makeShadowMaterial(source: THREE.Material): THREE.MeshStandardMaterial {
  const candidate = source as THREE.MeshStandardMaterial & THREE.MeshBasicMaterial;
  if (candidate.isMeshStandardMaterial) {
    return candidate.clone() as THREE.MeshStandardMaterial;
  }

  const material = new THREE.MeshStandardMaterial({
    color: candidate.color?.clone() ?? new THREE.Color(0xffffff),
    map: candidate.map ?? null,
    alphaMap: candidate.alphaMap ?? null,
    alphaTest: candidate.alphaTest,
    transparent: candidate.transparent,
    opacity: candidate.opacity,
    side: candidate.side,
    depthWrite: candidate.depthWrite,
    vertexColors: candidate.vertexColors,
    wireframe: candidate.wireframe,
    roughness: 1,
    metalness: 0,
  });
  material.name = `${source.name || 'ecology'}-shadow-pbr`;
  return material;
}

// The authored moon texture is intentionally high-key. Keep the texture
// detail intact and lower only its base-color contribution in the scene.
const WALKABLE_MOON_BASE_COLOR_FACTOR = 0.62;

/** Scene-owned resources: async completion after teardown is disposed immediately. */
export function createEcologyModels(time: { value: number }) {
  const loader = new GLTFLoader();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;
  const release = (root: THREE.Object3D) => root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) {
        value.dispose();
        if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) value.image.close();
      }
      material.dispose();
    }
  });
  function load(asset: string, height: number, width: number, sway: number, ready: (mesh: THREE.Mesh) => void) {
    loader.load(`${import.meta.env.BASE_URL}assets/ecology/${asset}.glb`, gltf => {
      if (disposed) { release(gltf.scene); return; }
      gltf.scene.updateMatrixWorld(true);
      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
      // Prepared P2 assets contain one primitive; reject unexpected exports.
      if (meshes.length !== 1 || Array.isArray(meshes[0].material)) {
        release(gltf.scene);
        console.error(`Unexpected ecology mesh layout: ${asset}`);
        return;
      }
      const source = meshes[0];
      const geometry = source.geometry;
      geometry.applyMatrix4(source.matrixWorld);
      if (asset === 'bird') geometry.rotateY(Math.PI / 2); // verified beak points -X; map head to flight-local +Z, wings to X
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = Math.min(height / size.y, width / Math.max(size.x, size.z));
      geometry.translate(-center.x, -box.min.y, -center.z);
      geometry.scale(scale, scale, scale);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const material = makeShadowMaterial(source.material as THREE.Material);
      material.roughness = Math.max(material.roughness, 0.65);
      material.metalness = Math.min(material.metalness, 0.3);
      if (asset === 'planet') {
        material.emissive.set(0xffffff);
        material.emissiveMap = material.map;
        material.emissiveIntensity = 0.18;
      }
      if (sway > 0) {
        // Inflate the CPU culling bounds to include GPU-displaced leaf tips.
        geometry.boundingSphere!.radius += sway * 1.6;
        material.onBeforeCompile = shader => {
          shader.uniforms.uEcologyTime = time;
          shader.vertexShader = `uniform float uEcologyTime;
${shader.vertexShader}`.replace('#include <begin_vertex>', `
            #include <begin_vertex>
            float ecologyPhase = 0.0;
            #ifdef USE_INSTANCING
              ecologyPhase = dot(instanceMatrix[3].xyz, vec3(0.37, 0.71, 0.53));
            #endif
            float ecologyHeight = clamp(position.y / ${Math.max(size.y * scale, 0.01).toFixed(5)}, 0.0, 1.0);
            float wind = sin(uEcologyTime * 1.8 + ecologyPhase) + 0.35 * sin(uEcologyTime * 3.3 + ecologyPhase * 1.7);
            float bend = ecologyHeight * ecologyHeight;
            transformed.x += wind * ${sway.toFixed(5)} * bend;
            transformed.z += cos(uEcologyTime * 1.3 + ecologyPhase) * ${ (sway * 0.65).toFixed(5)} * bend;
            transformed.y += sin(uEcologyTime * 2.2 + ecologyPhase) * ${ (sway * 0.12).toFixed(5)} * bend;
          `);
        };
        material.customProgramCacheKey = () => `ecology-${asset}-wind`;
      }
      geometries.add(geometry);
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      const model = new THREE.Mesh(geometry, material);
      model.name = `tripo-${asset}`;
      model.castShadow = true;
      model.receiveShadow = true;
      ready(model);
    }, undefined, error => {
      if (!disposed) console.error(`Failed to load ecology asset ${asset}`, error);
    });
  }
  function replaceGroups(targets: EcologyGroupReplacement[], asset: string, height: number, width: number) {
    if (!targets.length) return;
    load(asset, height, width, 0, model => {
      for (const { root, baseY = 0 } of targets) {
        const copy = model.clone();
        copy.castShadow = true;
        copy.receiveShadow = true;
        copy.position.y = baseY;
        root.add(copy);
        root.name = `tripo-${asset}-root`;
      }
    });
  }
  return {
    load,
    replaceGroups,
    replacePlanet(root: THREE.Group) {
      load('planet', 60, 76, 0, model => {
        model.geometry.computeBoundingBox();
        const center = model.geometry.boundingBox!.getCenter(new THREE.Vector3());
        model.geometry.translate(0, -center.y, 0);
        root.add(model);
      });
    },
    /**
     * Add the larger half-moon asset as a separate background world. Flatten
     * the imported hierarchy so the caller can place and rotate one stable
     * group while retaining every authored mesh and material.
     */
    replaceHalfMoon(root: THREE.Group, diameter = 34) {
      loader.load(`${import.meta.env.BASE_URL}assets/planet/half_moon.glb`, gltf => {
        if (disposed) {
          release(gltf.scene);
          return;
        }

        gltf.scene.updateMatrixWorld(true);
        const imported = new THREE.Group();
        imported.name = 'external-half-moon';

        gltf.scene.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          const geometry = object.geometry.clone();
          geometry.applyMatrix4(object.matrixWorld);
          const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
          const litMaterials = sourceMaterials.map(sourceMaterial => makeShadowMaterial(sourceMaterial));
          const material = litMaterials.length === 1 ? litMaterials[0] : litMaterials;
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = object.name || 'external-half-moon-mesh';
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          imported.add(mesh);

          geometries.add(geometry);
          const materialList = Array.isArray(material) ? material : [material];
          materialList.forEach(item => {
            materials.add(item);
            for (const value of Object.values(item)) {
              if (value instanceof THREE.Texture) textures.add(value);
            }
          });
        });

        if (!imported.children.length) {
          console.error('Half-moon asset contains no meshes.');
          return;
        }

        imported.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(imported);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const sourceDiameter = Math.max(size.x, size.y, size.z);
        const fitScale = sourceDiameter > 0 ? diameter / sourceDiameter : 1;
        imported.position.set(-center.x * fitScale, -center.y * fitScale, -center.z * fitScale);
        imported.scale.setScalar(fitScale);
        imported.updateMatrixWorld(true);
        root.add(imported);
      }, undefined, error => {
        if (!disposed) console.error('Failed to load half-moon background asset', error);
      });
    },
    /**
     * Replace the procedural walkable sphere with the supplied moon asset.
     * The Sketchfab export contains a hierarchy with two mesh primitives, so
     * flatten it into one scene-local group before fitting it to the game's
     * planet radius. This keeps the imported model's authored materials while
     * making its origin and scale predictable for the existing surface roots.
     */
    replaceWalkablePlanet(root: THREE.Group, radius: number) {
      loader.load(`${import.meta.env.BASE_URL}assets/planet/moon.glb`, gltf => {
        if (disposed) {
          release(gltf.scene);
          return;
        }

        gltf.scene.updateMatrixWorld(true);
        const imported = new THREE.Group();
        imported.name = 'external-moon-planet';

        gltf.scene.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          const geometry = object.geometry.clone();
          geometry.applyMatrix4(object.matrixWorld);
          geometry.computeBoundingBox();
          geometry.computeBoundingSphere();

          const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
          // The ground itself must receive shadows. A clone preserves the
          // moon's unlit material and silently ignores receiveShadow, leaving
          // every prop's shadow invisible on the planet surface.
          const litMaterials = sourceMaterials.map(sourceMaterial => {
            const lit = makeShadowMaterial(sourceMaterial);
            lit.color.multiplyScalar(WALKABLE_MOON_BASE_COLOR_FACTOR);
            return lit;
          });
          const material = litMaterials.length === 1 ? litMaterials[0] : litMaterials;
          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = object.name || 'external-moon-mesh';
          // The planet is the receiver. Letting the enormous curved shell cast
          // into its own shadow map creates self-shadow acne as it rotates and
          // is the main source of the visible shimmer.
          mesh.castShadow = false;
          mesh.receiveShadow = true;
          imported.add(mesh);

          geometries.add(geometry);
          const materialList = Array.isArray(material) ? material : [material];
          materialList.forEach(item => {
            materials.add(item);
            for (const value of Object.values(item)) {
              if (value instanceof THREE.Texture) textures.add(value);
            }
          });
        });

        if (!imported.children.length) {
          console.error('External moon asset contains no meshes.');
          return;
        }

        imported.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(imported);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const diameter = Math.max(size.x, size.y, size.z);
        const fitScale = diameter > 0 ? (radius * 2) / diameter : 1;
        imported.position.set(-center.x * fitScale, -center.y * fitScale, -center.z * fitScale);
        imported.scale.setScalar(fitScale);
        imported.updateMatrixWorld(true);
        root.add(imported);
      }, undefined, error => {
        if (!disposed) console.error('Failed to load external moon planet', error);
      });
    },
    replaceBirds(birds: Array<{ group: THREE.Group; model?: THREE.Mesh }>) {
      load('bird', 1.2, 2.1, 0, model => {
        const geometry = model.geometry;
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        geometry.translate(0, -box.getCenter(new THREE.Vector3()).y, 0);
        const positions = geometry.getAttribute('position');
        const flap = new Float32Array(positions.count * 3);
        // A continuous wing bend keeps the torso stable without requiring a rig.
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const span = Math.max(0, Math.abs(x) - 0.16);
          flap[i * 3] = -Math.sign(x) * span * 0.18;
          flap[i * 3 + 1] = span * 0.65;
        }
        geometry.morphAttributes.position = [new THREE.BufferAttribute(flap, 3)];
        geometry.morphTargetsRelative = true;
        geometry.computeBoundingSphere();
        geometry.boundingSphere!.radius += 0.7;
        for (const bird of birds) {
          const copy = new THREE.Mesh(geometry, model.material);
          copy.name = 'tripo-bird';
          bird.model = copy;
          bird.group.add(copy);
        }
      });
    },
    replaceArches(roots: THREE.Group[]) {
      replaceGroups(roots.map(root => ({ root })), 'broken-arch', 5.2, 5.0);
    },
    dispose() {
      disposed = true;
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => {
        t.dispose();
        if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) t.image.close();
      });
    },
  };
}
