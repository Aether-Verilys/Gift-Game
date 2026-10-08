import * as THREE from 'three';
import type { TarotCardDef } from '../types';
import { audioService } from '../services/audioService';
import { createTarotBackTexture } from './tarotCanvasTexture';
import { createEcologyModels } from './ecologyModels';

export interface Card3DItem {
  group: THREE.Group;
  mesh: THREE.Mesh;
  hitbox: THREE.Mesh;
  borderLines: THREE.LineSegments;
  sproutGroup: THREE.Group;
  cardMaterials: THREE.Material[];
  cardDef: TarotCardDef;
  index: number;
  initialPos: THREE.Vector3;
  groundPos: THREE.Vector3;
  initialRot: THREE.Euler;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  targetScale: number;
  isHovered: boolean;
  isSelected: boolean;
  spinProgress: number;
  sproutProgress: number;
  dissolveProgress: number;
  flyTriggered: boolean;
}

export interface TarotCardSceneController {
  cardsSkyGroup: THREE.Group;
  readonly cards3DList: Card3DItem[];
  cardScale: number;
  rebuildSkyCards: (cards: TarotCardDef[]) => void;
  triggerCardSelectAnimation: (item: Card3DItem) => void;
  triggerRevealFx: (item: Card3DItem) => void;
  updateRevealFx: (dt: number) => void;
  dispose: () => void;
}

