import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WalkPace, CameraView } from '../types';
import { audioService } from '../services/audioService';

interface CosmicThreeSceneProps {
  pace: WalkPace;
  view: CameraView;
  sceneryShift?: string;
  onRedObjectResonance?: (state: { isDragging: boolean; distance: number; resonanceLevel: number }) => void;
}

export const CosmicThreeScene: React.FC<CosmicThreeSceneProps> = ({
  pace,
  view,
  sceneryShift = 'normal',
  onRedObjectResonance,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store state in refs to update in real-time inside the Three.js render loop
  const paceRef = useRef<WalkPace>(pace);
  const viewRef = useRef<CameraView>(view);
  const sceneryShiftRef = useRef<string>(sceneryShift);
  const onRedObjectResonanceRef = useRef(onRedObjectResonance);

  useEffect(() => {
    onRedObjectResonanceRef.current = onRedObjectResonance;
  }, [onRedObjectResonance]);

  useEffect(() => {
    paceRef.current = pace;
  }, [pace]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    sceneryShiftRef.current = sceneryShift;
  }, [sceneryShift]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020206, 0.0035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Camera: 3/4 Trailing Cinematic Perspective
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // Base camera coordinates
    camera.position.set(4.2, 3.2, 6.8);
    camera.lookAt(-0.5, 1.2, -3.5);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x010104, 1);
    container.appendChild(renderer.domElement);

    // 4. Realistic Multi-Layered Particle Cosmos
    // 4A. Astronomical Deep Starfield with GPU Shader (Twinkling, Diffraction Spikes & Airy Discs)
    const starCount = 4200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);
    const starSpeeds = new Float32Array(starCount);
    const starBrightnesses = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Natural celestial sphere distribution (more dense near horizon and upper zenith)
      const radius = 90 + Math.random() * 360;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 1.95 - 0.95); // mostly celestial dome

      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.max(2.0, radius * Math.sin(phi) * Math.sin(theta) * 0.95 + 8);
      starPos[i * 3 + 2] = radius * Math.cos(phi);

      // Astronomical power-law magnitude distribution
      const randMag = Math.random();
      let size = 1.4;
      let brightness = 0.35;

      if (randMag > 0.97) {
        // Luminous major stars (with 4-ray diffraction spikes)
        size = 5.0 + Math.random() * 3.5;
        brightness = 0.9 + Math.random() * 0.1;
      } else if (randMag > 0.82) {
        // Medium bright stars
        size = 2.6 + Math.random() * 2.0;
        brightness = 0.6 + Math.random() * 0.25;
      } else {
        // Faint deep field stars (vast majority)
        size = 1.0 + Math.random() * 1.4;
        brightness = 0.2 + Math.random() * 0.35;
      }

      starSizes[i] = size;
      starBrightnesses[i] = brightness;
      starPhases[i] = Math.random() * Math.PI * 2;
      starSpeeds[i] = 0.8 + Math.random() * 3.2;

      // Monochrome color temperature variations
      const tempRand = Math.random();
      if (tempRand > 0.7) {
        // Cool diamond blue-white
        starColors[i * 3] = 0.92;
        starColors[i * 3 + 1] = 0.96;
        starColors[i * 3 + 2] = 1.0;
      } else if (tempRand > 0.35) {
        // Pure stark white
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 1.0;
      } else {
        // Platinum warm silver
        starColors[i * 3] = 0.96;
        starColors[i * 3 + 1] = 0.94;
        starColors[i * 3 + 2] = 0.91;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
    starGeo.setAttribute('aSpeed', new THREE.BufferAttribute(starSpeeds, 1));
    starGeo.setAttribute('aBrightness', new THREE.BufferAttribute(starBrightnesses, 1));
    starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));

    const starShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aBrightness;
        attribute vec3 aColor;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vBrightness;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Per-star scintillation / twinkling
          float twinkle = sin(uTime * aSpeed + aPhase);
          float intensity = aBrightness * (0.68 + 0.32 * twinkle);

          // Distance attenuation with realistic size clamping
          float pointSize = (aSize * (0.85 + 0.25 * twinkle)) * (360.0 / -mvPosition.z) * uPixelRatio;
          gl_PointSize = clamp(pointSize, 1.0, 36.0);

          vColor = aColor;
          vAlpha = intensity;
          vBrightness = aBrightness;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vBrightness;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Gaussian core + airy disk diffraction
          float core = exp(-dist * 14.0);
          float halo = exp(-dist * 4.5) * 0.35;

          // 4-point diffraction spike for prominent stars
          float spikes = 0.0;
          if (vBrightness > 0.8) {
            float spikeX = exp(-abs(coord.y) * 45.0) * exp(-abs(coord.x) * 3.5);
            float spikeY = exp(-abs(coord.x) * 45.0) * exp(-abs(coord.y) * 3.5);
            spikes = (spikeX + spikeY) * 0.45;
          }

          float finalAlpha = (core + halo + spikes) * vAlpha;
          gl_FragColor = vec4(vColor, clamp(finalAlpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeo, starShaderMaterial);
    scene.add(starField);

    // 4B. 3D Volumetric Floating Interstellar Dust Particles (Volumetric Parallax)
    const dustParticleCount = 1200;
    const cosmicDustGeo = new THREE.BufferGeometry();
    const cosmicDustPos = new Float32Array(dustParticleCount * 3);
    const cosmicDustVel: THREE.Vector3[] = [];

    for (let i = 0; i < dustParticleCount; i++) {
      cosmicDustPos[i * 3] = (Math.random() - 0.5) * 120;
      cosmicDustPos[i * 3 + 1] = Math.random() * 55 + 1.0;
      cosmicDustPos[i * 3 + 2] = (Math.random() - 0.5) * 110;

      cosmicDustVel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          (Math.random() - 0.5) * 0.15,
          (Math.random() - 0.5) * 0.25
        )
      );
    }
    cosmicDustGeo.setAttribute('position', new THREE.BufferAttribute(cosmicDustPos, 3));

    // Custom smooth particle circular texture
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 32;
    dustCanvas.height = 32;
    const dctx = dustCanvas.getContext('2d')!;
    const dgrad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dgrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    dgrad.addColorStop(0.35, 'rgba(230,240,255,0.4)');
    dgrad.addColorStop(1, 'rgba(255,255,255,0)');
    dctx.fillStyle = dgrad;
    dctx.fillRect(0, 0, 32, 32);
    const dustTexture = new THREE.CanvasTexture(dustCanvas);

    const cosmicDustMat = new THREE.PointsMaterial({
      size: 0.85,
      map: dustTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cosmicDustField = new THREE.Points(cosmicDustGeo, cosmicDustMat);
    scene.add(cosmicDustField);

    // 4C. Interstellar Nebula Dust Clouds (Milky Way Volumetric Gaseous Ribbon)
    const nebulaCount = 110;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaScales = new Float32Array(nebulaCount);

    for (let i = 0; i < nebulaCount; i++) {
      // Form an arc across the high background sky
      const arcAngle = (i / nebulaCount) * Math.PI * 1.6 - 0.8;
      const r = 160 + (Math.random() - 0.5) * 40;
      nebulaPos[i * 3] = Math.sin(arcAngle) * r + (Math.random() - 0.5) * 35;
      nebulaPos[i * 3 + 1] = Math.cos(arcAngle) * r * 0.6 + 45 + (Math.random() - 0.5) * 25;
      nebulaPos[i * 3 + 2] = -120 - Math.random() * 80;

      nebulaScales[i] = 30 + Math.random() * 35;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));

    const nebulaMat = new THREE.PointsMaterial({
      size: 38,
      map: dustTexture,
      transparent: true,
      opacity: 0.038,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nebulaField = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebulaField);

    // 5. Shooting Star System in 3D (Bolides with Ionization Wake)
    const shootingStarMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      linewidth: 1.8,
      blending: THREE.AdditiveBlending,
    });
    const shootingStarGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const shootingStarLine = new THREE.Line(shootingStarGeo, shootingStarMat);
    scene.add(shootingStarLine);

    // Shooting Star Glowing Head Particle
    const bolideHeadGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
    const bolideHeadMat = new THREE.PointsMaterial({
      size: 2.8,
      map: dustTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shootingHeadPoint = new THREE.Points(bolideHeadGeo, bolideHeadMat);
    scene.add(shootingHeadPoint);

    let shootingActive = false;
    let shootingProgress = 0;
    let shootingStart = new THREE.Vector3();
    let shootingEnd = new THREE.Vector3();

    const triggerShootingStar = () => {
      shootingActive = true;
      shootingProgress = 0;
      shootingStart.set(
        (Math.random() - 0.5) * 90,
        28 + Math.random() * 35,
        -45 - Math.random() * 65
      );
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 45 - 22,
        -16 - Math.random() * 18,
        (Math.random() - 0.5) * 35
      ).normalize();
      shootingEnd.copy(shootingStart).addScaledVector(dir, 55 + Math.random() * 40);
    };

    // 6. Giant Distant Wireframe Moon / Planet with Ring
    const celestialGroup = new THREE.Group();
    celestialGroup.position.set(-42, 52, -115);

    // Moon sphere wireframe
    const moonGeo = new THREE.SphereGeometry(18, 24, 18);
    const moonEdges = new THREE.EdgesGeometry(moonGeo);
    const moonMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
    });
    const moonMesh = new THREE.LineSegments(moonEdges, moonMat);
    celestialGroup.add(moonMesh);

    // Moon solid core to block stars
    const moonCoreMat = new THREE.MeshBasicMaterial({ color: 0x010103 });
    const moonCore = new THREE.Mesh(moonGeo, moonCoreMat);
    celestialGroup.add(moonCore);

    // Celestial Ring around the distant moon
    const ringGeo = new THREE.RingGeometry(24, 38, 64);
    const ringEdges = new THREE.EdgesGeometry(ringGeo);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    });
    const ringMesh = new THREE.LineSegments(ringEdges, ringMat);
    ringMesh.rotation.x = Math.PI * 0.38;
    ringMesh.rotation.y = Math.PI * 0.15;
    celestialGroup.add(ringMesh);

    scene.add(celestialGroup);

    // 7. The Main 3D Planet Surface
    const planetRadius = 45;
    const planetGroup = new THREE.Group();
    // Planet center is placed at (0, -planetRadius, 0), so the apex is at (0, 0, 0)
    planetGroup.position.set(0, -planetRadius, 0);

    // Dark core sphere to mask background stars
    const planetCoreGeo = new THREE.SphereGeometry(planetRadius * 0.998, 48, 48);
    const planetCoreMat = new THREE.MeshBasicMaterial({ color: 0x000002 });
    const planetCore = new THREE.Mesh(planetCoreGeo, planetCoreMat);
    planetGroup.add(planetCore);

    // Elegant Wireframe Contour Rings of the Planet
    const planetWireGeo = new THREE.SphereGeometry(planetRadius, 36, 24);
    const planetWireEdges = new THREE.EdgesGeometry(planetWireGeo);
    const planetWireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    });
    const planetWire = new THREE.LineSegments(planetWireEdges, planetWireMat);
    planetGroup.add(planetWire);

    // Equator & Primary Meridian Highlight Lines (brighter white)
    const equatorCurve = new THREE.EllipseCurve(0, 0, planetRadius + 0.02, planetRadius + 0.02, 0, 2 * Math.PI, false, 0);
    const equatorPoints = equatorCurve.getPoints(100);
    const equatorGeo = new THREE.BufferGeometry().setFromPoints(equatorPoints.map((p) => new THREE.Vector3(p.x, 0, p.y)));
    const equatorMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const equatorLine = new THREE.Line(equatorGeo, equatorMat);
    planetGroup.add(equatorLine);

    // Meridian line along walking path
    const meridianGeo = new THREE.BufferGeometry().setFromPoints(equatorPoints.map((p) => new THREE.Vector3(0, p.x, p.y)));
    const meridianLine = new THREE.Line(meridianGeo, equatorMat);
    planetGroup.add(meridianLine);

    // Surface Landmarks attached to the rotating planet
    const landmarkGroup = new THREE.Group();
    const landmarkCount = 28;
    for (let i = 0; i < landmarkCount; i++) {
      const angle = (i / landmarkCount) * Math.PI * 2;
      const latAngle = (Math.random() - 0.5) * 0.35; // slightly off the walking path
      const itemGroup = new THREE.Group();

      const type = i % 4;
      if (type === 0) {
        // Monolith (tall black & white wireframe slab)
        const boxGeo = new THREE.BoxGeometry(0.8, 3.2, 0.4);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        const wire = new THREE.LineSegments(edges, lineMat);
        const solid = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
        itemGroup.add(solid);
        itemGroup.add(wire);
        itemGroup.position.y = 1.6;
      } else if (type === 1) {
        // Crystal Spire (octahedron/pyramid)
        const coneGeo = new THREE.ConeGeometry(0.7, 2.5, 4);
        const edges = new THREE.EdgesGeometry(coneGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
        const wire = new THREE.LineSegments(edges, lineMat);
        itemGroup.add(wire);
        itemGroup.position.y = 1.25;
      } else if (type === 2) {
        // Impact Crater Ring on ground
        const craterCurve = new THREE.EllipseCurve(0, 0, 1.2, 0.7, 0, 2 * Math.PI, false, 0);
        const pts = craterCurve.getPoints(32);
        const craterGeo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0, p.y)));
        const craterLine = new THREE.Line(craterGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
        craterLine.rotation.x = Math.PI / 2;
        itemGroup.add(craterLine);
      } else {
        // Star Beacon Antenna
        const cylGeo = new THREE.CylinderGeometry(0.04, 0.08, 2.2, 6);
        const cylEdges = new THREE.EdgesGeometry(cylGeo);
        const wire = new THREE.LineSegments(cylEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
        itemGroup.add(wire);
        // Pulse ring
        const ring = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 0.4, 0.4, 0, 2 * Math.PI, false, 0).getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0))),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
        );
        ring.position.y = 1.1;
        itemGroup.add(ring);
        itemGroup.position.y = 1.1;
      }

      // Position along the sphere
      const markerWrapper = new THREE.Group();
      markerWrapper.rotation.z = latAngle;
      markerWrapper.rotation.x = angle;
      itemGroup.position.y += planetRadius;
      markerWrapper.add(itemGroup);
      landmarkGroup.add(markerWrapper);
    }
    planetGroup.add(landmarkGroup);
    scene.add(planetGroup);

    // 8. The Wanderer & Steed 3D Models
    // Standing at the apex (0, 0, 0) of the planet
    const duoGroup = new THREE.Group();
    duoGroup.position.set(0, 0, 0);
    duoGroup.scale.set(0.65, 0.65, 0.65); // Delicate scale so sky proportion is large and majestic

    // 8A. The Celestial White Steed (Horse)
    const horseGroup = new THREE.Group();
    horseGroup.position.set(-0.65, 0, 0); // slightly to the left

    // Materials
    const horseLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const horseSoftMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    const blackFillMat = new THREE.MeshStandardMaterial({
      color: 0x050508,
      roughness: 0.7,
      metalness: 0.15,
    });

    // Torso (flank & ribcage)
    const torsoBox = new THREE.BoxGeometry(0.85, 1.05, 2.1);
    const torsoEdges = new THREE.EdgesGeometry(torsoBox);
    const horseTorso = new THREE.LineSegments(torsoEdges, horseLineMat);
    const horseTorsoFill = new THREE.Mesh(torsoBox, blackFillMat);
    horseTorso.position.set(0, 1.75, 0);
    horseTorsoFill.position.set(0, 1.75, 0);
    horseGroup.add(horseTorso);
    horseGroup.add(horseTorsoFill);

    // Horse Neck & Head
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 2.15, -0.85);

    const neckGeo = new THREE.CylinderGeometry(0.28, 0.45, 1.2, 6);
    const neckEdges = new THREE.EdgesGeometry(neckGeo);
    const horseNeck = new THREE.LineSegments(neckEdges, horseLineMat);
    horseNeck.rotation.x = -Math.PI * 0.28;
    horseNeck.position.set(0, 0.4, -0.25);
    neckGroup.add(horseNeck);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.48, 0.85);
    const headEdges = new THREE.EdgesGeometry(headGeo);
    const horseHead = new THREE.LineSegments(headEdges, horseLineMat);
    const horseHeadFill = new THREE.Mesh(headGeo, blackFillMat);
    horseHead.position.set(0, 0.85, -0.65);
    horseHead.rotation.x = Math.PI * 0.12;
    horseHeadFill.position.copy(horseHead.position);
    horseHeadFill.rotation.copy(horseHead.rotation);
    neckGroup.add(horseHead);
    neckGroup.add(horseHeadFill);

    // Ears
    const earL = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.14, 1.1, -0.5), new THREE.Vector3(-0.14, 1.35, -0.55), new THREE.Vector3(-0.08, 1.1, -0.5)]),
      horseLineMat
    );
    const earR = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.14, 1.1, -0.5), new THREE.Vector3(0.14, 1.35, -0.55), new THREE.Vector3(0.08, 1.1, -0.5)]),
      horseLineMat
    );
    neckGroup.add(earL);
    neckGroup.add(earR);

    // Star Glyph on forehead
    const glyphCurve = new THREE.EllipseCurve(0, 0, 0.08, 0.08, 0, 2 * Math.PI, false, 0);
    const glyphGeo = new THREE.BufferGeometry().setFromPoints(glyphCurve.getPoints(12).map((p) => new THREE.Vector3(p.x, p.y, 0)));
    const glyphLine = new THREE.Line(glyphGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
    glyphLine.position.set(0, 0.96, -0.78);
    glyphLine.rotation.x = -Math.PI * 0.12;
    neckGroup.add(glyphLine);

    horseGroup.add(neckGroup);

    // Mane Strands (floating lines)
    const maneGroup = new THREE.Group();
    const maneLines: THREE.Line[] = [];
    for (let m = 0; m < 5; m++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.15, 0.1, 0.45)]),
        horseSoftMat
      );
      line.position.set(0, 2.3 - m * 0.18, -0.85 + m * 0.15);
      maneGroup.add(line);
      maneLines.push(line);
    }
    horseGroup.add(maneGroup);

    // Flowing Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 2.05, 1.05);
    const tailLines: THREE.Line[] = [];
    for (let t = 0; t < 5; t++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3((t - 2) * 0.06, -0.7, 0.35),
          new THREE.Vector3((t - 2) * 0.1, -1.5, 0.65),
        ]),
        horseSoftMat
      );
      tailGroup.add(line);
      tailLines.push(line);
    }
    horseGroup.add(tailGroup);

    // Horse 4 Legs (Hierarchical: Upper Leg -> Lower Leg -> Hoof)
    const createHorseLeg = (isFront: boolean, isLeft: boolean) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(isLeft ? -0.32 : 0.32, 1.45, isFront ? -0.75 : 0.75);

      const upperGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.75, isFront ? 0.05 : -0.05)]);
      const upperLine = new THREE.Line(upperGeo, horseLineMat);
      legRoot.add(upperLine);

      const kneeGroup = new THREE.Group();
      kneeGroup.position.set(0, -0.75, isFront ? 0.05 : -0.05);

      const lowerGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.7, 0)]);
      const lowerLine = new THREE.Line(lowerGeo, horseLineMat);
      kneeGroup.add(lowerLine);

      // Hoof ring
      const hoofGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.06, -0.7, -0.06),
        new THREE.Vector3(0.06, -0.7, -0.06),
        new THREE.Vector3(0.06, -0.7, 0.06),
        new THREE.Vector3(-0.06, -0.7, 0.06),
        new THREE.Vector3(-0.06, -0.7, -0.06),
      ]);
      const hoofLine = new THREE.Line(hoofGeo, horseLineMat);
      kneeGroup.add(hoofLine);

      legRoot.add(kneeGroup);
      return { root: legRoot, knee: kneeGroup };
    };

    const legFL = createHorseLeg(true, true);
    const legFR = createHorseLeg(true, false);
    const legRL = createHorseLeg(false, true);
    const legRR = createHorseLeg(false, false);

    horseGroup.add(legFL.root);
    horseGroup.add(legFR.root);
    horseGroup.add(legRL.root);
    horseGroup.add(legRR.root);

    duoGroup.add(horseGroup);

    // 8B. The Wanderer (Human Figure)
    const humanGroup = new THREE.Group();
    humanGroup.position.set(0.95, 0, -0.1); // walks beside the horse

    const humanLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const capeSoftMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

    // Torso Spine
    const torsoSpine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 1.85, 0)]),
      humanLineMat
    );
    humanGroup.add(torsoSpine);

    // Hooded Head
    const hoodGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const hoodEdges = new THREE.EdgesGeometry(hoodGeo);
    const hoodLine = new THREE.LineSegments(hoodEdges, humanLineMat);
    const hoodFill = new THREE.Mesh(hoodGeo, blackFillMat);
    hoodLine.position.set(0, 2.05, 0);
    hoodFill.position.set(0, 2.05, 0);
    humanGroup.add(hoodLine);
    humanGroup.add(hoodFill);

    // Scarf / Cape (dynamic undulating ribbon in solar wind)
    const capeGroup = new THREE.Group();
    capeGroup.position.set(0, 1.85, 0.05);
    const capeStrands: THREE.Line[] = [];
    for (let c = 0; c < 4; c++) {
      const capeLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3((c - 1.5) * 0.08, -0.5, 0.45),
          new THREE.Vector3((c - 1.5) * 0.12, -0.95, 0.95),
        ]),
        capeSoftMat
      );
      capeGroup.add(capeLine);
      capeStrands.push(capeLine);
    }
    humanGroup.add(capeGroup);

    // Human Legs
    const createHumanLeg = (isLeft: boolean) => {
      const hip = new THREE.Group();
      hip.position.set(isLeft ? -0.16 : 0.16, 0.95, 0);

      const upper = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.5, 0)]),
        humanLineMat
      );
      hip.add(upper);

      const knee = new THREE.Group();
      knee.position.set(0, -0.5, 0);

      const lower = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(0, -0.45, -0.15)]),
        humanLineMat
      );
      knee.add(lower);

      hip.add(knee);
      return { hip, knee };
    };

    const humanLegL = createHumanLeg(true);
    const humanLegR = createHumanLeg(false);
    humanGroup.add(humanLegL.hip);
    humanGroup.add(humanLegR.hip);

    // Human Arms
    // Left arm holding reins forward towards horse head
    const armL = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.2, 1.75, 0),
        new THREE.Vector3(-0.45, 1.5, -0.45),
        new THREE.Vector3(-0.65, 1.45, -0.75),
      ]),
      humanLineMat
    );
    humanGroup.add(armL);

    // Right arm natural swing
    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.2, 1.75, 0);
    const armR = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, -0.65, 0)]),
      humanLineMat
    );
    armRGroup.add(armR);
    humanGroup.add(armRGroup);

    // Reins connecting hand to horse muzzle
    const reinsCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.3, 1.45, -0.85), // Human hand
      new THREE.Vector3(-0.15, 1.1, -1.15), // Droop sag
      new THREE.Vector3(-0.65, 1.35, -1.45) // Horse bit
    );
    const reinsGeo = new THREE.BufferGeometry().setFromPoints(reinsCurve.getPoints(16));
    const reinsLine = new THREE.Line(reinsGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
    duoGroup.add(reinsLine);

    duoGroup.add(humanGroup);
    scene.add(duoGroup);

    // 9. Stardust Particles Kicked Up by Steps
    const dustCount = 45;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustAlphas = new Float32Array(dustCount);
    const dustVelocities: THREE.Vector3[] = [];

    for (let d = 0; d < dustCount; d++) {
      dustPositions[d * 3] = (Math.random() - 0.5) * 2;
      dustPositions[d * 3 + 1] = Math.random() * 0.2;
      dustPositions[d * 3 + 2] = (Math.random() - 0.5) * 2;
      dustAlphas[d] = 0;
      dustVelocities.push(new THREE.Vector3());
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.35,
      map: dustTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // -------------------------------------------------------------
    // 9B. The Crimson Celestial Core (The Red Object)
    // A mysterious, draggable ruby anomaly with gyroscopic celestial rings,
    // orbiting corona sparks, and dynamic gravitational influence.
    // -------------------------------------------------------------
    const redObjectGroup = new THREE.Group();
    const initialRedPos = new THREE.Vector3(1.6, 2.9, -1.8);
    redObjectGroup.position.copy(initialRedPos);
    const redTargetPos = initialRedPos.clone();

    // 1. Ruby Faceted Core (Octahedron crystal)
    const redCoreGeo = new THREE.OctahedronGeometry(0.55, 0);
    const redCoreMat = new THREE.MeshStandardMaterial({
      color: 0xff0d2e,
      emissive: 0xd90429,
      emissiveIntensity: 2.4,
      roughness: 0.16,
      metalness: 0.45,
    });
    const redCrystalMesh = new THREE.Mesh(redCoreGeo, redCoreMat);
    redObjectGroup.add(redCrystalMesh);

    // Core Wireframe Facet Edges
    const redCoreEdges = new THREE.EdgesGeometry(redCoreGeo);
    const redCoreLineMat = new THREE.LineBasicMaterial({
      color: 0xff99ae,
      linewidth: 2.2,
      transparent: true,
      opacity: 0.95,
    });
    const redCoreLines = new THREE.LineSegments(redCoreEdges, redCoreLineMat);
    redObjectGroup.add(redCoreLines);

    // 2. Gyroscopic Celestial Rings (Orbital Gimbal)
    const ring1Geo = new THREE.TorusGeometry(0.85, 0.018, 12, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xff2b4c, transparent: true, opacity: 0.85 });
    const redRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    redObjectGroup.add(redRing1);

    const ring2Geo = new THREE.TorusGeometry(1.15, 0.014, 12, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xff6b81, transparent: true, opacity: 0.65 });
    const redRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    redRing2.rotation.x = Math.PI * 0.35;
    redRing2.rotation.y = Math.PI * 0.2;
    redObjectGroup.add(redRing2);

    // 3. Orbiting Crimson Corona Sparks
    const redSparkCount = 42;
    const redSparksGeo = new THREE.BufferGeometry();
    const redSparksPos = new Float32Array(redSparkCount * 3);
    const redSparkAngles = new Float32Array(redSparkCount);
    const redSparkRadii = new Float32Array(redSparkCount);
    const redSparkSpeeds = new Float32Array(redSparkCount);
    const redSparkHeights = new Float32Array(redSparkCount);

    for (let k = 0; k < redSparkCount; k++) {
      redSparkAngles[k] = Math.random() * Math.PI * 2;
      redSparkRadii[k] = 0.65 + Math.random() * 0.85;
      redSparkSpeeds[k] = (Math.random() > 0.5 ? 1 : -1) * (1.4 + Math.random() * 2.2);
      redSparkHeights[k] = (Math.random() - 0.5) * 0.9;
    }
    redSparksGeo.setAttribute('position', new THREE.BufferAttribute(redSparksPos, 3));
    const redSparksMat = new THREE.PointsMaterial({
      size: 0.45,
      map: dustTexture,
      color: 0xff4766,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const redSparksField = new THREE.Points(redSparksGeo, redSparksMat);
    redObjectGroup.add(redSparksField);

    // 4. Dynamic PointLight inside the Red Object
    // Casts real-time glowing crimson starlight on the duo and planet ground
    const redPointLight = new THREE.PointLight(0xff1d3f, 5.0, 32);
    redObjectGroup.add(redPointLight);

    // 5. Ambient Scene Light to receive real-time illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // 6. Invisible Hitbox for smooth & forgiving mouse grab/drag
    const hitboxGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const redHitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    redObjectGroup.add(redHitbox);

    scene.add(redObjectGroup);

    // 7. Ground Projection Shadow / Crimson Resonance Aura Ring
    const groundRingGeo = new THREE.RingGeometry(0.7, 0.95, 32);
    const groundRingMat = new THREE.MeshBasicMaterial({
      color: 0xff1e40,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.set(initialRedPos.x, 0.04, initialRedPos.z);
    scene.add(groundRing);

    // 8. Ethereal Gravitational Starlight Tether Line
    const tetherPointsCount = 24;
    const tetherPositions = new Float32Array(tetherPointsCount * 3);
    const tetherGeo = new THREE.BufferGeometry();
    tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherPositions, 3));
    const tetherMat = new THREE.LineBasicMaterial({
      color: 0xff3b5c,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
    });
    const tetherLine = new THREE.Line(tetherGeo, tetherMat);
    scene.add(tetherLine);

    // 10. Mouse Interaction for Parallax and Dragging
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const planeIntersect = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();
    let isDraggingRed = false;
    let isHoveringRed = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(redHitbox);

      if (hits.length > 0) {
        isDraggingRed = true;
        try {
          renderer.domElement.setPointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
        renderer.domElement.style.cursor = 'grabbing';
        audioService.playCrimsonResonance();

        // Build drag plane passing through red object facing camera
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), redObjectGroup.position);

        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          dragOffset.copy(redObjectGroup.position).sub(planeIntersect);
        }

        onRedObjectResonanceRef.current?.({
          isDragging: true,
          distance: redObjectGroup.position.distanceTo(duoGroup.position),
          resonanceLevel: 1,
        });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.targetX = pointer.x;
      mouse.targetY = pointer.y;

      raycaster.setFromCamera(pointer, camera);

      if (isDraggingRed) {
        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          const desired = planeIntersect.clone().add(dragOffset);
          // Safety limits within celestial sphere
          desired.y = Math.max(0.65, desired.y);
          desired.x = THREE.MathUtils.clamp(desired.x, -32, 32);
          desired.z = THREE.MathUtils.clamp(desired.z, -32, 32);
          redTargetPos.copy(desired);

          const curDist = redObjectGroup.position.distanceTo(duoGroup.position);
          onRedObjectResonanceRef.current?.({
            isDragging: true,
            distance: curDist,
            resonanceLevel: Math.max(0, 1 - curDist / 15),
          });
        }
      } else {
        const hits = raycaster.intersectObject(redHitbox);
        if (hits.length > 0) {
          if (!isHoveringRed) {
            renderer.domElement.style.cursor = 'grab';
            isHoveringRed = true;
          }
        } else if (isHoveringRed) {
          renderer.domElement.style.cursor = 'default';
          isHoveringRed = false;
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRed) {
        isDraggingRed = false;
        try {
          renderer.domElement.releasePointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
        audioService.playCrimsonDrop();
        renderer.domElement.style.cursor = isHoveringRed ? 'grab' : 'default';

        const curDist = redObjectGroup.position.distanceTo(duoGroup.position);
        onRedObjectResonanceRef.current?.({
          isDragging: false,
          distance: curDist,
          resonanceLevel: Math.max(0, 1 - curDist / 15),
        });
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 11. Animation Render Loop
    let animId: number;
    let clock = new THREE.Clock();
    let walkCycle = 0;
    let lastStepTime = 0;
    let shootingStarTimer = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Mouse smoothing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Speed calculation
      let speedMult = 1.0;
      if (paceRef.current === 'pause') speedMult = 0;
      if (paceRef.current === 'walk') speedMult = 1.0;
      if (paceRef.current === 'trot') speedMult = 1.85;

      // Advance walk cycle
      walkCycle += dt * 3.6 * speedMult;

      // Rotate planet beneath them
      const planetRotSpeed = 0.04 * speedMult;
      planetGroup.rotation.x -= dt * planetRotSpeed;

      // Subtle celestial rotation & realistic astronomical scintillation
      celestialGroup.rotation.y = elapsed * 0.012;
      starField.rotation.y = elapsed * 0.0016;
      nebulaField.rotation.y = elapsed * 0.0008;
      starShaderMaterial.uniforms.uTime.value = elapsed;

      // Update Red Object position lerp
      redObjectGroup.position.lerp(redTargetPos, isDraggingRed ? 0.35 : 0.08);

      // Idle levitation oscillation when not being dragged
      const redHover = isDraggingRed ? 0 : Math.sin(elapsed * 2.4) * 0.07;
      redCrystalMesh.position.y = redHover;
      redCoreLines.position.y = redHover;

      // Rotate Red Crystal
      redCrystalMesh.rotation.x += dt * 0.9;
      redCrystalMesh.rotation.y += dt * 1.3;
      redCoreLines.rotation.copy(redCrystalMesh.rotation);

      // Rotate Gyroscopic Rings
      redRing1.rotation.x += dt * 1.6;
      redRing1.rotation.z += dt * 1.1;
      redRing2.rotation.y -= dt * 1.4;
      redRing2.rotation.x -= dt * 0.8;

      // Animate Orbiting Corona Sparks
      const sparkPosAttr = redSparksGeo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < redSparkCount; k++) {
        redSparkAngles[k] += dt * redSparkSpeeds[k];
        const rad = redSparkRadii[k] + Math.sin(elapsed * 3 + k) * 0.1;
        const sx = Math.cos(redSparkAngles[k]) * rad;
        const sz = Math.sin(redSparkAngles[k]) * rad;
        const sy = redSparkHeights[k] + Math.cos(elapsed * 2 + k) * 0.15;
        sparkPosAttr.setXYZ(k, sx, sy, sz);
      }
      sparkPosAttr.needsUpdate = true;

      // Update Ground Projection Aura Ring
      groundRing.position.x = redObjectGroup.position.x;
      groundRing.position.z = redObjectGroup.position.z;
      const heightAboveGround = Math.max(0.1, redObjectGroup.position.y);
      const groundFade = Math.max(0, 1.0 - heightAboveGround / 10.0);
      groundRingMat.opacity = groundFade * 0.45;
      groundRing.scale.setScalar(0.8 + heightAboveGround * 0.35);

      // 3D Volumetric Interstellar Dust Particles Brownian Drift & Gravitational Accretion Vortex
      const rx = redObjectGroup.position.x;
      const ry = redObjectGroup.position.y;
      const rz = redObjectGroup.position.z;

      for (let i = 0; i < dustParticleCount; i++) {
        let px = cosmicDustPos[i * 3];
        let py = cosmicDustPos[i * 3 + 1];
        let pz = cosmicDustPos[i * 3 + 2];

        // Gravitational influence from Red Object
        const dx = rx - px;
        const dy = ry - py;
        const dz = rz - pz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 160) {
          const dist = Math.sqrt(distSq) + 0.6;
          // Inward gravitational attraction
          const pull = (14.0 / (dist * dist)) * 0.55;
          cosmicDustVel[i].x += (dx / dist) * pull * dt;
          cosmicDustVel[i].y += (dy / dist) * pull * dt;
          cosmicDustVel[i].z += (dz / dist) * pull * dt;

          // Tangential orbital vortex swirl around Y axis
          const tangentX = -dz / dist;
          const tangentZ = dx / dist;
          cosmicDustVel[i].x += tangentX * 2.2 * dt;
          cosmicDustVel[i].z += tangentZ * 2.2 * dt;

          // Slight damping to keep particles bound in orbit
          cosmicDustVel[i].multiplyScalar(0.985);
        }

        cosmicDustPos[i * 3] += cosmicDustVel[i].x * dt;
        cosmicDustPos[i * 3 + 1] += cosmicDustVel[i].y * dt;
        cosmicDustPos[i * 3 + 2] += (cosmicDustVel[i].z + speedMult * 0.35) * dt;

        // Wrap particles gracefully within 3D camera frustum zone
        if (cosmicDustPos[i * 3] > 60) cosmicDustPos[i * 3] = -60;
        else if (cosmicDustPos[i * 3] < -60) cosmicDustPos[i * 3] = 60;
        if (cosmicDustPos[i * 3 + 1] > 55) cosmicDustPos[i * 3 + 1] = 1.0;
        else if (cosmicDustPos[i * 3 + 1] < 1.0) cosmicDustPos[i * 3 + 1] = 55;
        if (cosmicDustPos[i * 3 + 2] > 55) cosmicDustPos[i * 3 + 2] = -55;
        else if (cosmicDustPos[i * 3 + 2] < -55) cosmicDustPos[i * 3 + 2] = 55;
      }
      cosmicDustGeo.attributes.position.needsUpdate = true;

      // Dynamic Influence of Red Object on Character Duo
      const toRed = redObjectGroup.position.clone().sub(duoGroup.position);
      const distToDuo = toRed.length();

      // 1. Steed Neck & Wanderer Head Gaze Tracking
      const targetGazeYaw = THREE.MathUtils.clamp(Math.atan2(toRed.x, -toRed.z), -0.75, 0.75);
      neckGroup.rotation.y = THREE.MathUtils.lerp(neckGroup.rotation.y, targetGazeYaw * 0.65, 0.08);
      neckGroup.rotation.z = THREE.MathUtils.lerp(neckGroup.rotation.z, -targetGazeYaw * 0.15, 0.08);
      hoodLine.rotation.y = THREE.MathUtils.lerp(hoodLine.rotation.y, targetGazeYaw * 0.85, 0.08);
      hoodFill.rotation.y = hoodLine.rotation.y;

      // 2. Wanderer Hand Reach Gesture if Red Object is nearby
      if (distToDuo < 10.0) {
        const armReachPitch = THREE.MathUtils.clamp(-(redObjectGroup.position.y - 1.85) * 0.35 - 0.45, -1.2, 0.1);
        const armReachYaw = THREE.MathUtils.clamp((redObjectGroup.position.x - 0.95) * 0.25, -0.8, 0.8);
        armRGroup.rotation.x = THREE.MathUtils.lerp(armRGroup.rotation.x, armReachPitch, 0.08);
        armRGroup.rotation.z = THREE.MathUtils.lerp(armRGroup.rotation.z, armReachYaw, 0.08);
      }

      // 3. Ethereal Gravitational Starlight Tether
      if (distToDuo < 22.0) {
        tetherMat.opacity = THREE.MathUtils.lerp(
          tetherMat.opacity,
          Math.max(0.08, (1.0 - distToDuo / 22.0) * (0.65 + Math.sin(elapsed * 5) * 0.25)),
          0.1
        );
        const tetherPosAttr = tetherGeo.attributes.position as THREE.BufferAttribute;
        const origin = new THREE.Vector3(0.1, 1.85, -0.65);
        const destination = redObjectGroup.position.clone();
        const midPoint = origin.clone().lerp(destination, 0.5);
        midPoint.y += Math.sin(elapsed * 4) * 0.2 - 0.3;

        const curve = new THREE.QuadraticBezierCurve3(origin, midPoint, destination);
        const pts = curve.getPoints(tetherPointsCount - 1);
        pts.forEach((p, idx) => {
          tetherPosAttr.setXYZ(idx, p.x, p.y, p.z);
        });
        tetherPosAttr.needsUpdate = true;
      } else {
        tetherMat.opacity = THREE.MathUtils.lerp(tetherMat.opacity, 0, 0.1);
      }

      // Camera Position by View
      const targetCam = new THREE.Vector3();
      const lookTarget = new THREE.Vector3();

      if (viewRef.current === 'cinematic') {
        // Ultra-distant deep-space panoramic vantage: pulled deep into the cosmic abyss, planetary horizon arching below
        targetCam.set(18.0 + mouse.x * 2.5, 14.5 + mouse.y * 1.8, 45.0);
        lookTarget.set(-1.0, 3.8, -4.5);
      } else if (viewRef.current === 'close') {
        // Intimate companion angle, framed with ample starry breathing room
        targetCam.set(3.2 + mouse.x * 0.8, 3.0 + mouse.y * 0.6, 7.2);
        lookTarget.set(-0.2, 2.8, -2.4);
      } else {
        // Standard 3/4 trailing view: generous deep space perspective
        targetCam.set(4.8 + mouse.x * 1.2, 4.4 + mouse.y * 0.8, 11.0);
        lookTarget.set(-0.5, 3.8, -3.8);
      }

      camera.position.lerp(targetCam, 0.05);
      camera.lookAt(lookTarget);

      // Procedural Walking Cycles
      if (speedMult > 0.05) {
        // Audio Step trigger
        const stepInterval = 0.52 / speedMult;
        if (elapsed - lastStepTime > stepInterval) {
          lastStepTime = elapsed;
          audioService.playHoofStep(Math.random() > 0.4);

          // Emit dust puff
          for (let p = 0; p < 4; p++) {
            const idx = Math.floor(Math.random() * dustCount);
            const isHorse = Math.random() > 0.4;
            dustPositions[idx * 3] = isHorse ? -0.65 + (Math.random() - 0.5) * 0.4 : 0.95 + (Math.random() - 0.5) * 0.2;
            dustPositions[idx * 3 + 1] = 0.05;
            dustPositions[idx * 3 + 2] = (Math.random() - 0.5) * 0.8;
            dustVelocities[idx].set((Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.8, 0.8 + Math.random() * 0.6);
            dustAlphas[idx] = 0.9;
          }
        }

        // Steed Gait (Quadruped walk: LF, RF, LR, RR)
        const phaseFL = Math.sin(walkCycle + 1.2);
        const phaseFR = Math.sin(walkCycle + Math.PI + 1.2);
        const phaseRL = Math.sin(walkCycle);
        const phaseRR = Math.sin(walkCycle + Math.PI);

        legFL.root.rotation.x = phaseFL * 0.45;
        legFL.knee.rotation.x = Math.max(0, -phaseFL) * 0.65;

        legFR.root.rotation.x = phaseFR * 0.45;
        legFR.knee.rotation.x = Math.max(0, -phaseFR) * 0.65;

        legRL.root.rotation.x = phaseRL * 0.42;
        legRL.knee.rotation.x = Math.max(0, phaseRL) * 0.6;

        legRR.root.rotation.x = phaseRR * 0.42;
        legRR.knee.rotation.x = Math.max(0, phaseRR) * 0.6;

        // Horse Body & Neck Bob
        horseTorso.position.y = 1.75 + Math.sin(walkCycle * 2) * 0.05;
        horseTorsoFill.position.y = horseTorso.position.y;
        neckGroup.rotation.x = Math.sin(walkCycle * 2 - 0.4) * 0.04;

        // Human Legs & Arm Swing
        const phaseHumanL = Math.sin(walkCycle);
        const phaseHumanR = Math.sin(walkCycle + Math.PI);

        humanLegL.hip.rotation.x = phaseHumanL * 0.5;
        humanLegL.knee.rotation.x = Math.max(0, -phaseHumanL) * 0.6;

        humanLegR.hip.rotation.x = phaseHumanR * 0.5;
        humanLegR.knee.rotation.x = Math.max(0, -phaseHumanR) * 0.6;

        armRGroup.rotation.x = -phaseHumanR * 0.45;
        humanGroup.position.y = Math.sin(walkCycle * 2) * 0.035;
      } else {
        // Idle gentle breathing
        const breath = Math.sin(elapsed * 1.5) * 0.02;
        horseTorso.position.y = 1.75 + breath;
        horseTorsoFill.position.y = 1.75 + breath;
        neckGroup.rotation.x = breath * 0.5;
        humanGroup.position.y = breath * 0.5;
      }

      // Mane and Tail solar wind animation
      maneLines.forEach((m, idx) => {
        m.rotation.z = Math.sin(elapsed * 3.5 + idx) * 0.15;
      });
      tailLines.forEach((t, idx) => {
        t.rotation.z = Math.sin(elapsed * 2.8 + idx * 0.5) * 0.2;
        t.rotation.x = Math.sin(elapsed * 2.2 + idx * 0.3) * 0.1;
      });
      capeStrands.forEach((c, idx) => {
        c.rotation.z = Math.sin(elapsed * 3.2 + idx * 0.6) * 0.25;
        c.rotation.y = Math.cos(elapsed * 2.4 + idx * 0.4) * 0.15;
      });

      // Update Dust particles
      for (let d = 0; d < dustCount; d++) {
        if (dustAlphas[d] > 0.01) {
          dustPositions[d * 3] += dustVelocities[d].x * dt;
          dustPositions[d * 3 + 1] += dustVelocities[d].y * dt;
          dustPositions[d * 3 + 2] += dustVelocities[d].z * dt;
          dustAlphas[d] -= dt * 1.2;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      // Random Shooting Stars
      shootingStarTimer += dt;
      if (shootingStarTimer > 4.5 && !shootingActive && Math.random() < 0.3) {
        shootingStarTimer = 0;
        triggerShootingStar();
      }

      if (shootingActive) {
        shootingProgress += dt * 1.8;
        if (shootingProgress >= 1) {
          shootingActive = false;
          shootingStarMat.opacity = 0;
          bolideHeadMat.opacity = 0;
        } else {
          const head = new THREE.Vector3().lerpVectors(shootingStart, shootingEnd, Math.min(1, shootingProgress * 1.2));
          const tail = new THREE.Vector3().lerpVectors(shootingStart, shootingEnd, Math.max(0, shootingProgress * 1.2 - 0.35));
          const pos = shootingStarGeo.attributes.position as THREE.BufferAttribute;
          pos.setXYZ(0, tail.x, tail.y, tail.z);
          pos.setXYZ(1, head.x, head.y, head.z);
          pos.needsUpdate = true;

          const headPos = bolideHeadGeo.attributes.position as THREE.BufferAttribute;
          headPos.setXYZ(0, head.x, head.y, head.z);
          headPos.needsUpdate = true;

          const fade = Math.sin(shootingProgress * Math.PI);
          shootingStarMat.opacity = fade * 0.9;
          bolideHeadMat.opacity = fade * 1.0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 12. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      starShaderMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // 13. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      id="three-canvas-container"
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden bg-[#010104]"
    />
  );
};
