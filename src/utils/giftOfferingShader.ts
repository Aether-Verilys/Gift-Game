import * as THREE from 'three';

/**
 * Gift-offering surface effect injected into the colossus materials.
 * Works in the encounter root's local space so the sweep always climbs
 * from the monument's base to its crown, regardless of planet tilt.
 */
export interface GiftOfferingEffect {
  uniforms: {
    uOfferRootInverse: { value: THREE.Matrix4 };
    uOfferTime: { value: number };
    uOfferFront: { value: number }; // local height of the sweeping energy front
    uOfferSweep: { value: number }; // 0..1 visibility of the leading band
    uOfferInfuse: { value: number }; // 0..1 how strongly the swept region stays lit
    uOfferPrime: { value: number }; // 0..1 anticipation while the gift is dragged near
  };
  apply: (root: THREE.Object3D) => void;
}

const vertexHeader = /* glsl */ `
uniform mat4 uOfferRootInverse;
varying vec3 vOfferLocal;
varying float vOfferRim;
`;

const vertexBody = /* glsl */ `
#include <begin_vertex>
vOfferLocal = (uOfferRootInverse * modelMatrix * vec4(transformed, 1.0)).xyz;
{
  // Edge lines have no normal attribute; treat them as full rim.
  float offerNLen = length(normal);
  if (offerNLen > 0.0) {
    vec3 offerN = normalize(normalMatrix * normal);
    vec3 offerV = normalize(-(modelViewMatrix * vec4(transformed, 1.0)).xyz);
    vOfferRim = 1.0 - abs(dot(offerN, offerV));
  } else {
    vOfferRim = 1.0;
  }
}
`;

const fragmentHeader = /* glsl */ `
uniform float uOfferTime;
uniform float uOfferFront;
uniform float uOfferSweep;
uniform float uOfferInfuse;
uniform float uOfferPrime;
varying vec3 vOfferLocal;
varying float vOfferRim;

float offerHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float offerNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(offerHash(i), offerHash(i + vec3(1, 0, 0)), f.x),
        mix(offerHash(i + vec3(0, 1, 0)), offerHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(offerHash(i + vec3(0, 0, 1)), offerHash(i + vec3(1, 0, 1)), f.x),
        mix(offerHash(i + vec3(0, 1, 1)), offerHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
`;

const fragmentBody = /* glsl */ `
{
  float offerY = vOfferLocal.y;
  float offerD = offerY - uOfferFront;
  float offerRim = pow(clamp(vOfferRim, 0.0, 1.0), 2.4);

  // Leading band: thin hot core plus a softer trailing halo.
  float offerCore = exp(-offerD * offerD / 1.6);
  float offerHalo = exp(-offerD * offerD / 22.0);
  float offerBand = (offerCore * 1.6 + offerHalo * 0.45) * uOfferSweep;

  // Everything below the front stays infused with flowing crimson veins.
  float offerBelow = 1.0 - smoothstep(uOfferFront - 4.0, uOfferFront + 0.5, offerY);
  float offerInfused = offerBelow * uOfferInfuse;
  float offerN = offerNoise(vOfferLocal * 0.32 + vec3(0.0, -uOfferTime * 0.55, uOfferTime * 0.12));
  float offerVeins = 1.0 - smoothstep(0.0, 0.07, abs(offerN - 0.5));
  float offerPulse = 0.72 + 0.28 * sin(uOfferTime * 2.1 - offerY * 0.22);

  vec3 offerCrimson = vec3(1.0, 0.16, 0.29);
  vec3 offerGold = vec3(1.0, 0.82, 0.56);

  vec3 offerGlow = mix(offerCrimson, offerGold, offerCore) * offerBand * (0.8 + offerRim * 1.4);
  offerGlow += offerCrimson * offerInfused * (offerVeins * 0.85 + offerRim * 0.6) * offerPulse;
  offerGlow += offerCrimson * uOfferPrime * offerRim * (0.45 + 0.3 * sin(uOfferTime * 5.5));

  // Warm the base albedo a touch where the gift has flowed through.
  outgoingLight = mix(outgoingLight, outgoingLight * vec3(1.25, 0.88, 0.92), offerInfused * 0.6);
  outgoingLight += offerGlow;
}
#include <opaque_fragment>
`;

export function createGiftOfferingEffect(): GiftOfferingEffect {
  const uniforms: GiftOfferingEffect['uniforms'] = {
    uOfferRootInverse: { value: new THREE.Matrix4() },
    uOfferTime: { value: 0 },
    uOfferFront: { value: -10 },
    uOfferSweep: { value: 0 },
    uOfferInfuse: { value: 0 },
    uOfferPrime: { value: 0 },
  };
  const patched = new WeakSet<THREE.Material>();

  const patch = (material: THREE.Material) => {
    if (patched.has(material)) return;
    patched.add(material);
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = vertexHeader + shader.vertexShader.replace('#include <begin_vertex>', vertexBody);
      shader.fragmentShader = fragmentHeader + shader.fragmentShader.replace('#include <opaque_fragment>', fragmentBody);
    };
    material.customProgramCacheKey = () => 'gift-offering';
    material.needsUpdate = true;
  };

  const apply = (root: THREE.Object3D) => {
    root.traverse((obj) => {
      const mat = (obj as THREE.Mesh | THREE.LineSegments).material;
      if (!mat) return;
      (Array.isArray(mat) ? mat : [mat]).forEach(patch);
    });
  };

  return { uniforms, apply };
}
