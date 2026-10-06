import * as THREE from 'three';

export interface FlowTrail {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
  geometries: THREE.BufferGeometry[];
  phase: number;
  speed: number;
}

function createFlowRibbon(color: number, length: number, width: number, phase: number, bend: number) {
  const slices = 28;
  const positions = new Float32Array((slices + 1) * 2 * 3);
  const trailProgress = new Float32Array((slices + 1) * 2);
  const side = new Float32Array((slices + 1) * 2);
  const indices: number[] = [];

  for (let i = 0; i <= slices; i++) {
    const progress = i / slices;
    const z = progress * length;
    const curveX = Math.sin(progress * Math.PI) * bend;
    const curveY = Math.sin(progress * Math.PI) * Math.abs(bend) * 0.08;
    const row = i * 2;
    positions[row * 3] = curveX - width * 0.5;
    positions[row * 3 + 1] = curveY;
    positions[row * 3 + 2] = z;
    positions[(row + 1) * 3] = curveX + width * 0.5;
    positions[(row + 1) * 3 + 1] = curveY;
    positions[(row + 1) * 3 + 2] = z;
    trailProgress[row] = progress;
    trailProgress[row + 1] = progress;
    side[row] = -1;
    side[row + 1] = 1;
    if (i < slices) indices.push(row, row + 1, row + 2, row + 1, row + 3, row + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTrail', new THREE.BufferAttribute(trailProgress, 1));
  geometry.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 }, uIntensity: { value: 0 }, uPhase: { value: phase }, uSpeed: { value: 1 },
    },
    vertexShader: `
      attribute float aTrail;
      attribute float aSide;
      uniform float uTime;
      uniform float uPhase;
      varying float vTrail;
      varying float vSide;
      void main() {
        vec3 p = position;
        float sway = sin(uTime * 1.7 + aTrail * 5.5 + uPhase) * 0.035 * (0.25 + aTrail);
        p.x += sway;
        p.y += sin(uTime * 1.15 + aTrail * 4.0 + uPhase) * 0.018 * aTrail;
        vTrail = aTrail;
        vSide = aSide;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uIntensity;
      uniform float uPhase;
      uniform float uSpeed;
      varying float vTrail;
      varying float vSide;
      void main() {
        float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
        float tail = pow(max(0.0, 1.0 - vTrail), 1.35);
        float flow = 0.62 + 0.38 * sin(vTrail * 18.0 - uTime * (4.0 + uSpeed * 2.0) + uPhase);
        float alpha = edge * tail * flow * uIntensity;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return { mesh: new THREE.Mesh(geometry, material), material };
}

export function createFlowTrail(origin: THREE.Vector3, color: number, length: number, width: number, phase: number, bend: number): FlowTrail {
  const group = new THREE.Group();
  group.position.copy(origin);
  group.renderOrder = 4;
  const halo = createFlowRibbon(color, length, width, phase, bend);
  const core = createFlowRibbon(0xffffff, length * 0.82, width * 0.28, phase + 0.7, bend * 0.82);
  core.mesh.position.y = 0.012;
  group.add(halo.mesh, core.mesh);
  return {
    group,
    materials: [halo.material, core.material],
    geometries: [halo.mesh.geometry as THREE.BufferGeometry, core.mesh.geometry as THREE.BufferGeometry],
    phase,
    speed: 1,
  };
}

export function updateFlowTrail(trail: FlowTrail, elapsed: number, intensity: number, speed: number) {
  trail.materials.forEach((material) => {
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uIntensity.value = intensity;
    material.uniforms.uSpeed.value = speed;
  });
}
