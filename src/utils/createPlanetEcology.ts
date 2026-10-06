import * as THREE from 'three';
import { createEcologyModels, type EcologyGroupReplacement } from './ecologyModels';
import { sampleBirdFlight, type BirdFlightPattern } from './birdFlight';

/**
 * Planet ecology: rocks, luminous flora, ruins, drifting
 * spores and a few birds flying close to the planet surface.
 *
 * Flora and rocks use InstancedMeshes, including the prepared Tripo P2
 * replacements with authored PBR textures and GPU wind sway. Plants cost
 * a handful of draw calls. Everything on the surface lives in planet-local
 * space and is placed with the same (angle, latitude) convention as the
 * existing landmarks: rotation.x = angle along the walking meridian,
 * rotation.z = latitude away from it.
 */
export interface PlanetEcology {
  surface: THREE.Group; // add to the rotating planet group
  sky: THREE.Group; // add to the scene
  /** Clear a circle around the standing colossus (planet-local angle, radius in radians). */
  setClearing: (angle: number | null, radius: number) => void;
  update: (dt: number, elapsed: number) => void;
  setPixelRatio: (ratio: number) => void;
  dispose: () => void;
}

// Deterministic layout so the planet looks the same every session.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const wrapAngle = (a: number) => THREE.MathUtils.euclideanModulo(a + Math.PI, TAU) - Math.PI;

