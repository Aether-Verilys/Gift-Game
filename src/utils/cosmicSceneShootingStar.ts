import * as THREE from 'three';

export interface ShootingStarController {
  starGeo: THREE.BufferGeometry;
  starMat: THREE.LineBasicMaterial;
  headGeo: THREE.BufferGeometry;
  headMat: THREE.PointsMaterial;
  trigger: () => void;
  update: (dt: number) => void;
  dispose: () => void;
}

export function createShootingStar(scene: THREE.Scene, dustTexture: THREE.Texture): ShootingStarController {
  const starMat = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0, linewidth: 1.8,
    blending: THREE.AdditiveBlending,
  });
  const starGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), new THREE.Vector3(),
  ]);
  const starLine = new THREE.Line(starGeo, starMat);
  scene.add(starLine);

  const headGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
  const headMat = new THREE.PointsMaterial({
    size: 2.8, map: dustTexture, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const headPoint = new THREE.Points(headGeo, headMat);
  headPoint.name = 'shooting-star-head';
  scene.add(headPoint);

  let active = false;
  let progress = 0;
  let timer = 0;
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();

  const trigger = () => {
    active = true;
    progress = 0;
    start.set((Math.random() - 0.5) * 90, 28 + Math.random() * 35, -45 - Math.random() * 65);
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 45 - 22,
      -16 - Math.random() * 18,
      (Math.random() - 0.5) * 35,
    ).normalize();
    end.copy(start).addScaledVector(direction, 55 + Math.random() * 40);
  };

  const update = (dt: number) => {
    timer += dt;
    if (timer > 4.5 && !active && Math.random() < 0.3) {
      timer = 0;
      trigger();
    }
    if (!active) return;
    progress += dt * 1.8;
    if (progress >= 1) {
      active = false;
      starMat.opacity = 0;
      headMat.opacity = 0;
      return;
    }
    const head = new THREE.Vector3().lerpVectors(start, end, Math.min(1, progress * 1.2));
    const tail = new THREE.Vector3().lerpVectors(start, end, Math.max(0, progress * 1.2 - 0.35));
    const linePositions = starGeo.attributes.position as THREE.BufferAttribute;
    linePositions.setXYZ(0, tail.x, tail.y, tail.z);
    linePositions.setXYZ(1, head.x, head.y, head.z);
    linePositions.needsUpdate = true;
    const headPosition = headGeo.attributes.position as THREE.BufferAttribute;
    headPosition.setXYZ(0, head.x, head.y, head.z);
    headPosition.needsUpdate = true;
    const fade = Math.sin(progress * Math.PI);
    starMat.opacity = fade * 0.9;
    headMat.opacity = fade;
  };

  const dispose = () => {
    scene.remove(starLine, headPoint);
    starGeo.dispose();
    starMat.dispose();
    headGeo.dispose();
    headMat.dispose();
  };
  return { starGeo, starMat, headGeo, headMat, trigger, update, dispose };
}
