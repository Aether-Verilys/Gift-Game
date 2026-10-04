import * as THREE from 'three';
import { EncounterData } from '../types';
import { createHierophant } from './createHierophant';

/** Solid, sculpted silhouettes with pale edges matching the traveler. */
export function createTarotEntities(): Record<EncounterData['type'], THREE.Group> {
  const stone = new THREE.MeshStandardMaterial({ color: 0x394252, roughness: 0.85, metalness: 0.15 });
  const pale = new THREE.MeshStandardMaterial({ color: 0xa9b6c9, roughness: 0.65, metalness: 0.25 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc6a66a, roughness: 0.45, metalness: 0.6 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xb9e5ef, emissive: 0x579ac2, emissiveIntensity: 0.8 });
  const red = new THREE.MeshStandardMaterial({ color: 0xb95b72, emissive: 0x6a182e, emissiveIntensity: 0.45 });
  const edge = new THREE.LineBasicMaterial({ color: 0xd9dfeb, transparent: true, opacity: 0.55 });
  function part(parent: THREE.Group, geo: THREE.BufferGeometry, x: number, y: number, z: number, mat: THREE.Material = stone) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edge));
    group.position.set(x, y, z);
    parent.add(group);
    return group;
  }
  const box = (g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m = stone) => part(g, new THREE.BoxGeometry(w, h, d), x, y, z, m);
  const orb = (g: THREE.Group, r: number, x: number, y: number, z: number, m = glow) => part(g, new THREE.IcosahedronGeometry(r, 2), x, y, z, m);
  const ring = (g: THREE.Group, r: number, tube: number, x: number, y: number, z: number, m = gold) => part(g, new THREE.TorusGeometry(r, tube, 10, 48), x, y, z, m);
  function rod(g: THREE.Group, a: number[], b: number[], r = 0.06, m = gold) {
    const start = new THREE.Vector3(...a as [number, number, number]);
    const end = new THREE.Vector3(...b as [number, number, number]);
    const direction = end.clone().sub(start);
    const center = start.add(end).multiplyScalar(0.5);
    const p = part(g, new THREE.CylinderGeometry(r, r, direction.length(), 8), center.x, center.y, center.z, m);
    p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return p;
  }
  function figure(parent: THREE.Group, x = 0, robe = stone) {
    const g = new THREE.Group();
    g.position.x = x;
    parent.add(g);
    part(g, new THREE.CylinderGeometry(0.35, 0.72, 2.2, 10), 0, 1.1, 0, robe);
    part(g, new THREE.SphereGeometry(0.37, 12, 10), 0, 2.63, 0, pale);
    part(g, new THREE.ConeGeometry(0.10, 0.22, 4), 0, 2.62, 0.37, pale).rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      box(g, 0.12, 0.035, 0.035, side * 0.15, 2.72, 0.34, gold);
      rod(g, [side * 0.31, 2.13, 0], [side * 0.7, 1.46, 0.12], 0.15, robe);
      orb(g, 0.13, side * 0.7, 1.46, 0.12, pale);
    }
    return g;
  }
  function crown(g: THREE.Group, y: number) {
    part(g, new THREE.CylinderGeometry(0.4, 0.37, 0.18, 8), 0, y, 0, gold);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      part(g, new THREE.ConeGeometry(0.09, 0.35, 4), Math.cos(a) * 0.32, y + 0.22, Math.sin(a) * 0.32, gold);
    }
  }

  const fool = new THREE.Group();
  figure(fool);
  part(fool, new THREE.ConeGeometry(0.43, 0.6, 6), 0.1, 3.08, 0, pale).rotation.z = -0.3;
  rod(fool, [-1, 1.1, 0], [0.95, 3.35, -0.15]);
  orb(fool, 0.32, 0.85, 3.05, -0.15, red);
  // Small companion at the wanderer's feet.
  part(fool, new THREE.BoxGeometry(0.35, 0.35, 0.65), -0.95, 0.38, 0.3, pale);
  orb(fool, 0.23, -0.95, 0.64, 0.6, pale);
  for (const x of [-1.08, -0.82]) for (const z of [0.07, 0.52]) rod(fool, [x, 0.05, z], [x, 0.35, z], 0.06, pale);

  const priestess = new THREE.Group();
  figure(priestess, 0, pale);
  for (const x of [-1.1, 1.1]) {
    part(priestess, new THREE.CylinderGeometry(0.2, 0.25, 3.4, 12), x, 1.7, -0.35);
    box(priestess, 0.65, 0.2, 0.65, x, 3.4, -0.35, gold);
  }
  box(priestess, 1.6, 2.8, 0.12, 0, 1.9, -0.6);
  ring(priestess, 0.46, 0.065, 0, 3.2, -0.12);
  box(priestess, 0.85, 0.12, 0.55, 0, 1.7, 0.55, gold).rotation.x = 0.35;
  orb(priestess, 0.18, 0, 3.2, 0, glow);

  const emperor = new THREE.Group();
  const seated = figure(emperor);
  crown(seated, 3.03);
  box(emperor, 1.8, 2.8, 0.35, 0, 1.6, -0.6);
  box(emperor, 1.8, 0.4, 1.3, 0, 0.25, 0);
  for (const x of [-0.95, 0.95]) {
    box(emperor, 0.25, 1.6, 1.2, x, 0.8, 0);
    orb(emperor, 0.22, x, 1.72, 0.4, gold);
  }
  rod(emperor, [1.3, 0, 0.35], [1.3, 3.1, 0.35], 0.07);
  orb(emperor, 0.17, 1.3, 3.15, 0.35, gold);

  const lovers = new THREE.Group();
  figure(lovers, -0.85, pale);
  figure(lovers, 0.85, stone);
  rod(lovers, [-0.2, 1.5, 0.15], [0.2, 1.5, 0.15], 0.13, gold);
  orb(lovers, 0.35, 0, 3.4, 0, red);
  ring(lovers, 1.8, 0.07, 0, 1.85, -0.6);

  const chariot = new THREE.Group();
  box(chariot, 2, 0.5, 1.6, 0, 0.65, 0);
  box(chariot, 2, 0.9, 0.18, 0, 1.25, 0.75, gold);
  for (const x of [-1.15, 1.15]) {
    const wheel = part(chariot, new THREE.CylinderGeometry(0.65, 0.65, 0.22, 16), x, 0.65, 0);
    wheel.rotation.z = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      rod(chariot, [x * 1.1, 0.65, 0], [x * 1.1, 0.65 + Math.cos(a) * 0.55, Math.sin(a) * 0.55], 0.035);
    }
  }
  const rider = figure(chariot);
  rider.scale.setScalar(0.65);
  rider.position.y = 0.9;
  crown(rider, 3.03);
  for (const x of [-0.9, 0.9]) rod(chariot, [x, 1, -0.5], [x, 3.2, -0.5]);
  part(chariot, new THREE.ConeGeometry(1.5, 0.55, 4), 0, 3.4, -0.1, pale).rotation.y = Math.PI / 4;

  const hermit = new THREE.Group();
  figure(hermit);
  part(hermit, new THREE.ConeGeometry(0.53, 0.85, 8), 0, 2.96, -0.1);
  rod(hermit, [-1, 0, 0.2], [-1, 2.6, 0.2], 0.07);
  rod(hermit, [0.55, 1.9, 0], [1.05, 2.3, 0.2], 0.13, stone);
  ring(hermit, 0.14, 0.025, 1.05, 2.2, 0.2);
  orb(hermit, 0.21, 1.05, 1.86, 0.2);
  for (const x of [0.78, 1.32]) for (const z of [-0.05, 0.45]) rod(hermit, [x, 1.55, z], [x, 2.12, z], 0.035);
  box(hermit, 0.65, 0.12, 0.65, 1.05, 1.5, 0.2, gold);
  part(hermit, new THREE.ConeGeometry(0.45, 0.22, 4), 1.05, 2.18, 0.2, gold).rotation.y = Math.PI / 4;

  const wheel = new THREE.Group();
  box(wheel, 1.5, 0.3, 1.1, 0, 0.15, 0);
  rod(wheel, [0, 0.2, 0], [0, 2.2, 0], 0.18, stone);
  ring(wheel, 1.5, 0.18, 0, 2, 0);
  ring(wheel, 1.1, 0.06, 0, 2, 0);
  orb(wheel, 0.3, 0, 2, 0);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    rod(wheel, [Math.cos(a) * 0.3, 2 + Math.sin(a) * 0.3, 0], [Math.cos(a) * 1.48, 2 + Math.sin(a) * 1.48, 0], 0.07);
  }

  const tower = new THREE.Group();
  part(tower, new THREE.CylinderGeometry(0.65, 0.95, 3.2, 8), 0, 1.6, 0);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    box(tower, 0.3, 0.5, 0.3, Math.cos(a) * 0.65, 3.35, Math.sin(a) * 0.65, pale);
  }
  for (const y of [0.85, 1.8, 2.65]) box(tower, 0.22, 0.4, 0.08, 0, y, 0.85 - y * 0.07, gold);
  rod(tower, [0.9, 4.25, 0], [0.2, 3.65, 0.1], 0.08, glow);
  rod(tower, [0.2, 3.65, 0.1], [0.7, 3.65, 0.1], 0.08, glow);
  rod(tower, [0.7, 3.65, 0.1], [0.25, 3.05, 0.2], 0.08, glow);
  for (let i = 0; i < 3; i++) box(tower, 0.3, 0.4, 0.3, 1.1 + i * 0.2, 2.5 - i * 0.55, 0).rotation.z = i + 0.4;

  const star = new THREE.Group();
  figure(star, 0, pale);
  part(star, new THREE.SphereGeometry(0.35, 12, 8), 0.9, 1.4, 0.2, gold).scale.set(0.7, 1, 0.7);
  rod(star, [0.9, 1.3, 0.2], [1.05, 0.1, 0.3], 0.06, glow);
  ring(star, 1.1, 0.12, 0, 0.1, 0, glow).rotation.x = Math.PI / 2;
  orb(star, 0.28, 0, 3.6, 0);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const ray = part(star, new THREE.ConeGeometry(0.12, 0.65, 4), Math.sin(a) * 0.48, 3.6 + Math.cos(a) * 0.48, 0, gold);
    ray.rotation.z = -a;
  }

  const sun = new THREE.Group();
  part(sun, new THREE.CylinderGeometry(0.4, 0.9, 1.4, 12), 0, 0.7, 0);
  orb(sun, 1, 0, 2.4, 0, gold);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    part(sun, new THREE.ConeGeometry(0.12, 0.6, 4), Math.sin(a) * 1.28, 2.4 + Math.cos(a) * 1.28, 0, gold).rotation.z = -a;
  }
  for (const x of [-0.3, 0.3]) orb(sun, 0.09, x, 2.55, 0.94, stone);
  part(sun, new THREE.TorusGeometry(0.35, 0.04, 8, 24, Math.PI), 0, 2.25, 0.95, stone).rotation.z = Math.PI;

  const world = new THREE.Group();
  figure(world, 0, pale);
  ring(world, 1.8, 0.14, 0, 1.8, -0.3).scale.x = 0.8;
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    const leaf = orb(world, 0.2, Math.cos(a) * 1.45, 1.8 + Math.sin(a) * 1.8, -0.3, gold);
    leaf.scale.set(0.65, 1.5, 0.5);
    leaf.rotation.z = a;
  }

  // Legacy encounter aliases retain fully solid models too.
  return { seedling: fool, priestess, emperor, hierophant: createHierophant(), twin_core: lovers,
    chariot, lantern: hermit, astrolabe: wheel, prism: tower, spring: star, sun, gateway: world,
    beacon: tower.clone(true), monolith: priestess.clone(true) };
}