// Spores rise from the glowing flora, fade, and respawn — all on the GPU.
const sporeVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aPhase;
attribute float aSpeed;
varying float vAlpha;
void main() {
  float life = fract(uTime * aSpeed + aPhase);
  vec3 up = normalize(position);
  vec3 side = normalize(cross(up, vec3(1.0, 0.0, 0.0)) + 1e-4);
  vec3 p = position + up * life * 3.2 + side * sin(uTime * 0.9 + aPhase * 12.0) * 0.45;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.6, 1.0, life));
  gl_PointSize = (9.0 + 5.0 * sin(aPhase * 40.0)) * uPixelRatio * (12.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const sporeFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha;
  gl_FragColor = vec4(uColor * (0.6 + a), a);
  #include <colorspace_fragment>
}
`;

export function createPlanetEcology(
  planetRadius: number,
  pixelRatio: number,
  landmarks: {
    crystalSpires: THREE.Group[];
    surfaceMonoliths?: EcologyGroupReplacement[];
    impactCraters?: EcologyGroupReplacement[];
    starBeacons?: EcologyGroupReplacement[];
    standingStoneRings?: EcologyGroupReplacement[];
    ruinedStairs?: EcologyGroupReplacement[];
  } = { crystalSpires: [] },
): PlanetEcology {
  const rand = mulberry32(20261005);
  const range = (a: number, b: number) => a + rand() * (b - a);
  const side = () => (rand() < 0.5 ? -1 : 1);

  const surface = new THREE.Group();
  const sky = new THREE.Group();
  const timeUniform = { value: 0 };
  const models = createEcologyModels(timeUniform);

  models.replaceGroups(landmarks.crystalSpires.map(root => ({
    root, baseY: -1.25,
  })), 'crystal-spire', 2.5, 1.4);
  models.replaceGroups(landmarks.surfaceMonoliths ?? [], 'surface-monolith', 3.2, 1.2);
  models.replaceGroups(landmarks.impactCraters ?? [], 'impact-crater', 0.8, 2.8);
  models.replaceGroups(landmarks.starBeacons ?? [], 'star-beacon', 2.2, 1.1);

  // ---- Clearing bookkeeping -------------------------------------------------
  interface Placed {
    angle: number;
    lat: number;
    presence: number;
    target: number;
    apply: (presence: number) => void;
  }
  const placed: Placed[] = [];
  const dirtyMeshes = new Set<THREE.InstancedMesh>();
  const dummy = new THREE.Object3D();
  const placeMatrix = (angle: number, lat: number, yaw: number, scale: THREE.Vector3, sink = 0, tilt = 0) => {
    // Same convention as the landmarks: Rx(angle) * Rz(lat) * T(0, R, 0).
    const m = new THREE.Matrix4().makeRotationX(angle);
    m.multiply(new THREE.Matrix4().makeRotationZ(lat));
    m.multiply(new THREE.Matrix4().makeTranslation(0, planetRadius - sink, 0));
    dummy.rotation.set(tilt, yaw, tilt * 0.6);
    dummy.scale.copy(scale);
    dummy.position.set(0, 0, 0);
    dummy.updateMatrix();
    return m.multiply(dummy.matrix);
  };

  const instanced = (
    asset: string, height: number, width: number, sway: number,
    spots: Array<{ angle: number; lat: number; yaw: number; scale: THREE.Vector3; sink?: number; tilt?: number }>
  ) => {
    let mesh: THREE.InstancedMesh | null = null;
    const matrices: THREE.Matrix4[] = [];
    const shrink = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    spots.forEach((s, i) => {
      const base = placeMatrix(s.angle, s.lat, s.yaw, s.scale, s.sink, s.tilt);
      matrices.push(base.clone());
      placed.push({
        angle: s.angle,
        lat: s.lat,
        presence: 1,
        target: 1,
        apply: (p) => {
          const k = Math.max(p, 1e-4);
          // Sink into the ground as it shrinks, so plants retreat rather than pop.
          shrink.makeScale(k, k, k).setPosition(0, (p - 1) * 1.2, 0);
          matrices[i].copy(tmp.multiplyMatrices(base, shrink));
          if (mesh) {
            mesh.setMatrixAt(i, matrices[i]);
            dirtyMeshes.add(mesh);
          }
        },
      });
    });
    models.load(asset, height, width, sway, model => {
      mesh = new THREE.InstancedMesh(model.geometry, model.material, spots.length);
      mesh.name = model.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      matrices.forEach((matrix, i) => mesh!.setMatrixAt(i, matrix));
      mesh.instanceMatrix.needsUpdate = true;
      surface.add(mesh);
    });
  };

  // Scatter helper: pick a spot along the lap, kept off the walking path.
  const spot = (minLat: number, maxLat: number, scaleMin: number, scaleMax: number, squash = 1) => {
    const s = range(scaleMin, scaleMax);
    return {
      angle: rand() * TAU,
      lat: side() * range(minLat, maxLat),
      yaw: rand() * TAU,
      scale: new THREE.Vector3(s, s * squash, s),
    };
  };
  // Clusters read as natural groves instead of uniform noise.
  const cluster = (count: number, spread: number, minLat: number, maxLat: number, scaleMin: number, scaleMax: number) => {
    const out: ReturnType<typeof spot>[] = [];
    const sites = Math.ceil(count / 4);
    for (let c = 0; c < sites; c++) {
      const angle = rand() * TAU;
      const lat = side() * range(minLat, maxLat);
      const n = Math.min(4 + Math.floor(rand() * 3), count - out.length);
      for (let k = 0; k < n; k++) {
        const s = range(scaleMin, scaleMax);
        out.push({
          angle: angle + range(-spread, spread),
          lat: lat + range(-spread, spread) * 0.8,
          yaw: rand() * TAU,
          scale: new THREE.Vector3(s, s, s),
        });
      }
    }
    return out;
  };

  // Register placement and clearing immediately; allocate meshes only when GLBs arrive.
  instanced('moon-rock', 2, 2, 0,
    [...cluster(40, 0.05, 0.1, 0.6, 0.25, 1.1), ...Array.from({ length: 16 }, () => spot(0.12, 0.6, 0.6, 1.8, 0.7))].map((s) => ({
      ...s,
      scale: s.scale.clone().multiply(new THREE.Vector3(1, range(0.45, 0.8), range(0.7, 1))),
      sink: 0.15,
      tilt: range(-0.3, 0.3),
    }))
  );
  instanced('mushroom', 1.3, 0.95, 0.12, cluster(84, 0.03, 0.08, 0.5, 0.6, 2.4));
  instanced('crystal-reeds', 2.6, 1.1, 0.32, cluster(60, 0.04, 0.09, 0.55, 0.7, 1.5));
  instanced('spiral-fern', 1.6, 1.9, 0.26, cluster(56, 0.05, 0.07, 0.5, 0.7, 1.4));
  instanced('lantern-plant', 3.2, 1.4, 0.30, Array.from({ length: 34 }, () => spot(0.13, 0.5, 0.8, 1.5)));
  instanced('silver-grass', 0.7, 0.85, 0.16,
    [...cluster(160, 0.04, 0.05, 0.4, 0.8, 1.6), ...Array.from({ length: 120 }, () => spot(0.05, 0.6, 0.7, 1.5))]
  );

  // ---- Ruins ---------------------------------------------------------------
  // Every static ruin slot is an empty placement root. Authored P2 meshes are
  // attached asynchronously; no procedural replacement geometry or material
  // is allocated while a model is loading or if a load fails.
  const ruinBuilders: Array<() => THREE.Group> = [
    // Imported asset is attached to this empty placement root.
    () => new THREE.Group(),
    // Imported asset is attached to this empty placement root.
    () => new THREE.Group(),
    // Ring of standing stones is supplied by the authored P2 replacement.
    () => new THREE.Group(),
    // Imported asset is attached to this empty placement root.
    () => new THREE.Group(),
    // Stair fragment is supplied by the authored P2 replacement.
    () => new THREE.Group(),
    // Imported asset is attached to this empty placement root.
    () => new THREE.Group(),
    // The final slot is an empty placement root until the authored toppled-statue
    // GLB arrives; a failed load leaves it empty without procedural fallback meshes.
    () => new THREE.Group(),
  ];
  const archRoots: THREE.Group[] = [];
  const colonnades: EcologyGroupReplacement[] = [];
  const astrolabes: EcologyGroupReplacement[] = [];
  const obelisks: EcologyGroupReplacement[] = [];
  const standingStoneRings: EcologyGroupReplacement[] = [];
  const ruinedStairs: EcologyGroupReplacement[] = [];
  const toppledStatues: EcologyGroupReplacement[] = [];
  const ruinCount = 16;
  for (let i = 0; i < ruinCount; i++) {
    const ruin = ruinBuilders[i % ruinBuilders.length]();
    if (i % ruinBuilders.length === 1) archRoots.push(ruin);
    if (i % ruinBuilders.length === 0) colonnades.push({ root: ruin });
    if (i % ruinBuilders.length === 3) astrolabes.push({ root: ruin, baseY: -0.45 });
    if (i % ruinBuilders.length === 5) obelisks.push({ root: ruin });
    if (i % ruinBuilders.length === 2) standingStoneRings.push({ root: ruin });
    if (i % ruinBuilders.length === 4) ruinedStairs.push({ root: ruin });
    if (i % ruinBuilders.length === 6) toppledStatues.push({ root: ruin });
    const angle = (i / ruinCount) * TAU + range(-0.12, 0.12);
    const lat = side() * range(0.17, 0.5);
    const scale = range(0.9, 1.6);
    const wrapper = new THREE.Group();
    wrapper.rotation.z = lat;
    wrapper.rotation.x = angle;
    ruin.position.y = planetRadius - 0.15;
    ruin.rotation.y = rand() * TAU;
    ruin.scale.setScalar(scale);
    wrapper.add(ruin);
    surface.add(wrapper);
    placed.push({
      angle,
      lat,
      presence: 1,
      target: 1,
      apply: (p) => {
        ruin.visible = p > 0.01;
        ruin.position.y = planetRadius - 0.15 - (1 - p) * 6 * scale;
      },
    });
  }

  models.replaceArches(archRoots);
  models.replaceGroups(colonnades, 'broken-colonnade', 4.5, 6.2);
  models.replaceGroups(astrolabes, 'ancient-astrolabe', 4.0, 4.8);
  models.replaceGroups(obelisks, 'weathered-obelisk', 5.8, 1.8);
  models.replaceGroups(standingStoneRings, 'standing-stone-ring', 2.8, 5.6);
  models.replaceGroups(ruinedStairs, 'ruined-stair', 3.0, 3.8);
  models.replaceGroups(toppledStatues, 'toppled-statue', 3.4, 3.2);

  // ---- Spores drifting up from the glowing groves ----------------------------
  const sporeCount = 360;
  const sporePos = new Float32Array(sporeCount * 3);
  const sporePhase = new Float32Array(sporeCount);
  const sporeSpeed = new Float32Array(sporeCount);
  const v = new THREE.Vector3();
  for (let i = 0; i < sporeCount; i++) {
    const angle = rand() * TAU;
    const lat = side() * range(0.06, 0.55);
    v.set(0, planetRadius + range(0.1, 1.2), 0)
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), lat)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), angle);
    sporePos.set([v.x, v.y, v.z], i * 3);
    sporePhase[i] = rand();
    sporeSpeed[i] = range(0.05, 0.14);
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  sporeGeo.setAttribute('aPhase', new THREE.BufferAttribute(sporePhase, 1));
  sporeGeo.setAttribute('aSpeed', new THREE.BufferAttribute(sporeSpeed, 1));
  const sporeUniforms = {
    uTime: timeUniform,
    uPixelRatio: { value: pixelRatio },
    uColor: { value: new THREE.Color(0x8ff5e0) },
  };
  const spores = new THREE.Points(
    sporeGeo,
    new THREE.ShaderMaterial({
      vertexShader: sporeVertex,
      fragmentShader: sporeFragment,
      uniforms: sporeUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  spores.name = 'planet-spores';
  spores.frustumCulled = false;
  surface.add(spores);

  // ---- Birds -----------------------------------------------------------------
  interface Bird {
    group: THREE.Group;
    model?: THREE.Mesh;
    offset: THREE.Vector3;
    phase: number;
    flight: BirdFlightPattern;
  }
  interface Flock {
    birds: Bird[];
    center: THREE.Vector3;
    radiusX: number;
    radiusZ: number;
    speed: number;
    t: number;
    bob: number;
    latitude: number;
    orbitRadius: number;
  }
  const flocks: Flock[] = [];
  // Keep the sky population sparse: one independently flying group of 1–3
  // birds, hugging a randomized latitude just above the planet surface.
  // The visible walking area is the upper cap of the sphere (around the
  // apex). Keep the flight circle on that cap so birds do not disappear
  // behind the planet on the far/lower hemisphere.
  // Keep the flock close enough to the walking cap to feel part of the world,
  // but high enough to stay above the planet silhouette in the gameplay camera.
  // With the new radius-70 planet, a 2.2-unit clearance put the birds at about
  // y = -0.7, inside the camera's foreground surface and effectively invisible.
  const flightRadius = Math.min(16, planetRadius * 0.23);
  const birdClearance = 6.5;
  const flightHeight = -planetRadius + Math.sqrt(Math.max(0, planetRadius * planetRadius - flightRadius * flightRadius)) + birdClearance;
  const flockSpecs = [{
    center: new THREE.Vector3(0, flightHeight, 0),
    rx: flightRadius,
    rz: flightRadius,
    // Double the orbital pace so the birds visibly cross the sky more often.
    speed: (0.035 + rand() * 0.025) * 4 * (rand() > 0.5 ? 1 : -1),
    count: 1 + Math.floor(rand() * 3),
    latitude: (rand() - 0.5) * 0.08,
  }];
  for (const spec of flockSpecs) {
    for (let i = 0; i < spec.count; i++) {
      const group = new THREE.Group();
      // The authored GLB is normalized to a 2.1-unit wingspan. Keep the
      // in-scene silhouette close to the original procedural birds.
      group.scale.setScalar(range(0.45, 0.65) * 0.25);
      sky.add(group);
      // Every bird gets its own latitude, phase and pace so the small count
      // reads as individual wildlife rather than a formation.
      const phase = rand() * TAU;
      const bird: Bird = {
        group, offset: new THREE.Vector3(), phase,
        flight: {
          flapDuration: range(2.2, 3.0),
          glideDuration: range(3.8, 5.6),
          climbHeight: range(0.65, 1.05),
          phaseOffset: range(0, 7),
          wingPhase: phase,
        },
      };
      flocks.push({
        birds: [bird],
        center: spec.center,
        radiusX: spec.rx,
        radiusZ: spec.rz,
        speed: spec.speed * range(0.78, 1.18),
        t: rand() * TAU,
        bob: rand() * TAU,
        latitude: spec.latitude + range(-0.03, 0.03),
        orbitRadius: spec.rx + range(-0.5, 1.5),
      });
    }
  }
  models.replaceBirds(flocks.flatMap(flock => flock.birds));
  const flockPos = new THREE.Vector3();
  const flockAhead = new THREE.Vector3();
  const flockBasis = new THREE.Matrix4();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const flockForward = new THREE.Vector3();
  const flockRight = new THREE.Vector3();
  const birdOffset = new THREE.Vector3();
  const birdTarget = new THREE.Vector3();
  const flightUp = new THREE.Vector3();
  const flockPoint = (f: Flock, t: number, out: THREE.Vector3) => {
    const latitude = f.latitude;
    const cosLat = Math.cos(latitude);
    out.set(
      f.center.x + Math.cos(t) * cosLat * f.orbitRadius,
      f.center.y,
      f.center.z + Math.sin(t) * cosLat * f.orbitRadius,
    );
    // Follow the curved ground with a safe baseline; the flight cycle adds lift.
    out.y = -planetRadius + Math.sqrt(Math.max(0, planetRadius * planetRadius - out.x * out.x - out.z * out.z)) + birdClearance;
  };

  // ---- Public API --------------------------------------------------------------
  let clearAngle: number | null = null;
  let clearRadius = 0;
  const setClearing = (angle: number | null, radius: number) => {
    if (angle === clearAngle && radius === clearRadius) return;
    clearAngle = angle;
    clearRadius = radius;
    for (const item of placed) {
      if (angle === null) {
        item.target = 1;
      } else {
        const dA = wrapAngle(item.angle - angle);
        item.target = Math.hypot(dA, item.lat) < radius ? 0 : 1;
      }
    }
  };

  const update = (dt: number, elapsed: number) => {
    timeUniform.value = elapsed;

    for (const item of placed) {
      if (item.presence === item.target) continue;
      const step = dt * 1.4;
      item.presence = item.target > item.presence
        ? Math.min(item.target, item.presence + step)
        : Math.max(item.target, item.presence - step);
      item.apply(THREE.MathUtils.smoothstep(item.presence, 0, 1));
    }
    dirtyMeshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
    dirtyMeshes.clear();

    for (const f of flocks) {
      f.t += f.speed * dt;
      const lookAheadSeconds = 1 / 60;
      for (const b of f.birds) {
        const motion = sampleBirdFlight(elapsed, b.flight);
        const ahead = sampleBirdFlight(elapsed + lookAheadSeconds, b.flight);
        flockPoint(f, f.t, flockPos);
        flockPoint(f, f.t + f.speed * lookAheadSeconds, flockAhead);
        flockPos.y += motion.altitude;
        flockAhead.y += ahead.altitude;
        // Heading follows the climbing/descending path, excluding wingbeat jitter.
        flockForward.subVectors(flockAhead, flockPos).normalize();
        flockRight.crossVectors(worldUp, flockForward).normalize();
        flightUp.crossVectors(flockForward, flockRight).normalize();
        flockBasis.makeBasis(flockRight, flightUp, flockForward);
        birdOffset.copy(b.offset).applyMatrix4(flockBasis);
        b.group.position.copy(flockPos).sub(birdOffset);
        b.group.position.addScaledVector(flightUp, motion.bodyLift);
        birdTarget.copy(b.group.position).add(flockForward);
        b.group.lookAt(birdTarget);
        const flap = motion.flap;
        if (b.model?.morphTargetInfluences) b.model.morphTargetInfluences[0] = flap;
        // Bank around the local forward axis; editing Euler z can change heading.
        b.group.rotateZ(Math.sin(elapsed * 0.5 + b.phase) * 0.12);
      }
    }
  };

  return {
    surface,
    sky,
    dispose: () => models.dispose(),
    setClearing,
    update,
    setPixelRatio: (ratio) => {
      sporeUniforms.uPixelRatio.value = ratio;
    },
  };
}
