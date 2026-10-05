import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Planet ecology: rocks, luminous flora, ruins, drifting
 * spores and flocks of birds.
 *
 * Flora and rocks are InstancedMeshes sharing one rim-light shader
 * (wind sway + bioluminescent pulse on the GPU), so hundreds of plants cost
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

// ---------------------------------------------------------------------------
// Flora shader: rim-lit silhouettes that match the line-art traveler, with
// height-weighted wind sway and a pulsing glow driven by the aGlow attribute.
// ---------------------------------------------------------------------------
const floraVertex = /* glsl */ `
uniform float uTime;
uniform float uSway;
attribute float aGlow;
varying float vGlow;
varying float vRim;
varying float vPhase;
void main() {
  vec3 p = position;
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.0);
  #endif
  float phase = dot(im[3].xyz, vec3(0.37, 0.71, 0.53));
  float h = max(p.y, 0.0);
  float gust = sin(uTime * 1.7 + phase) + 0.35 * sin(uTime * 3.1 + phase * 1.7);
  p.x += gust * uSway * h * h;
  p.z += cos(uTime * 1.3 + phase) * uSway * 0.6 * h * h;
  vec4 mv = modelViewMatrix * im * vec4(p, 1.0);
  vec3 n = normalize(mat3(modelViewMatrix * im) * normal);
  vRim = 1.0 - abs(dot(n, normalize(-mv.xyz)));
  vGlow = aGlow;
  vPhase = phase;
  gl_Position = projectionMatrix * mv;
}
`;

const floraFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uRimColor;
uniform vec3 uGlowColor;
uniform float uRimPower;
varying float vGlow;
varying float vRim;
varying float vPhase;
void main() {
  float rim = pow(clamp(vRim, 0.0, 1.0), uRimPower);
  float pulse = 0.62 + 0.38 * sin(uTime * 1.9 + vPhase * 3.0);
  vec3 col = uBase + uRimColor * rim + uGlowColor * vGlow * (pulse * 1.15 + rim * 0.5);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

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

type GlowFn = number | ((y: number) => number);

/** Merge primitive parts into one geometry with a per-vertex aGlow attribute. */
function buildPlant(parts: Array<{ geo: THREE.BufferGeometry; glow?: GlowFn }>) {
  const prepared = parts.map(({ geo: g, glow = 0 }) => {
    g.deleteAttribute('uv');
    const pos = g.getAttribute('position');
    const arr = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) arr[i] = typeof glow === 'number' ? glow : glow(pos.getY(i));
    g.setAttribute('aGlow', new THREE.BufferAttribute(arr, 1));
    return g.index ? g.toNonIndexed() : g;
  });
  const merged = mergeGeometries(prepared)!;
  prepared.forEach((g) => g.dispose());
  return merged;
}

const tube = (points: number[][], radius: number, segments = 16) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))),
    segments,
    radius,
    5,
    false
  );