export function createTarotCardScene(options: {
  planetGroup: THREE.Group;
  planetRadius: number;
  dustTexture: THREE.Texture;
  stageRef: { current: number };
  cardTitleRevealRef: { current: boolean };
  onSelectCard: (card: TarotCardDef) => void;
}): TarotCardSceneController {
  const { planetGroup, planetRadius, dustTexture, stageRef, cardTitleRevealRef, onSelectCard } = options;
    // 10B. Tarot card resting on the planet surface.
    // The player walks into it to open the journey.
    // -------------------------------------------------------------
    const cardsSkyGroup = new THREE.Group();
    cardsSkyGroup.position.set(0, 0, 0);
    cardsSkyGroup.visible = false;
    // The card is a planet landmark, so it remains fixed to the ground while
    // the planet rotates beneath the walking duo.
    planetGroup.add(cardsSkyGroup);

    let cards3DList: Card3DItem[] = [];

    const cardBoxGeo = new THREE.BoxGeometry(4.2, 6.6, 0.12);
    const cardEdgesGeo = new THREE.EdgesGeometry(cardBoxGeo);
    const cardScale = 1.42;
    const tarotStillLifeModels = createEcologyModels({ value: 0 });
    const stillLifeCache = new Map<string, THREE.Mesh>();
    const stillLifeLoading = new Set<string>();
    let stillLifeGeneration = 0;

    // A small, reusable reveal burst: expanding ground rings plus motes that
    // lift through the same patch of soil where the card disappears.
    const revealFxGroup = new THREE.Group();
    revealFxGroup.name = 'tarot-reveal-effect';
    revealFxGroup.visible = false;
    // Keep the FX outside cardsSkyGroup. That group is hidden immediately
    // after the card phase, while the reveal burst must remain visible during
    // the handoff into the encounter phase.
    planetGroup.add(revealFxGroup);
    const revealFxRings = [
      new THREE.Mesh(
        new THREE.RingGeometry(0.22, 0.34, 64),
        new THREE.MeshBasicMaterial({ color: 0xe8d6a5, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      ),
      new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.18, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      ),
    ];
    revealFxRings.forEach((ring) => {
      ring.rotation.x = -Math.PI / 2;
      ring.renderOrder = 20;
      (ring.material as THREE.MeshBasicMaterial).depthTest = false;
      revealFxGroup.add(ring);
    });
    const revealFxParticleCount = 96;
    const revealFxPositions = new Float32Array(revealFxParticleCount * 3);
    const revealFxVelocities: THREE.Vector3[] = Array.from({ length: revealFxParticleCount }, () => new THREE.Vector3());
    const revealFxGeo = new THREE.BufferGeometry();
    revealFxGeo.setAttribute('position', new THREE.BufferAttribute(revealFxPositions, 3));
    const revealFxMat = new THREE.PointsMaterial({
      size: 0.78,
      map: dustTexture,
      color: 0xf5e7c0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const revealFxParticles = new THREE.Points(revealFxGeo, revealFxMat);
    revealFxParticles.renderOrder = 21;
    revealFxGroup.add(revealFxParticles);
    let revealFxProgress = -1;

    const triggerRevealFx = (item: Card3DItem) => {
      // The card is nested under cardsSkyGroup, while the FX stays attached
      // to planetGroup so it survives the phase handoff. Convert the exact
      // card landing point into the FX parent's local space first.
      item.group.updateWorldMatrix(true, false);
      planetGroup.updateWorldMatrix(true, false);
      const landingWorld = item.group.localToWorld(new THREE.Vector3(0, 0, 0));
      revealFxGroup.position.copy(planetGroup.worldToLocal(landingWorld));
      revealFxGroup.rotation.copy(cardsSkyGroup.rotation);
      revealFxGroup.scale.setScalar(1.4);
      revealFxGroup.visible = true;
      revealFxProgress = 0;
      for (let i = 0; i < revealFxParticleCount; i++) {
        revealFxPositions[i * 3] = (Math.random() - 0.5) * 0.55;
        revealFxPositions[i * 3 + 1] = 0.08 + Math.random() * 0.2;
        revealFxPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 2.3;
        revealFxVelocities[i].set(Math.cos(angle) * speed, 0.8 + Math.random() * 2.4, Math.sin(angle) * speed);
      }
      revealFxGeo.attributes.position.needsUpdate = true;
    };

    const updateRevealFx = (dt: number) => {
      if (revealFxProgress < 0) return;
      revealFxProgress = Math.min(1, revealFxProgress + dt / 1.35);
      const ringEase = 1 - Math.pow(1 - revealFxProgress, 2.4);
      revealFxRings[0].scale.setScalar(1 + ringEase * 8.5);
      revealFxRings[1].scale.setScalar(1 + ringEase * 4.5);
      (revealFxRings[0].material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.72 * (1 - revealFxProgress));
      (revealFxRings[1].material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - revealFxProgress * 1.25));
      for (let i = 0; i < revealFxParticleCount; i++) {
        revealFxPositions[i * 3] += revealFxVelocities[i].x * dt;
        revealFxPositions[i * 3 + 1] += revealFxVelocities[i].y * dt;
        revealFxPositions[i * 3 + 2] += revealFxVelocities[i].z * dt;
        revealFxVelocities[i].y -= dt * 2.6;
        revealFxVelocities[i].multiplyScalar(0.965);
      }
      revealFxGeo.attributes.position.needsUpdate = true;
      revealFxMat.opacity = Math.max(0, 0.92 * (1 - revealFxProgress));
      if (revealFxProgress >= 1) {
        revealFxProgress = -1;
        revealFxGroup.visible = false;
      }
    };

    const rebuildSkyCards = (cards: TarotCardDef[]) => {
      cardTitleRevealRef.current = false;
      revealFxGroup.visible = false;
      revealFxProgress = -1;
      while (cardsSkyGroup.children.length > 0) {
        const obj = cardsSkyGroup.children[0];
        cardsSkyGroup.remove(obj);
        obj.traverse((child) => {
          if (!(child instanceof THREE.Mesh || child instanceof THREE.LineSegments)) return;
          if (child.geometry !== cardBoxGeo && child.geometry !== cardEdgesGeo) child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.Material) material.dispose();
          });
        });
      }
      cards3DList = [];

      if (!cards || cards.length === 0) return;

      // A single card stands upright on the ground like a doorway just ahead
      // of the duo, with its face turned toward the approach direction.
      // Keep a separate surface point for the fall. The card stands slightly
      // above it, then lowers onto this point before fading away.
      const cardGroundOffset = 0;
      const cardStandLift = 1.05;
      const cardSpreadConfigs = [-9.2, 0, 9.2].map((x, index) => {
        // Approximate the imported moon's curved surface under each card so
        // all three bases hug the same ground instead of floating on one flat
        // horizontal line.
        const surfaceY = planetRadius - (x * x) / (2 * planetRadius);
        // Fan the outer cards toward the center: left card turns right,
        // right card turns left, while the middle card stays square to the
        // approach direction.
        const inwardYaw = index === 0 ? -0.24 : index === 2 ? 0.24 : 0;
        // Roll in the screen plane to match the reference fan: the left card
        // rises toward its right edge, while the right card drops toward its
        // right edge. This is independent from the inward Y-axis yaw above.
        const screenRoll = index === 0 ? 0.11 : index === 2 ? -0.11 : 0;
        return {
          pos: new THREE.Vector3(x, surfaceY, 0),
          rot: new THREE.Euler(0.0, inwardYaw, screenRoll),
        };
      });
      // Counter-rotate the local anchor so the card reaches the apex exactly
      // halfway through its stage leg as the planet turns.
      const stageLeg = Math.PI * 2 / 4;
      // Counter-rotate the landmark against the planet turn so each card
      // arrives at the apex/front of the walking route for its stage.
      cardsSkyGroup.rotation.x = -(Math.max(1, Math.min(3, stageRef.current)) - 1) * stageLeg - stageLeg / 2;

      cards.slice(0, 3).forEach((cardDef, idx) => {
        const config = cardSpreadConfigs[idx] || cardSpreadConfigs[0];
        const cardGroup = new THREE.Group();
        // Use the bottom edge as the pivot so the reveal can fall backward
        // naturally instead of rotating around the card's center.
        const groundY = config.pos.y - cardGroundOffset;
        cardGroup.position.set(config.pos.x, groundY + cardStandLift, config.pos.z);
        cardGroup.rotation.copy(config.rot);
        // A smaller doorway keeps the card readable while leaving more of the
        // planet surface visible around it.
        cardGroup.scale.setScalar(cardScale);

        const backTex = createTarotBackTexture();

        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.5, metalness: 0.3, transparent: true, opacity: 1 });
        const backMat = new THREE.MeshStandardMaterial({
          map: backTex,
          roughness: 0.3,
          metalness: 0.2,
          transparent: true,
          opacity: 1,
        });

        // Both large faces intentionally use the back texture. The drawn
        // orientation remains in cardDef for the later reading, but the
        // player cannot infer the card identity before opening it.
        const materials = [edgeMat, edgeMat, edgeMat, edgeMat, backMat, backMat];
        const cardMesh = new THREE.Mesh(cardBoxGeo, materials);
        cardMesh.position.y = 3.3;
        cardMesh.castShadow = true;
        cardMesh.receiveShadow = true;
        cardGroup.add(cardMesh);

        const borderMat = new THREE.LineBasicMaterial({
          color: 0xc8b273,
          transparent: true,
          opacity: 0.75,
          linewidth: 2,
        });
        const borderLines = new THREE.LineSegments(cardEdgesGeo, borderMat);
        borderLines.position.y = 3.3;
        cardGroup.add(borderLines);

        const hitbox = new THREE.Mesh(
          new THREE.BoxGeometry(4.6, 7.0, 0.8),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        hitbox.position.y = 3.3;
        cardGroup.add(hitbox);

        // A small procedural still-life grows from the ground after the card
        // has fallen. It deliberately uses neutral stone/ivory materials so
        // the card title remains the reveal's focal point.
        const sproutGroup = new THREE.Group();
        sproutGroup.name = 'tarot-sprout-still-life';
        const sproutSeed = Array.from(cardDef.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) + stageRef.current * 31;
        const sproutRand = (salt: number) => {
          const value = Math.sin(sproutSeed * 12.9898 + salt * 78.233) * 43758.5453;
          return value - Math.floor(value);
        };
        const stillLifeAssets = ['moon-rock', 'mushroom', 'crystal-reeds', 'spiral-fern', 'lantern-plant', 'silver-grass'];
        const stillLifeSlots = Array.from({ length: 7 }, (_, s) => {
          const angle = sproutRand(s + 1) * Math.PI * 2;
          const radius = 0.55 + sproutRand(s + 8) * 2.1;
          return {
            asset: stillLifeAssets[s % stillLifeAssets.length],
            position: new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
            scale: 0.52 + sproutRand(s + 16) * 0.85,
          };
        });
        for (const slot of stillLifeSlots) {
          const placeholder = new THREE.Group();
          placeholder.userData.asset = slot.asset;
          placeholder.position.copy(slot.position);
          placeholder.scale.setScalar(slot.scale);
          sproutGroup.add(placeholder);
          const cached = stillLifeCache.get(slot.asset);
          if (cached) {
            const copy = cached.clone();
            placeholder.add(copy);
          } else if (!stillLifeLoading.has(slot.asset)) {
            stillLifeLoading.add(slot.asset);
            tarotStillLifeModels.load(slot.asset, 2.2, 1.7, 0, (model) => {
              stillLifeCache.set(slot.asset, model);
              cards3DList.forEach((candidate) => {
                candidate.sproutGroup.children.forEach((child) => {
                  if (!(child instanceof THREE.Group) || child.children.length || child.userData.asset !== slot.asset) return;
                  // Populate only empty placeholders for this asset. The
                  // position/scale remains card-specific and randomized.
                  const copy = model.clone();
                  child.add(copy);
                });
              });
            });
          }
        }
        sproutGroup.visible = false;
        sproutGroup.position.set(config.pos.x, groundY, config.pos.z);
        cardsSkyGroup.add(sproutGroup);

        cardsSkyGroup.add(cardGroup);

        cards3DList.push({
          group: cardGroup,
          mesh: cardMesh,
          hitbox,
          borderLines,
          sproutGroup,
          cardMaterials: materials,
          cardDef,
          index: idx,
          initialPos: cardGroup.position.clone(),
          initialRot: config.rot.clone(),
          groundPos: new THREE.Vector3(config.pos.x, groundY, config.pos.z),
          targetPos: cardGroup.position.clone(),
          targetRot: config.rot.clone(),
          targetScale: cardScale,
          isHovered: false,
          isSelected: false,
          spinProgress: 0,
          sproutProgress: 0,
          dissolveProgress: 0,
          flyTriggered: false,
        });
      });
    };

    const triggerCardSelectAnimation = (selectedItem: Card3DItem) => {
      if (selectedItem.isSelected) return;
      selectedItem.isSelected = true;
      // Seed the animation above zero so the first rendered frame already
      // shows a visible backward tilt instead of waiting for a full frame of
      // smoothstep easing to accumulate.
      selectedItem.spinProgress = 0.055;
      audioService.playTarotFlip();
      setTimeout(() => {
        audioService.playChoiceConfirm();
      }, 180);
      setTimeout(() => {
        // The card has completed its fall and is fully transparent by this
        // point; hand control to the approach phase so the title can begin
        // fading in while the new still-life finishes growing.
        cardTitleRevealRef.current = true;
        onSelectCard(selectedItem.cardDef);
      }, 1550);
    };

  return {
    cardsSkyGroup,
    get cards3DList() { return cards3DList; },
    cardScale,
    rebuildSkyCards,
    triggerCardSelectAnimation,
    triggerRevealFx,
    updateRevealFx,
    dispose() {
      tarotStillLifeModels.dispose();
      cardBoxGeo.dispose();
      cardEdgesGeo.dispose();
      revealFxGeo.dispose();
      revealFxMat.dispose();
      revealFxRings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
    },
  };
}
