import * as THREE from 'three';

/** A monumental robed figure, facing +Z toward the approaching traveler. */
export function createHierophant(): THREE.Group {
  const figure = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x11121d, roughness: 0.95 });
  const edge = new THREE.LineBasicMaterial({ color: 0xe9e0c9 });
  const gold = new THREE.MeshBasicMaterial({ color: 0xbca377 });
  const part = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, stone));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edge));
    group.position.set(x, y, z);
    figure.add(group);
    return group;
  };
  const line = (points: number[][]) => {
    figure.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p as [number, number, number]))), edge));
  };

  // Broad hem, tapered shoulders and long vertical robe folds.
  part(new THREE.CylinderGeometry(0.52, 1.12, 2.8, 12), 0, 1.4, 0);
  part(new THREE.CylinderGeometry(0.55, 0.86, 0.55, 8), 0, 2.65, 0);
  for (let i = -3; i <= 3; i++) {
    line([[i * 0.13, 2.65, 0.55], [i * 0.22, 1.4, 0.78], [i * 0.29, 0.07, 0.99]]);
  }
  part(new THREE.CylinderGeometry(0.36, 0.29, 0.64, 8), 0, 3.18, 0);
  part(new THREE.ConeGeometry(0.26, 0.58, 5), 0, 2.84, 0.32).rotation.z = Math.PI;
  // Three-tier papal crown with cross finial.
  part(new THREE.CylinderGeometry(0.16, 0.4, 0.86, 8), 0, 3.86, 0);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.37 - i * 0.08, 0.035, 6, 24), gold);
    band.rotation.x = Math.PI / 2;
    band.position.y = 3.53 + i * 0.27;
    figure.add(band);
  }
  line([[0, 4.24, 0], [0, 4.65, 0]]);
  line([[-0.14, 4.47, 0], [0.14, 4.47, 0]]);
  // Eyes, nose and a blessing hand make the silhouette read as a person.
  line([[-0.22, 3.3, 0.31], [-0.08, 3.3, 0.36]]);
  line([[0.08, 3.3, 0.36], [0.22, 3.3, 0.31]]);
  line([[0, 3.31, 0.38], [0, 3.12, 0.43], [0.08, 3.09, 0.37]]);
  part(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 8), -0.75, 2.52, 0).rotation.z = -0.65;
  part(new THREE.CylinderGeometry(0.14, 0.24, 0.8, 8), -1.03, 2.85, 0.12);
  part(new THREE.BoxGeometry(0.25, 0.35, 0.15), -1.03, 3.33, 0.12);
  for (let i = 0; i < 2; i++) line([[-1.1 + i * 0.14, 3.48, 0.12], [-1.1 + i * 0.14, 3.77, 0.12]]);
  part(new THREE.CylinderGeometry(0.2, 0.32, 0.9, 8), 0.8, 2.45, 0).rotation.z = 0.85;
  part(new THREE.BoxGeometry(0.24, 0.3, 0.22), 1.17, 2.22, 0.1);
  // Triple-cross staff, planted beside the robe.
  part(new THREE.CylinderGeometry(0.035, 0.055, 4.1, 6), 1.35, 2.05, 0.12);
  for (let i = 0; i < 3; i++) line([[1.35 - (0.32 - i * 0.07), 3.45 + i * 0.23, 0.12], [1.35 + (0.32 - i * 0.07), 3.45 + i * 0.23, 0.12]]);
  // A restrained halo behind the crown.
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.015, 6, 64), gold);
  halo.position.set(0, 3.65, -0.48);
  figure.add(halo);
  return figure;
}