export function createPlanetEcology(planetRadius: number, pixelRatio: number): PlanetEcology {
  const rand = mulberry32(20261005);
  const range = (a: number, b: number) => a + rand() * (b - a);
  const side = () => (rand() < 0.5 ? -1 : 1);

  const surface = new THREE.Group();
  const sky = new THREE.Group();
  const timeUniform = { value: 0 };

  const floraMaterial = (opts: { base: number; rim: number; glow: number; sway: number; rimPower?: number }) =>
    new THREE.ShaderMaterial({
      vertexShader: floraVertex,
      fragmentShader: floraFragment,
      uniforms: {
        uTime: timeUniform,
        uSway: { value: opts.sway },
        uBase: { value: new THREE.Color(opts.base) },
        uRimColor: { value: new THREE.Color(opts.rim) },
        uGlowColor: { value: new THREE.Color(opts.glow) },
        uRimPower: { value: opts.rimPower ?? 2.2 },
      },
    });

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
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    spots: Array<{ angle: number; lat: number; yaw: number; scale: THREE.Vector3; sink?: number; tilt?: number }>
  ) => {
    const mesh = new THREE.InstancedMesh(geometry, material, spots.length);
    mesh.frustumCulled = false; // instances wrap the whole planet
    const shrink = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    spots.forEach((s, i) => {
      const base = placeMatrix(s.angle, s.lat, s.yaw, s.scale, s.sink, s.tilt);
      mesh.setMatrixAt(i, base);
      placed.push({
        angle: s.angle,
        lat: s.lat,
        presence: 1,
        target: 1,
        apply: (p) => {
          const k = Math.max(p, 1e-4);
          // Sink into the ground as it shrinks, so plants retreat rather than pop.
          shrink.makeScale(k, k, k).setPosition(0, (p - 1) * 1.2, 0);
          mesh.setMatrixAt(i, tmp.multiplyMatrices(base, shrink));
          dirtyMeshes.add(mesh);
        },
      });
    });
    surface.add(mesh);
    return mesh;
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

  // ---- Terrain: rock outcrops ----------------------------------------------
  const rockGeo = buildPlant([{ geo: new THREE.DodecahedronGeometry(1, 0) }]);
  instanced(
    rockGeo,
    floraMaterial({ base: 0x05060b, rim: 0xb7c2d8, glow: 0x000000, sway: 0, rimPower: 2.6 }),
    [...cluster(40, 0.05, 0.1, 0.6, 0.25, 1.1), ...Array.from({ length: 16 }, () => spot(0.12, 0.6, 0.6, 1.8, 0.7))].map((s) => ({
      ...s,
      scale: s.scale.clone().multiply(new THREE.Vector3(1, range(0.45, 0.8), range(0.7, 1))),
      sink: 0.15,
      tilt: range(-0.3, 0.3),
    }))
  );

  // ---- Flora -----------------------------------------------------------------
  // Lumen mushrooms: dark stems, glowing domed caps with softer gills.
  const mushroomGeo = buildPlant([
    { geo: new THREE.CylinderGeometry(0.06, 0.11, 1, 6).translate(0, 0.5, 0) },
    { geo: new THREE.SphereGeometry(0.42, 12, 6, 0, TAU, 0, Math.PI / 2).scale(1, 0.7, 1).translate(0, 0.98, 0), glow: 1 },
    { geo: new THREE.CircleGeometry(0.4, 12).rotateX(Math.PI / 2).translate(0, 0.98, 0), glow: 0.45 },
  ]);
  instanced(
    mushroomGeo,
    floraMaterial({ base: 0x04050a, rim: 0x9fb4d0, glow: 0x46e0d0, sway: 0.03 }),
    cluster(84, 0.03, 0.08, 0.5, 0.6, 2.4)
  );

  // Crystal reeds: thin faceted spires whose tips glow violet.
  const reedParts: Array<{ geo: THREE.BufferGeometry; glow?: GlowFn }> = [];
  for (let i = 0; i < 6; i++) {
    const h = 1.4 + (i % 3) * 0.6;
    const a = (i / 6) * TAU;
    reedParts.push({
      geo: new THREE.ConeGeometry(0.07, h, 4)
        .translate(0, h / 2, 0)
        .rotateZ(Math.cos(a) * 0.22)
        .rotateX(Math.sin(a) * 0.22)
        .translate(Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18),
      glow: (y) => THREE.MathUtils.smoothstep(y, 0.6, 2.4),
    });
  }
  instanced(
    buildPlant(reedParts),
    floraMaterial({ base: 0x06050c, rim: 0xc9b8ff, glow: 0xa97bff, sway: 0.05 }),
    cluster(60, 0.04, 0.09, 0.55, 0.7, 1.5)
  );

  // Spiral ferns: curling fronds that sway the most.
  const fernParts: Array<{ geo: THREE.BufferGeometry; glow?: GlowFn }> = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const pts: number[][] = [];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const r = 0.9 * t;
      const curl = t * t * 4.2;
      pts.push([Math.cos(a) * r * Math.cos(curl * 0.3), Math.sin(t * Math.PI * 0.8) * 1.3 + Math.sin(curl) * 0.25 * t, Math.sin(a) * r]);
    }
    fernParts.push({ geo: tube(pts, 0.03, 18), glow: (y) => (y > 1.1 ? 0.35 : 0) });
  }
  instanced(
    buildPlant(fernParts),
    floraMaterial({ base: 0x030607, rim: 0x9ee6c2, glow: 0x6dffc0, sway: 0.08 }),
    cluster(56, 0.05, 0.07, 0.5, 0.7, 1.4)
  );

  // Lantern stalks: tall bending stems with a hanging glowing bulb.
  const lanternGeo = buildPlant([
    { geo: tube([[0, 0, 0], [0.05, 1.4, 0], [0.25, 2.7, 0], [0.7, 3.2, 0], [0.95, 2.9, 0]], 0.045, 20) },
    { geo: new THREE.SphereGeometry(0.22, 10, 8).scale(1, 1.25, 1).translate(0.95, 2.62, 0), glow: 1 },
    { geo: new THREE.ConeGeometry(0.16, 0.5, 5).rotateZ(-1).translate(0.25, 0.5, 0) },
    { geo: new THREE.ConeGeometry(0.14, 0.45, 5).rotateZ(1).translate(-0.2, 0.9, 0) },
  ]);
  instanced(
    lanternGeo,
    floraMaterial({ base: 0x05050a, rim: 0xe9dcc0, glow: 0xffb35a, sway: 0.012 }),
    Array.from({ length: 34 }, () => spot(0.13, 0.5, 0.8, 1.5))
  );

  // Low grass tufts near the path so the ground never reads as empty.
  const grassParts: Array<{ geo: THREE.BufferGeometry; glow?: GlowFn }> = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const h = 0.35 + (i % 3) * 0.18;
    grassParts.push({
      geo: new THREE.ConeGeometry(0.035, h, 3).translate(0, h / 2, 0).rotateZ(Math.cos(a) * 0.45).rotateX(Math.sin(a) * 0.45),
    });
  }
  instanced(
    buildPlant(grassParts),
    floraMaterial({ base: 0x05070a, rim: 0xd8e2f0, glow: 0x000000, sway: 0.35, rimPower: 1.6 }),
    [...cluster(160, 0.04, 0.05, 0.4, 0.8, 1.6), ...Array.from({ length: 120 }, () => spot(0.05, 0.6, 0.7, 1.5))]
  );

  // ---- Ruins (regular meshes with the traveler's pale edge lines) -------------
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x0b0c14, roughness: 0.9, metalness: 0.1 });
  const ruinEdgeMat = new THREE.LineBasicMaterial({ color: 0xe9e2cf, transparent: true, opacity: 0.55 });
  const glyphMat = new THREE.MeshBasicMaterial({ color: 0xd9b98a });
  const stone = (parent: THREE.Object3D, geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, stoneMat), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), ruinEdgeMat));
    g.position.set(x, y, z);
    g.rotation.set(rx, ry, rz);
    parent.add(g);
    return g;
  };
  const pillar = (parent: THREE.Object3D, x: number, z: number, h: number, broken = false) => {
    stone(parent, new THREE.CylinderGeometry(0.32, 0.36, h, 10), x, h / 2, z);
    stone(parent, new THREE.BoxGeometry(0.9, 0.22, 0.9), x, 0.11, z);
    if (!broken) stone(parent, new THREE.BoxGeometry(0.85, 0.24, 0.85), x, h + 0.12, z);
  };

  const ruinBuilders: Array<() => THREE.Group> = [
    // Broken colonnade with one fallen column.
    () => {
      const g = new THREE.Group();
      [4.2, 2.6, 3.8, 1.4].forEach((h, i) => pillar(g, i * 1.6 - 2.4, 0, h, i % 2 === 1));
      stone(g, new THREE.CylinderGeometry(0.32, 0.32, 3.4, 10), 1.2, 0.3, 1.6, 0, 0.4, Math.PI / 2);
      stone(g, new THREE.BoxGeometry(3.4, 0.3, 0.9), -1.6, 4.35, 0, 0, 0, 0.04);
      return g;
    },
    // Half arch gate.
    () => {
      const g = new THREE.Group();
      pillar(g, -1.8, 0, 3.4, true);
      pillar(g, 1.8, 0, 2.2, true);
      stone(g, new THREE.TorusGeometry(1.8, 0.28, 6, 18, Math.PI * 0.55), 0, 3.3, 0, 0, 0, Math.PI * 0.45);
      return g;
    },
    // Ring of standing stones around a glowing glyph.
    () => {
      const g = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        const h = 1.6 + ((i * 37) % 10) / 10;
        stone(g, new THREE.BoxGeometry(0.7, h, 0.35), Math.cos(a) * 2.6, h / 2 - 0.1, Math.sin(a) * 2.6, 0, -a, i === 3 ? 0.35 : 0);
      }
      const glyph = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.92, 32), glyphMat);
      glyph.rotation.x = -Math.PI / 2;
      glyph.position.y = 0.04;
      g.add(glyph);
      return g;
    },
    // Half-buried astrolabe ring.
    () => {
      const g = new THREE.Group();
      stone(g, new THREE.TorusGeometry(2.4, 0.22, 8, 40), 0, 1.2, 0, 0.25, 0, 0.1);
      stone(g, new THREE.TorusGeometry(1.7, 0.1, 6, 32), 0, 1.25, 0, 1.2, 0.4, 0);
      stone(g, new THREE.SphereGeometry(0.4, 10, 8), 0, 1.25, 0);
      return g;
    },
    // Stair fragment climbing to nothing.
    () => {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) stone(g, new THREE.BoxGeometry(2.2 - i * 0.12, 0.38, 0.7), 0, 0.19 + i * 0.38, -i * 0.62);
      stone(g, new THREE.BoxGeometry(0.4, 1.2, 0.4), 1.3, 0.6, -2.4, 0, 0, 0.2);
      return g;
    },
    // Obelisk with a lit inscription.
    () => {
      const g = new THREE.Group();
      stone(g, new THREE.CylinderGeometry(0.35, 0.65, 5.2, 4), 0, 2.6, 0, 0, Math.PI / 4, 0.06);
      stone(g, new THREE.ConeGeometry(0.42, 0.7, 4), 0.16, 5.5, 0, 0, Math.PI / 4, 0.06);
      stone(g, new THREE.BoxGeometry(1.8, 0.4, 1.8), 0, 0.2, 0);
      for (let i = 0; i < 4; i++) {
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.05), glyphMat);
        mark.position.set(0.04 + i * 0.012, 1.6 + i * 0.55, 0.52 - i * 0.05);
        g.add(mark);
      }
      return g;
    },
    // Toppled statue head, half sunk.
    () => {
      const g = new THREE.Group();
      const head = stone(g, new THREE.IcosahedronGeometry(1.5, 1), 0, 0.7, 0, 0.3, 0.6, 1.1);
      head.scale.set(1, 1.25, 0.95);
      stone(g, new THREE.ConeGeometry(0.35, 0.8, 4), 0.9, 1.2, 1.1, 0.4, 0, -0.8);
      return g;
    },
  ];
  const ruinCount = 16;
  for (let i = 0; i < ruinCount; i++) {
    const ruin = ruinBuilders[i % ruinBuilders.length]();
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
  spores.frustumCulled = false;
  surface.add(spores);

  // ---- Birds -----------------------------------------------------------------
  const birdMat = new THREE.LineBasicMaterial({ color: 0xf2f4ff, transparent: true, opacity: 0.85 });
  const wingGeo = (dir: number) =>
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dir * 0.45, 0.08, -0.12),
      new THREE.Vector3(dir * 0.95, -0.02, -0.32),
    ]);
  const leftWingGeo = wingGeo(-1);
  const rightWingGeo = wingGeo(1);
  const bodyGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.32), new THREE.Vector3(0, 0, -0.4)]);

  interface Bird {
    group: THREE.Group;
    left: THREE.Line;
    right: THREE.Line;
    offset: THREE.Vector3;
    phase: number;
  }
  interface Flock {
    birds: Bird[];
    center: THREE.Vector3;
    radiusX: number;
    radiusZ: number;
    speed: number;
    t: number;
    bob: number;
  }
  const flocks: Flock[] = [];
  const flockSpecs = [
    // Orbits stay beyond the duo (-Z) so flocks never sweep across the camera.
    { center: new THREE.Vector3(0, 16, -26), rx: 30, rz: 8, speed: 0.05, count: 7 },
    { center: new THREE.Vector3(6, 22, -34), rx: 26, rz: 7, speed: -0.04, count: 5 },
    { center: new THREE.Vector3(-8, 12, -18), rx: 18, rz: 6, speed: 0.065, count: 4 },
  ];
  for (const spec of flockSpecs) {
    const birds: Bird[] = [];
    for (let i = 0; i < spec.count; i++) {
      const group = new THREE.Group();
      const left = new THREE.Line(leftWingGeo, birdMat);
      const right = new THREE.Line(rightWingGeo, birdMat);
      group.add(left, right, new THREE.Line(bodyGeo, birdMat));
      group.scale.setScalar(range(0.8, 1.2));
      // Loose V formation trailing behind the leader.
      const rank = Math.ceil(i / 2);
      const offset = new THREE.Vector3((i % 2 ? -1 : 1) * rank * 1.3, range(-0.3, 0.3), rank * 1.1);
      sky.add(group);
      birds.push({ group, left, right, offset, phase: rand() * TAU });
    }
    flocks.push({ birds, center: spec.center, radiusX: spec.rx, radiusZ: spec.rz, speed: spec.speed, t: rand() * TAU, bob: rand() * TAU });
  }
  const flockPos = new THREE.Vector3();
  const flockAhead = new THREE.Vector3();
  const flockBasis = new THREE.Matrix4();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const flockForward = new THREE.Vector3();
  const flockRight = new THREE.Vector3();
  const birdOffset = new THREE.Vector3();
  const birdTarget = new THREE.Vector3();
  const flockPoint = (f: Flock, t: number, out: THREE.Vector3) =>
    out.set(
      f.center.x + Math.cos(t) * f.radiusX,
      f.center.y + Math.sin(t * 2 + f.bob) * 1.6,
      f.center.z + Math.sin(t) * f.radiusZ
    );

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
      flockPoint(f, f.t, flockPos);
      flockPoint(f, f.t + Math.sign(f.speed) * 0.02, flockAhead);
      flockForward.subVectors(flockAhead, flockPos).normalize();
      flockRight.crossVectors(worldUp, flockForward).normalize();
      flockBasis.makeBasis(flockRight, worldUp, flockForward);
      for (const b of f.birds) {
        // Basis columns are (right, up, forward), so +offset.z trails behind.
        birdOffset.copy(b.offset).applyMatrix4(flockBasis);
        b.group.position.copy(flockPos).sub(birdOffset);
        birdTarget.copy(b.group.position).add(flockForward);
        b.group.lookAt(birdTarget);
        // Flap in bursts, then glide.
        const glide = 0.35 + 0.65 * Math.max(0, Math.sin(elapsed * 0.6 + b.phase));
        const flap = Math.sin(elapsed * 9 + b.phase) * 0.7 * glide;
        b.left.rotation.z = -flap;
        b.right.rotation.z = flap;
        b.group.rotation.z += Math.sin(elapsed * 0.5 + b.phase) * 0.12;
      }
    }
  };

  return {
    surface,
    sky,
    setClearing,
    update,
    setPixelRatio: (ratio) => {
      sporeUniforms.uPixelRatio.value = ratio;
    },
  };
}
