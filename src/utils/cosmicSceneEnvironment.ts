import * as THREE from 'three';

export interface CosmicEnvironment {
  starGeo: THREE.BufferGeometry;
  starShaderMaterial: THREE.ShaderMaterial;
  starField: THREE.Points;
  cosmicDustGeo: THREE.BufferGeometry;
  cosmicDustPos: Float32Array;
  cosmicDustVel: THREE.Vector3[];
  dustParticleCount: number;
  cosmicDustMat: THREE.PointsMaterial;
  dustTexture: THREE.Texture;
  floatingMoteGeo: THREE.BufferGeometry;
  floatingMoteShaderMat: THREE.ShaderMaterial;
  floatingMoteField: THREE.Points;
  nebulaGeo: THREE.BufferGeometry;
  nebulaMat: THREE.PointsMaterial;
  nebulaField: THREE.Points;
}

export function createCosmicEnvironment(scene: THREE.Scene, pixelRatio: number): CosmicEnvironment {
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

      // Strict grayscale palette: keep the sky neutral gray-white so the
      // red gift remains the only chromatic interaction accent in the scene.
      const gray = 0.74 + Math.random() * 0.26;
      starColors[i * 3] = gray;
      starColors[i * 3 + 1] = gray;
      starColors[i * 3 + 2] = gray;
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
        uPixelRatio: { value: pixelRatio },
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
    starField.name = 'star-field';
    scene.add(starField);

    // 4B. 3D Volumetric Floating Interstellar Dust Particles (Volumetric Parallax)
    const dustParticleCount = 900;
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
    // Fixed bounds cover every wrapped particle without scanning them each frame.
    cosmicDustGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 28, 0), Math.hypot(60, 28, 55));

    // Custom smooth particle circular texture
    const dustCanvas = document.createElement('canvas');
    dustCanvas.width = 32;
    dustCanvas.height = 32;
    const dctx = dustCanvas.getContext('2d')!;
    const dgrad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    dgrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    dgrad.addColorStop(0.35, 'rgba(232,232,232,0.4)');
    dgrad.addColorStop(1, 'rgba(255,255,255,0)');
    dctx.fillStyle = dgrad;
    dctx.fillRect(0, 0, 32, 32);
    const dustTexture = new THREE.CanvasTexture(dustCanvas);

    const cosmicDustMat = new THREE.PointsMaterial({
      size: 0.7,
      map: dustTexture,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cosmicDustField = new THREE.Points(cosmicDustGeo, cosmicDustMat);
    cosmicDustField.name = 'cosmic-dust-field';
    scene.add(cosmicDustField);

    // 4C. GPU-driven floating motes. These sit between the deep star dome and
    // the terrain, giving the player a quiet sense of air and depth without
    // another per-frame JavaScript particle loop.
    const floatingMoteCount = 900;
    const floatingMoteGeo = new THREE.BufferGeometry();
    const floatingMotePos = new Float32Array(floatingMoteCount * 3);
    const floatingMoteSize = new Float32Array(floatingMoteCount);
    const floatingMotePhase = new Float32Array(floatingMoteCount);
    const floatingMoteDrift = new Float32Array(floatingMoteCount * 3);
    const floatingMoteAlpha = new Float32Array(floatingMoteCount);
    const floatingMoteColor = new Float32Array(floatingMoteCount * 3);

    for (let i = 0; i < floatingMoteCount; i++) {
      // Keep most motes in the camera's playable volume, with a few above the
      // horizon so they gently parallax against the star field.
      floatingMotePos[i * 3] = (Math.random() - 0.5) * 112;
      floatingMotePos[i * 3 + 1] = 1.5 + Math.random() * 43;
      floatingMotePos[i * 3 + 2] = -68 + Math.random() * 105;
      floatingMoteSize[i] = 0.22 + Math.pow(Math.random(), 1.8) * 1.15;
      floatingMotePhase[i] = Math.random() * Math.PI * 2;
      floatingMoteDrift[i * 3] = 0.12 + Math.random() * 0.55;
      floatingMoteDrift[i * 3 + 1] = 0.08 + Math.random() * 0.38;
      floatingMoteDrift[i * 3 + 2] = 0.08 + Math.random() * 0.42;
      floatingMoteAlpha[i] = 0.16 + Math.random() * 0.34;

      // Neutral gray-white only; no blue, cyan, or purple tint in the mote
      // layer so the atmosphere stays monochrome and cinematic.
      const gray = 0.72 + Math.random() * 0.28;
      floatingMoteColor[i * 3] = gray;
      floatingMoteColor[i * 3 + 1] = gray;
      floatingMoteColor[i * 3 + 2] = gray;
    }

    floatingMoteGeo.setAttribute('position', new THREE.BufferAttribute(floatingMotePos, 3));
    floatingMoteGeo.setAttribute('aSize', new THREE.BufferAttribute(floatingMoteSize, 1));
    floatingMoteGeo.setAttribute('aPhase', new THREE.BufferAttribute(floatingMotePhase, 1));
    floatingMoteGeo.setAttribute('aDrift', new THREE.BufferAttribute(floatingMoteDrift, 3));
    floatingMoteGeo.setAttribute('aAlpha', new THREE.BufferAttribute(floatingMoteAlpha, 1));
    floatingMoteGeo.setAttribute('aColor', new THREE.BufferAttribute(floatingMoteColor, 3));
    floatingMoteGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 23, -15), Math.hypot(58, 25, 62));

    const floatingMoteShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uPixelRatio: { value: pixelRatio },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 aDrift;
        attribute float aAlpha;
        attribute vec3 aColor;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec3 motePosition = position;
          float slowTime = uTime * 0.16;
          motePosition.x += sin(slowTime + aPhase) * aDrift.x;
          motePosition.y += sin(slowTime * 1.37 + aPhase * 1.71) * aDrift.y;
          motePosition.z += cos(slowTime * 0.83 + aPhase * 0.63) * aDrift.z;

          vec4 mvPosition = modelViewMatrix * vec4(motePosition, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float twinkle = 0.8 + 0.2 * sin(uTime * 0.7 + aPhase * 2.0);
          gl_PointSize = clamp(aSize * (280.0 / -mvPosition.z) * uPixelRatio, 1.0, 18.0);
          vColor = aColor;
          vAlpha = aAlpha * twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          float core = 1.0 - smoothstep(0.0, 0.16, dist);
          gl_FragColor = vec4(vColor, (glow * 0.42 + core * 0.58) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const floatingMoteField = new THREE.Points(floatingMoteGeo, floatingMoteShaderMat);
    floatingMoteField.name = 'floating-mote-field';
    scene.add(floatingMoteField);

    // 4D. Interstellar Nebula Dust Clouds (Milky Way Volumetric Gaseous Ribbon)
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
    nebulaField.name = 'nebula-field';
    scene.add(nebulaField);


  return {
    starGeo, starShaderMaterial, starField,
    cosmicDustGeo, cosmicDustPos, cosmicDustVel, dustParticleCount, cosmicDustMat, dustTexture,
    floatingMoteGeo, floatingMoteShaderMat, floatingMoteField,
    nebulaGeo, nebulaMat, nebulaField,
  };
}
