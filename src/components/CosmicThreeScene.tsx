import { createHorseAnimationController } from '../utils/horseAnimationController';
import { createTravelerAnimationController } from '../utils/travelerAnimationController';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WalkPace, CameraView, EncounterData, GamePhase, TarotCardDef } from '../types';
import { audioService } from '../services/audioService';
import { createTarotEntities } from '../utils/createTarotEntities';
import { createGiftOfferingEffect } from '../utils/giftOfferingShader';
import { createEcologyModels } from '../utils/ecologyModels';
import { createPlanetEcology } from '../utils/createPlanetEcology';
import { createCosmicEnvironment } from '../utils/cosmicSceneEnvironment';
import { createEncounterTitle } from '../utils/cosmicSceneTitle';
import { createShootingStar } from '../utils/cosmicSceneShootingStar';
import { createTarotCardScene } from '../utils/cosmicSceneCards';
import { disposeThreeObject } from '../utils/disposeThreeObject';
import { createFlowTrail, updateFlowTrail } from '../utils/cosmicSceneTrails';
import { Language } from '../i18n';

interface CosmicThreeSceneProps {
  pace: WalkPace;
  view: CameraView;
  sceneryShift?: string;
  gamePhase?: GamePhase;
  stageCards?: TarotCardDef[];
  stage?: number;
  onSelectCard?: (card: TarotCardDef) => void;
  encounterActive?: boolean;
  encounterType?: EncounterData['type'] | null;
  encounterCard?: TarotCardDef | null;
  onApproachArrived?: () => void; // fired when the duo reaches the colossus
  onCardArrived?: () => void; // fired when the duo reaches the ground card
  giftOffered?: boolean | null; // true: offered, false: kept
  onGiftDroppedOnEntity?: () => void;
  onRedObjectResonance?: (state: { isDragging: boolean; distance: number; resonanceLevel: number }) => void;
  language?: Language;
  onJourneyComplete?: () => void; // fired once the duo closes a full lap of the planet
  onSceneReady?: () => void;
}

export const CosmicThreeScene: React.FC<CosmicThreeSceneProps> = ({
  pace,
  view,
  sceneryShift = 'normal',
  gamePhase = 'card_selection',
  stageCards = [],
  stage = 1,
  onSelectCard,
  encounterActive = false,
  encounterType = null,
  encounterCard = null,
  onApproachArrived,
  onCardArrived,
  giftOffered = null,
  onGiftDroppedOnEntity,
  onRedObjectResonance,
  language = 'zh',
  onJourneyComplete,
  onSceneReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Store state in refs to update in real-time inside the Three.js render loop
  const paceRef = useRef<WalkPace>(pace);
  const viewRef = useRef<CameraView>(view);
  const sceneryShiftRef = useRef<string>(sceneryShift);
  const gamePhaseRef = useRef<GamePhase>(gamePhase);
  const stageCardsRef = useRef<TarotCardDef[]>(stageCards);
  const stageRef = useRef(stage);
  const onSelectCardRef = useRef(onSelectCard);
  const updateCardsCallback = useRef<((cards: TarotCardDef[]) => void) | null>(null);
  const encounterActiveRef = useRef<boolean>(encounterActive);
  const encounterTypeRef = useRef<EncounterData['type'] | null>(encounterType);
  const encounterCardRef = useRef<TarotCardDef | null>(encounterCard);
  // The in-world card title is deliberately held back until the physical
  // card has finished falling and disappearing. This keeps the hidden card
  // from leaking its identity before the reveal moment.
  const cardTitleRevealRef = useRef(false);
  const onApproachArrivedRef = useRef(onApproachArrived);
  const onCardArrivedRef = useRef(onCardArrived);
  const giftOfferedRef = useRef<boolean | null>(giftOffered);
  const onGiftDroppedOnEntityRef = useRef(onGiftDroppedOnEntity);
  const onRedObjectResonanceRef = useRef(onRedObjectResonance);
  const languageRef = useRef<Language>(language);
  const onJourneyCompleteRef = useRef(onJourneyComplete);
  const onSceneReadyRef = useRef(onSceneReady);

  useEffect(() => {
    onJourneyCompleteRef.current = onJourneyComplete;
  }, [onJourneyComplete]);

  useEffect(() => {
    onSceneReadyRef.current = onSceneReady;
  }, [onSceneReady]);

  useEffect(() => {
    onRedObjectResonanceRef.current = onRedObjectResonance;
  }, [onRedObjectResonance]);

  useEffect(() => {
    onGiftDroppedOnEntityRef.current = onGiftDroppedOnEntity;
  }, [onGiftDroppedOnEntity]);

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
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  useEffect(() => {
    stageCardsRef.current = stageCards;
    updateCardsCallback.current?.(stageCards);
  }, [stageCards]);

  useEffect(() => {
    stageRef.current = stage;
    // Rebuild the fixed planet landmark after the stage ref changes. React's
    // stageCards effect can run first during a transition, so refreshing here
    // prevents stage two/three cards from keeping the previous stage angle.
    updateCardsCallback.current?.(stageCardsRef.current);
  }, [stage]);

  useEffect(() => {
    languageRef.current = language;
    updateCardsCallback.current?.(stageCardsRef.current);
  }, [language]);

  useEffect(() => {
    onSelectCardRef.current = onSelectCard;
  }, [onSelectCard]);

  useEffect(() => {
    encounterActiveRef.current = encounterActive;
  }, [encounterActive]);

  useEffect(() => {
    encounterTypeRef.current = encounterType;
  }, [encounterType]);

  useEffect(() => {
    encounterCardRef.current = encounterCard;
  }, [encounterCard]);

  useEffect(() => {
    onApproachArrivedRef.current = onApproachArrived;
  }, [onApproachArrived]);

  useEffect(() => {
    onCardArrivedRef.current = onCardArrived;
  }, [onCardArrived]);

  useEffect(() => {
    giftOfferedRef.current = giftOffered;
  }, [giftOffered]);

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
    // Lit planet materials receive the real silhouettes from characters and props.
    renderer.shadowMap.enabled = true;
    // Variance shadows remove the acne/PCF shimmer that appears when the
    // receiver is a rotating curved planet. A single detail light below owns
    // the shadow map, so there is no second shadow cascade to fight with it.
    renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(renderer.domElement);

    const markShadowFlags = (root: THREE.Object3D, cast = true, receive = true) => {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = cast;
        object.receiveShadow = receive;
      });
    };

    // 3A. In-world encounter title; animation details live in a focused helper.
    const encounterTitle = createEncounterTitle(scene, () => ({
      card: encounterCardRef.current,
      active: cardTitleRevealRef.current && (
        gamePhaseRef.current === 'approaching' ||
        gamePhaseRef.current === 'encounter_decision'
      ),
      language: languageRef.current,
      stage: stageRef.current,
    }));
    // 4. Starfield, dust and floating motes. Kept in a dedicated helper so this
    // scene component can focus on gameplay state and interaction.
    const cosmicEnvironment = createCosmicEnvironment(
      scene,
      Math.min(window.devicePixelRatio || 1, 2),
    );
    const {
      starGeo,
      starShaderMaterial,
      starField,
      cosmicDustGeo,
      cosmicDustPos,
      cosmicDustVel,
      dustParticleCount,
      cosmicDustMat,
      dustTexture,
      floatingMoteGeo,
      floatingMoteShaderMat,
      floatingMoteField,
      nebulaGeo,
      nebulaMat,
      nebulaField,
    } = cosmicEnvironment;

    // 5. Shooting stars are self-contained and do not depend on game state.
    const shootingStar = createShootingStar(scene, dustTexture);

    // 6. Imported distant planet
    const celestialGroup = new THREE.Group();
    celestialGroup.position.set(-72, 42, -115);

    scene.add(celestialGroup);
    const celestialModels = createEcologyModels({ value: 0 });
    celestialModels.replacePlanet(celestialGroup);

    // A second, smaller world sits on the far side of the sky. Its own group
    // stays outside the walkable planet, so it can turn independently at a
    // barely perceptible astronomical pace.
    const halfMoonGroup = new THREE.Group();
    halfMoonGroup.name = 'half-moon-background';
    halfMoonGroup.position.set(75, -20, -195);
    scene.add(halfMoonGroup);
    celestialModels.replaceHalfMoon(halfMoonGroup, 17);

    // 7. The Main 3D Planet Surface
    // Keep the walking world broad and readable around the duo. All surface
    // landmarks, ecology, orbit paths and encounter anchors derive from this
    // value, so changing it enlarges the planet as one consistent space.
    const planetRadius = 70;
    const planetGroup = new THREE.Group();
    // Planet center is placed at (0, -planetRadius, 0), so the apex is at (0, 0, 0)
    planetGroup.position.set(0, -planetRadius, 0);

    // The walkable surface is supplied by the imported black-and-white Moon
    // GLB. While it loads the group remains empty by design: no procedural
    // sphere, contour wireframe, or fallback geometry is allocated.
    celestialModels.replaceWalkablePlanet(planetGroup, planetRadius, () => onSceneReadyRef.current?.());

    // Surface Landmarks attached to the rotating planet
    const landmarkGroup = new THREE.Group();
    const crystalSpireRoots: THREE.Group[] = [];
    const surfaceMonoliths: { root: THREE.Group; baseY?: number }[] = [];
    const impactCraters: { root: THREE.Group; baseY?: number }[] = [];
    const starBeacons: { root: THREE.Group; baseY?: number }[] = [];
    const landmarkCount = 28;
    for (let i = 0; i < landmarkCount; i++) {
      const angle = (i / landmarkCount) * Math.PI * 2;
      const latAngle = (Math.random() - 0.5) * 0.35; // slightly off the walking path
      const itemGroup = new THREE.Group();

      const type = i % 4;
      if (type === 0) {
        // Authored P2 replacement attaches directly to this empty root.
        surfaceMonoliths.push({ root: itemGroup });
      } else if (type === 1) {
        // Empty placement root for the imported crystal spire.
        itemGroup.position.y = 1.25;
        crystalSpireRoots.push(itemGroup);
      } else if (type === 2) {
        // Authored P2 replacement attaches directly to this empty root.
        impactCraters.push({ root: itemGroup });
      } else {
        // Authored P2 replacement attaches directly to this empty root.
        starBeacons.push({ root: itemGroup });
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
    markShadowFlags(landmarkGroup, true, true);

    // Terrain, flora, ruins, spores and birds (see createPlanetEcology).
    const ecology = createPlanetEcology(planetRadius, Math.min(window.devicePixelRatio || 1, 2), {
      crystalSpires: crystalSpireRoots,
      surfaceMonoliths,
      impactCraters,
      starBeacons,
    });
    planetGroup.add(ecology.surface);
    scene.add(ecology.sky);

    // Origin gate: the duo starts beneath it, and a full lap of the planet
    // brings them back through it to end the journey.
    const originGate = new THREE.Group();
    const gateMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (const side of [-1, 1]) {
      const pillarGeo = new THREE.BoxGeometry(0.5, 7, 0.5);
      const pillar = new THREE.Group();
      const pillarMesh = new THREE.Mesh(pillarGeo, new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.92,
        metalness: 0.05,
      }));
      pillarMesh.castShadow = true;
      pillarMesh.receiveShadow = true;
      pillar.add(pillarMesh);
      pillar.add(new THREE.LineSegments(new THREE.EdgesGeometry(pillarGeo), gateMat));
      pillar.position.set(side * 4.2, 3.5, 0);
      originGate.add(pillar);
    }
    const archGeo = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, 4.2, 2.4, 0, Math.PI, false, 0).getPoints(32).map((p) => new THREE.Vector3(p.x, p.y + 7, 0))
    );
    originGate.add(new THREE.Line(archGeo, gateMat));
    originGate.position.y = planetRadius;
    const originGatePivot = new THREE.Group();
    originGatePivot.add(originGate);
    planetGroup.add(originGatePivot);
    markShadowFlags(originGatePivot, true, true);
    scene.add(planetGroup);

    const duoGroup = new THREE.Group();
    duoGroup.position.set(0, 0, 0);
    duoGroup.scale.set(0.65, 0.65, 0.65); // Delicate scale so sky proportion is large and majestic

    let horseAnimation: ReturnType<typeof createHorseAnimationController> | null = null;
    let loadedHorse: THREE.Object3D | null = null;
    let horseDisposed = false;
    new GLTFLoader().load('/assets/horse/horse.glb', (gltf) => {
      if (horseDisposed) { disposeThreeObject(gltf.scene); return; }
      loadedHorse = gltf.scene;
      try {
        horseAnimation = createHorseAnimationController(loadedHorse, gltf.animations);
      } catch (error) {
        console.warn('Horse animation unavailable; horse remains static.', error);
      }
      // Normalize the imported model in a wrapper: animation tracks keep their
      // authored transforms, and the horse faces the journey's -Z direction.
      const horseMount = new THREE.Group();
      horseMount.add(loadedHorse);
      horseMount.rotation.y = Math.PI;
      horseMount.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(horseMount, true);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 3.2 / Math.max(size.y, 0.001);
      horseMount.scale.setScalar(scale);
      horseMount.position.set(-0.65 - center.x * scale, -bounds.min.y * scale, -center.z * scale);
      duoGroup.add(horseMount);
      markShadowFlags(horseMount, true, true);
    }, undefined, (error) => {
      if (horseDisposed) return;
      console.warn('Saddled horse failed to load.', error);
    });

    // Mixamo bone names match, but the imported rigs have different bind axes
    // and units. Convert the clips while keeping the traveler's proportions.
    let travelerAnimation: ReturnType<typeof createTravelerAnimationController> | null = null;
    let travelerModel: THREE.Object3D | null = null;
    // The gift is authored as a scene-level object so it can still be dragged
    // freely. Keep a reference to the traveler's palm and use its world pose
    // as the resting target during an encounter instead of a hard-coded point
    // in front of the character.
    let travelerHand: THREE.Object3D | null = null;
    let travelerDisposed = false;
    new GLTFLoader().load('/assets/traveler.glb', (gltf) => {
      if (travelerDisposed) { disposeThreeObject(gltf.scene); return; }
      travelerModel = gltf.scene;
      const wrapper = new THREE.Group();
      wrapper.add(travelerModel);
      wrapper.rotation.y = Math.PI;
      wrapper.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(wrapper, true);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      // Normalize the traveler's height before the shared duo scale.
      const scale = 2.15 / Math.max(size.y, 0.001);
      wrapper.scale.setScalar(scale);
      wrapper.position.set(0.95 - center.x * scale, -bounds.min.y * scale, -0.1 - center.z * scale);
      duoGroup.add(wrapper);
      travelerHand = gltf.scene.getObjectByName('mixamorig:RightHand')
        ?? gltf.scene.getObjectByName('mixamorig:LeftHand')
        ?? null;
      markShadowFlags(wrapper, true, true);
      new GLTFLoader().load('/assets/traveler/Soldier.glb', (library) => {
        try {
          if (!travelerDisposed) {
            travelerAnimation = createTravelerAnimationController(gltf.scene, library.scene, library.animations);
          }
        } catch (error) {
          console.warn('Mixamo Walk/Idle conversion failed; traveler remains static.', error);
        } finally {
          disposeThreeObject(library.scene);
        }
      }, undefined, (error) => {
        if (!travelerDisposed) console.warn('Mixamo Walk/Idle clips failed to load; traveler remains static.', error);
      });
    }, undefined, (error) => {
      if (travelerDisposed) return;
      console.warn('Mixamo traveler failed to load.', error);
    });

    scene.add(duoGroup);

    const horseTrail = createFlowTrail(new THREE.Vector3(-0.65, 0.32, 0.42), 0xd9e7ff, 4.8, 0.62, 0.2, 0.92);
    const travelerTrail = createFlowTrail(new THREE.Vector3(0.95, 0.24, 0.32), 0xffffff, 4.2, 0.52, 2.1, -0.72);
    duoGroup.add(horseTrail.group, travelerTrail.group);

    const giftTrailGroup = new THREE.Group();
    const giftTrail = createFlowTrail(new THREE.Vector3(0, 0, 0), 0xff5678, 5.2, 0.78, 1.4, 1.18);
    giftTrailGroup.add(giftTrail.group);
    giftTrailGroup.visible = false;
    scene.add(giftTrailGroup);

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    const backpackOffset = new THREE.Vector3(0.95, 1.5, -0.45);
    const hoveringEncounterPos = new THREE.Vector3(1.3, 2.2, -1.8);
    const handGiftOffset = new THREE.Vector3(0, -0.035, 0.12);
    const travelerHandTarget = new THREE.Vector3();
    const travelerHandQuaternion = new THREE.Quaternion();
    const getTravelerHandTarget = () => {
      if (!travelerHand) return null;
      // AnimationMixer updates the hand's local transform before this loop;
      // refresh the parent chain so the world-space target is current too.
      travelerHand.updateWorldMatrix(true, false);
      travelerHand.getWorldPosition(travelerHandTarget);
      travelerHand.getWorldQuaternion(travelerHandQuaternion);
      travelerHandTarget.add(handGiftOffset.clone().applyQuaternion(travelerHandQuaternion));
      return travelerHandTarget;
    };
    const redObjectGroup = new THREE.Group();
    const initialRedPos = backpackOffset.clone();
    redObjectGroup.position.copy(initialRedPos);
    redObjectGroup.scale.set(0.35, 0.35, 0.35); // compact jewel in backpack
    const redTargetPos = initialRedPos.clone();

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

    // Casts real-time glowing crimson hesitation on the duo and planet ground
    const redPointLight = new THREE.PointLight(0xff1d3f, 5.0, 32);
    // The red core is an emissive accent; its tiny point-light shadow adds a
    // third moving shadow map and causes shimmer on nearby particles.
    redPointLight.castShadow = false;
    redObjectGroup.add(redPointLight);

    // Keep ambient lift low enough that a real cast shadow can read as a
    // distinct dark shape on the pale planetary surface.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);

    const hitboxGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const redHitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    redObjectGroup.add(redHitbox);

    scene.add(redObjectGroup);
    markShadowFlags(redObjectGroup, true, false);

    // -------------------------------------------------------------
    // 9C. Dynamic Encounter Objects in 3D Space
    // Materializes when a Tarot card is drawn, approaches the duo,
    // and reacts dynamically when the red gift is offered or kept.
    // -------------------------------------------------------------
    // The colossus is anchored to the planet surface, so it rises over the
    // horizon as the duo walks, and sinks back into the ground after the
    // choice while the journey carries on. Angles are measured from the apex
    // (negative = ahead of the duo along -Z).
    const encounterArriveAngle = -0.585; // where the duo stops in front of it
    const encounterSinkDepth = 60; // deep enough to hide the widest crown inside the planet
    const encounterRootGroup = new THREE.Group();
    encounterRootGroup.visible = false;
    planetGroup.add(encounterRootGroup);
    const planetXAxis = new THREE.Vector3(1, 0, 0);
    let encounterShownType: EncounterData['type'] | null = null;
    let encounterAnchor = 0; // planet-local angle of the colossus
    let encounterLift = -1; // 0 = standing on the surface, -1 = fully sunk
    let encounterSinkTimer = -1;
    let encounterChoirPlayed = false;

    const giftOffering = createGiftOfferingEffect();
    const tarotEntities = createTarotEntities({ planetRadius, applyOffering: giftOffering.apply });
    const encounterSubGroups = tarotEntities.groups;
    const encounterClearRadius = tarotEntities.clearRadius;
    for (const monument of new Set(Object.values(encounterSubGroups))) {
      encounterRootGroup.add(monument);
    }
    // Low sacred uplights reveal the dark authored pedestal and give the
    // colossus a readable vertical silhouette. They follow the encounter root
    // so they travel and sink with the monument, and cast no shadows to keep
    // the encounter lighting inexpensive.
    const colossusUplights: Array<{ light: THREE.SpotLight; target: THREE.Object3D }> = [];
    const uplightSpecs: Array<[number, number, number, number]> = [
      [0xffe4bd, 10, 0, 0],
      [0xbfdcff, 8, 2.9, 2.9],
      [0xd8c7ff, 8, -2.9, 2.9],
    ];
    for (const [color, intensity, x, z] of uplightSpecs) {
      const light = new THREE.SpotLight(color, intensity, 46, Math.PI / 3, 0.82, 1.45);
      light.name = 'colossus-sacred-uplight';
      light.position.set(x, 0.35, z);
      light.castShadow = false;
      const target = new THREE.Object3D();
      target.position.set(0, 12, 0);
      light.target = target;
      encounterRootGroup.add(target);
      encounterRootGroup.add(light);
      colossusUplights.push({ light, target });
    }
    // A fixed world-space sun covers the planet and encounters as the ground
    // rotates. The receiving planet material must be lit for shadows to appear.
    const worldKeyLight = new THREE.DirectionalLight(0xe4eaff, 1.25);
    worldKeyLight.name = 'world-key-sun';
    // Light comes from screen-right and travels toward the left side of the
    // walking surface. Keep both directional sources aligned to this cue.
    worldKeyLight.position.set(52, 78, 46);
    // Keep this as the broad scene key, but leave shadow casting to the tight
    // surface light. Two overlapping shadow maps are a common source of
    // temporal shimmer on small props.
    worldKeyLight.castShadow = false;
    worldKeyLight.shadow.camera.left = -105;
    worldKeyLight.shadow.camera.right = 105;
    worldKeyLight.shadow.camera.top = 105;
    worldKeyLight.shadow.camera.bottom = -105;
    worldKeyLight.shadow.camera.near = 1;
    worldKeyLight.shadow.camera.far = 240;
    worldKeyLight.shadow.bias = -0.00045;
    worldKeyLight.shadow.normalBias = 0.12;
    // The planet center is at y = -planetRadius; aim the sun there so its
    // shadow rays intersect the spherical surface instead of passing above
    // the stationary props on the upper cap.
    worldKeyLight.target.position.set(0, -planetRadius, 0);
    worldKeyLight.shadow.camera.updateProjectionMatrix();
    scene.add(worldKeyLight);
    scene.add(worldKeyLight.target);

    // A low blue fill keeps the unlit side readable without flattening the
    // directional shadow. It has no shadow map and therefore stays cheap.
    const worldFillLight = new THREE.HemisphereLight(0x8b9bc7, 0x05050a, 0.08);
    worldFillLight.name = 'world-fill-light';
    scene.add(worldFillLight);

    // The world sun covers the whole planet, but its 2048px map is too broad
    // to preserve the small shadows of rocks and plants. This second parallel
    // light is a high-resolution local cascade for the visible walking cap.
    const surfaceKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    surfaceKeyLight.name = 'surface-detail-sun';
    surfaceKeyLight.position.set(24, 38, 26);
    surfaceKeyLight.castShadow = true;
    surfaceKeyLight.shadow.mapSize.set(4096, 4096);
    surfaceKeyLight.shadow.camera.left = -48;
    surfaceKeyLight.shadow.camera.right = 48;
    surfaceKeyLight.shadow.camera.top = 48;
    surfaceKeyLight.shadow.camera.bottom = -30;
    surfaceKeyLight.shadow.camera.near = 0.5;
    surfaceKeyLight.shadow.camera.far = 140;
    surfaceKeyLight.shadow.bias = 0.00045;
    surfaceKeyLight.shadow.normalBias = 0.08;
    surfaceKeyLight.shadow.radius = 1;
    // VSM supports an explicit shadow intensity. Keeping this below 1 avoids
    // a crushed black silhouette while making the prop shadows read clearly.
    surfaceKeyLight.shadow.intensity = 1.0;
    surfaceKeyLight.target.position.set(0, -2, 0);
    surfaceKeyLight.shadow.camera.updateProjectionMatrix();
    scene.add(surfaceKeyLight);
    scene.add(surfaceKeyLight.target);

    // -------------------------------------------------------------
    // 10A. Encounter Sweeping Light Effect (扫光)
    // Triggers when the red gift is dropped onto the Tarot object. The
    // visible sweep lives in the colossus shader; this light only warms
    // the surroundings as the energy front climbs.
    // -------------------------------------------------------------
    const sweepPointLight = new THREE.PointLight(0xff4466, 0, 60, 1.6);
    sweepPointLight.position.set(0, 0, 6);
    encounterRootGroup.add(sweepPointLight);
    const defaultMonumentTop = 44.5;
    let offerPrimeTarget = 0;

    let sweepActive = false;
    let sweepProgress = 0;
    const sweepDuration = 2.4;

    // Crimson burst sparks when gift dissolves/is absorbed
    const burstSparkCount = 48;
    const burstSparkGeo = new THREE.BufferGeometry();
    const burstSparkPos = new Float32Array(burstSparkCount * 3);
    const burstSparkVel: THREE.Vector3[] = [];
    for (let b = 0; b < burstSparkCount; b++) {
      burstSparkVel.push(new THREE.Vector3());
    }
    burstSparkGeo.setAttribute('position', new THREE.BufferAttribute(burstSparkPos, 3));
    const burstSparkMat = new THREE.PointsMaterial({
      size: 0.85,
      map: dustTexture,
      color: 0xf2f2f2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const burstSparkPoints = new THREE.Points(burstSparkGeo, burstSparkMat);
    burstSparkPoints.name = 'crimson-burst';
    scene.add(burstSparkPoints);

    let burstActive = false;
    let burstTimer = 0;

    const triggerGiftOffering = () => {
      if (sweepActive) return;
      sweepActive = true;
      sweepProgress = 0;

      // 1. Red gift disappears: hide & scale to 0
      redObjectGroup.visible = false;
      redObjectGroup.scale.set(0, 0, 0);

      // 2. Trigger crimson absorption spark burst
      burstActive = true;
      burstTimer = 0;
      burstSparkMat.opacity = 1.0;
      const burstOrigin = encounterRootGroup.localToWorld(new THREE.Vector3(0, 1.2, 1));
      for (let b = 0; b < burstSparkCount; b++) {
        burstSparkPos[b * 3] = burstOrigin.x;
        burstSparkPos[b * 3 + 1] = burstOrigin.y;
        burstSparkPos[b * 3 + 2] = burstOrigin.z;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const speed = 2.5 + Math.random() * 4.5;
        burstSparkVel[b].set(
          Math.cos(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * speed + 1.8,
          Math.cos(phi) * Math.sin(theta) * speed
        );
      }
      burstSparkGeo.attributes.position.needsUpdate = true;

      // 3. Audio & callback
      audioService.playCrimsonResonance();
      setTimeout(() => {
        audioService.playChoiceConfirm();
      }, 180);

      onGiftDroppedOnEntityRef.current?.();
    };

    // -------------------------------------------------------------
    // 10B. Tarot cards and their reveal animation are isolated from the scene loop.
    const cardScene = createTarotCardScene({
      planetGroup,
      planetRadius,
      dustTexture,
      stageRef,
      cardTitleRevealRef,
      onSelectCard: (card) => onSelectCardRef.current?.(card),
    });
    const { cardsSkyGroup, cardScale } = cardScene;
    cardScene.rebuildSkyCards(stageCardsRef.current);
    updateCardsCallback.current = cardScene.rebuildSkyCards;

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

      // Check click on 3D Tarot Cards in Sky
      if (gamePhaseRef.current === 'card_selection' && cardArrived && cardScene.cards3DList.length > 0) {
        const hitboxes = cardScene.cards3DList.map((c) => c.hitbox);
        const cardHits = raycaster.intersectObjects(hitboxes);
        if (cardHits.length > 0) {
          const hitObj = cardHits[0].object;
          const clickedItem = cardScene.cards3DList.find((c) => c.hitbox === hitObj);
          if (clickedItem && !clickedItem.isSelected) {
            cardScene.triggerCardSelectAnimation(clickedItem);
            return;
          }
        }
      }

      // Check click on Red Object (Gift)
      if (redObjectGroup.visible) {
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
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.targetX = pointer.x;
      mouse.targetY = pointer.y;

      raycaster.setFromCamera(pointer, camera);

      // 3D Card Hover Detection in Sky
      if (gamePhaseRef.current === 'card_selection' && cardArrived && cardScene.cards3DList.length > 0) {
        const hitboxes = cardScene.cards3DList.map((c) => c.hitbox);
        const cardHits = raycaster.intersectObjects(hitboxes);
        if (cardHits.length > 0) {
          const hitObj = cardHits[0].object;
          const hoveredItem = cardScene.cards3DList.find((c) => c.hitbox === hitObj);
          cardScene.cards3DList.forEach((item) => {
            const isTarget = item === hoveredItem;
            if (isTarget && !item.isHovered) {
              audioService.playHoverChime();
            }
            item.isHovered = isTarget;
          });
          renderer.domElement.style.cursor = 'pointer';
          return;
        } else {
          let hadHover = false;
          cardScene.cards3DList.forEach((item) => {
            if (item.isHovered) hadHover = true;
            item.isHovered = false;
          });
          if (hadHover) {
            renderer.domElement.style.cursor = 'default';
          }
        }
      }

      // Dragging Red Object
      if (isDraggingRed) {
        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          const desired = planeIntersect.clone().add(dragOffset);
          desired.y = Math.max(0.65, desired.y);
          desired.x = THREE.MathUtils.clamp(desired.x, -32, 32);
          desired.z = THREE.MathUtils.clamp(desired.z, -32, 32);
          redTargetPos.copy(desired);

          const monument = encounterTypeRef.current ? encounterSubGroups[encounterTypeRef.current] : undefined;
          offerPrimeTarget =
            gamePhaseRef.current === 'encounter_decision' && monument?.visible &&
            raycaster.intersectObject(monument, true).length > 0 ? 1 : 0.35;

          const curDist = redObjectGroup.position.distanceTo(duoGroup.position);
          onRedObjectResonanceRef.current?.({
            isDragging: true,
            distance: curDist,
            resonanceLevel: Math.max(0, 1 - curDist / 15),
          });
        }
      } else if (redObjectGroup.visible) {
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
        offerPrimeTarget = 0;
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

        // Check if red gift was dragged towards and dropped onto the encounter entity
        if (
          encounterActiveRef.current &&
          encounterRootGroup.visible &&
          gamePhaseRef.current === 'encounter_decision'
        ) {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
          raycaster.setFromCamera(pointer, camera);
          const monument = encounterTypeRef.current ? encounterSubGroups[encounterTypeRef.current] : undefined;
          // Use the visible silhouette, not distance to the old tiny pivot.
          if (monument && raycaster.intersectObject(monument, true).length > 0) {
            triggerGiftOffering();
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 11. Animation Render Loop
    let animId: number;
    const timer = new THREE.Timer();
    timer.connect(document);
    let lastStepTime = 0;
    let shootingStarTimer = 0;

    // Journey: planet rotation is the single, continuous travel distance.
    const TAU = Math.PI * 2;
    const walkRotSpeed = 0.04; // rad/s at a walking pace
    let gaitMult = 1;
    let prevPhase: GamePhase | null = null;
    // The lap is split into four equal legs: gate → colossus 1 → 2 → 3 → gate.
    const LEG = TAU / 4;
    // Stop before the card, leaving a readable gap between the duo and its
    // doorway. The angular offset is converted by the planet radius.
    const CARD_STOP_ANGLE = -0.1;
    const legDuration = 6; // seconds per leg, regardless of how far the duo strolled
    const legEaseShare = 0.3; // final share of each leg spent slowing into the stop
    // Time of the cruise+ease curve below is 1.569 * distance / cruise.
    const legTimeFactor = 1.569;
    let legCruise = 0.3; // rad/s, recomputed at the start of each leg
    let legStartRot = 0;
    let legSpan = 1;
    const beginLeg = (target: number) => {
      legStartRot = planetGroup.rotation.x;
      legTarget = target;
      legSpan = Math.max(1e-3, target - legStartRot);
      legCruise = legTimeFactor * legSpan / legDuration;
    };
    let legTarget = 0; // planet rotation where the current leg ends
    let approachArrived = false;
    let cardArrived = false;
    let homecomingDone = false;
    let gateLift = 0;
    let lapBase = 0; // planet rotation where the current lap began
    let prevStage = stageRef.current;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      timer.update();
      const rawDt = timer.getDelta();
      const dt = Number.isFinite(rawDt) ? Math.min(Math.max(rawDt, 0), 0.1) : 0;
      const elapsed = timer.getElapsed();

      // Mouse smoothing
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const phase = gamePhaseRef.current;
      // Begin fetching while the current card is still on the ground.
      for (const card of stageCardsRef.current) tarotEntities.load(card.encounter.type);
      if (encounterTypeRef.current) tarotEntities.load(encounterTypeRef.current);
      if (stageRef.current < prevStage) {
        // Restarted mid-lap: begin a fresh lap from where the duo stands.
        lapBase = planetGroup.rotation.x;
        originGatePivot.rotation.x = -lapBase;
      }
      prevStage = stageRef.current;
      if (phase !== prevPhase) {
        if (phase === 'card_selection') {
          const stageBase = Math.max(0, Math.min(2, stageRef.current - 1)) * LEG;
          beginLeg(lapBase + stageBase + LEG / 2 + CARD_STOP_ANGLE);
          cardArrived = false;
        } else if (phase === 'approaching') {
          // Each colossus waits at its own quarter of the lap, buried until
          // the duo draws near.
          beginLeg(lapBase + Math.min(3, stageRef.current) * LEG);
          approachArrived = false;
          encounterAnchor = encounterArriveAngle - legTarget;
          encounterShownType = encounterTypeRef.current;
          encounterLift = -1;
          encounterSinkTimer = -1;
          encounterChoirPlayed = false;
        } else if (phase === 'homecoming') {
          // The last leg closes the lap at the origin gate.
          beginLeg(lapBase + TAU);
          homecomingDone = false;
        }
        prevPhase = phase;
      }
      if (phase === 'approaching' && !encounterShownType) encounterShownType = encounterTypeRef.current;

      // Rotate the ground in the opposite direction of travel. The horse and
      // wanderer face toward -Z (the encounter), so the terrain must drift
      // toward +Z beneath their feet to make them visibly advance forward.
      let paceMult = 1.0;
      if (paceRef.current === 'pause') paceMult = 0;
      if (paceRef.current === 'trot') paceMult = 1.85;
      const prevRot = planetGroup.rotation.x;
      // Strolling while choosing a card never eats into the next leg.
      const strollCap = lapBase + Math.min(3, stageRef.current) * LEG - 1.3;
      const capEase = THREE.MathUtils.clamp((strollCap - prevRot) / 0.3, 0, 1);
      let nextRot = prevRot + dt * walkRotSpeed * paceMult * capEase;
      const legProgress = THREE.MathUtils.clamp((prevRot - legStartRot) / legSpan, 0, 1);
      // Same speed curve for every leg: cruise, then ease into the stop.
      const legStep = (cruise: number) => {
        const remaining = legTarget - prevRot;
        const v = cruise * THREE.MathUtils.clamp(remaining / (legSpan * legEaseShare), 0.15, 1);
        return Math.min(legTarget, prevRot + v * dt);
      };
      if (phase === 'card_selection') {
        // Card approach follows the actual walking pace. It can take as long
        // as the player wants; no fixed-duration easing controls this leg.
        nextRot = prevRot + dt * walkRotSpeed * paceMult;
        nextRot = Math.min(legTarget, nextRot);
        if (!cardArrived && legTarget - nextRot < 1e-4) {
          cardArrived = true;
          paceRef.current = 'pause';
          onCardArrivedRef.current?.();
        }
      } else if (phase === 'approaching') {
        nextRot = legStep(legCruise);
        if (!approachArrived && legTarget - nextRot < 1e-4) {
          approachArrived = true;
          onApproachArrivedRef.current?.();
        }
      } else if (phase === 'encounter_decision' && prevRot < legTarget - 1e-4) {
        // Arrival was skipped: dash the rest of the way.
        nextRot = legStep(legCruise * 4);
      } else if (phase === 'homecoming') {
        nextRot = legStep(legCruise);
        if (!homecomingDone && legTarget - nextRot < 1e-4) {
          homecomingDone = true;
          // Back at the origin gate: a full lap is identical to rotation 0.
          nextRot = 0;
          lapBase = 0;
          legTarget = 0; // hold at the gate until the reading opens
          originGatePivot.rotation.x = 0;
          onJourneyCompleteRef.current?.();
        }
      }
      const groundStep = homecomingDone && nextRot === 0 && prevRot > 1 ? 0 : nextRot - prevRot;
      planetGroup.rotation.x = nextRot;

      // The origin gate stays buried during the stages (it would block the
      // sky cards) and rises ahead on the final leg to mark the lap's end.
      const gateTarget = phase === 'homecoming'
        ? THREE.MathUtils.smoothstep(legProgress, 0.35, 0.8)
        : phase === 'final_reading' ? 1 : 0;
      gateLift = THREE.MathUtils.lerp(gateLift, gateTarget, 0.06);
      originGate.position.y = planetRadius - (1 - gateLift) * 10;
      originGate.visible = gateLift > 0.001;

      // Gait follows the actual ground speed so feet never skate.
      const groundMult = dt > 1e-6
        ? THREE.MathUtils.clamp(groundStep / dt / walkRotSpeed, 0, 3.4)
        : 0;
      gaitMult = THREE.MathUtils.lerp(gaitMult, groundMult, 0.12);
      const speedMult = gaitMult < 0.02 ? 0 : gaitMult;
      horseAnimation?.update(dt, groundMult);
      travelerAnimation?.update(dt, groundMult);

      // Advance walk cycle

      // Subtle celestial rotation & realistic astronomical scintillation
      celestialGroup.rotation.y = elapsed * 0.012;
      halfMoonGroup.rotation.y = elapsed * 0.03;
      starField.rotation.y = elapsed * 0.0016;
      nebulaField.rotation.y = elapsed * 0.0008;
      starShaderMaterial.uniforms.uTime.value = elapsed;
      floatingMoteShaderMat.uniforms.uTime.value = elapsed;

      // Update Red Object position lerp
      redObjectGroup.position.lerp(redTargetPos, isDraggingRed ? 0.35 : 0.08);

      // The duo leaves two quiet, directional ribbons behind as they travel.
      // Their intensity follows actual ground speed, so they settle completely
      // when the scene is waiting for a choice.
      const trailIntensity = THREE.MathUtils.clamp(speedMult * 0.34, 0, 0.46);
      updateFlowTrail(horseTrail, elapsed, trailIntensity, speedMult);
      updateFlowTrail(travelerTrail, elapsed + 0.45, trailIntensity * 0.82, speedMult * 0.92);

      // The gift uses the same language while being dragged: a single tail
      // points away from its current motion instead of orbiting its core.
      const giftVelocity = redTargetPos.clone().sub(redObjectGroup.position);
      const giftSpeed = THREE.MathUtils.clamp(giftVelocity.length() * 3.2, 0, 2.8);
      const giftVisible = redObjectGroup.visible && (isDraggingRed || giftSpeed > 0.06);
      giftTrailGroup.visible = giftVisible;
      if (giftVisible) {
        giftTrailGroup.position.copy(redObjectGroup.position);
        giftTrailGroup.rotation.set(0, 0, 0);
        const giftDirection = giftVelocity.lengthSq() > 1e-5
          ? giftVelocity.normalize().negate()
          : new THREE.Vector3(0, 0, 1);
        giftTrailGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), giftDirection);
        giftTrailGroup.scale.setScalar(0.72 + Math.min(0.45, giftSpeed * 0.16));
        updateFlowTrail(giftTrail, elapsed, THREE.MathUtils.clamp(giftSpeed * 0.22, 0.12, 0.62), 1.3 + giftSpeed);
      }

      // Idle levitation oscillation when not being dragged
      const redHover = isDraggingRed ? 0 : Math.sin(elapsed * 2.4) * 0.07;
      redCrystalMesh.position.y = redHover;
      redCoreLines.position.y = redHover;

      // Rotate Red Crystal
      redCrystalMesh.rotation.x += dt * 0.9;
      redCrystalMesh.rotation.y += dt * 1.3;
      redCoreLines.rotation.copy(redCrystalMesh.rotation);

      // 3D Volumetric Interstellar Dust Particles Brownian Drift & Gravitational Accretion Vortex
      const rx = redObjectGroup.position.x;
      const ry = redObjectGroup.position.y;
      const rz = redObjectGroup.position.z;

      for (let i = 0; i < dustParticleCount; i++) {
        let px = cosmicDustPos[i * 3];
        let py = cosmicDustPos[i * 3 + 1];
        let pz = cosmicDustPos[i * 3 + 2];

        // Recover a particle if an invalid value ever enters the simulation.
        if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) {
          px = (Math.random() - 0.5) * 120;
          py = Math.random() * 55 + 1;
          pz = (Math.random() - 0.5) * 110;
          cosmicDustPos[i * 3] = px;
          cosmicDustPos[i * 3 + 1] = py;
          cosmicDustPos[i * 3 + 2] = pz;
          cosmicDustVel[i].set(0, 0, 0);
        }
        if (!Number.isFinite(cosmicDustVel[i].x) || !Number.isFinite(cosmicDustVel[i].y) || !Number.isFinite(cosmicDustVel[i].z)) {
          cosmicDustVel[i].set(0, 0, 0);
        }

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

      // Colossus lifecycle: rise during the approach, stand for the choice,
      // then sink back into the planet while the duo walks on.
      if (encounterShownType) {
        if (phase === 'approaching') {
          // Rise out of the ground over the last stretch of the leg.
          encounterLift = THREE.MathUtils.smoothstep(legProgress, 0.3, 0.85) - 1;
        } else if (giftOfferedRef.current === null && phase === 'encounter_decision') {
          encounterLift = THREE.MathUtils.lerp(encounterLift, 0, 0.1);
        } else {
          if (encounterSinkTimer < 0) encounterSinkTimer = 0;
          encounterSinkTimer += dt;
          encounterLift = -THREE.MathUtils.smoothstep((encounterSinkTimer - 1.6) / 3.2, 0, 1);
          if (encounterLift <= -0.999) encounterShownType = null;
        }
      }
      // Fire once as the monument rises, including a skipped approach.
      if (encounterShownType && !encounterChoirPlayed && encounterLift > -0.98
        && (phase === 'approaching' || phase === 'encounter_decision')) {
        encounterChoirPlayed = true;
        audioService.playColossusChoir();
      }
      encounterRootGroup.visible = encounterShownType !== null;
      if (encounterShownType) {
        for (const monument of Object.values(encounterSubGroups)) monument.visible = false;
        encounterSubGroups[encounterShownType as EncounterData['type']].visible = true;
        const fittedHeight = tarotEntities.heights[encounterShownType] ?? defaultMonumentTop;
        const r = planetRadius + encounterLift * Math.max(encounterSinkDepth, fittedHeight + 16);
        encounterRootGroup.position.set(0, r * Math.cos(encounterAnchor), r * Math.sin(encounterAnchor));
        encounterRootGroup.quaternion.setFromAxisAngle(planetXAxis, encounterAnchor);
      }

      // Plants and ruins retreat into the ground where the colossus stands.
      ecology.setClearing(
        encounterShownType ? encounterAnchor : null,
        encounterShownType ? encounterClearRadius[encounterShownType] ?? 0.4 : 0
      );
      ecology.update(dt, elapsed);

      // Gift Trajectory
      if (encounterActiveRef.current && encounterTypeRef.current) {
        // Reactive Red Object & Sweep Light Animation
        if (giftOfferedRef.current === true && !isDraggingRed) {
          if (!sweepActive && redObjectGroup.visible) {
            triggerGiftOffering();
          }
        } else if (giftOfferedRef.current === false && !isDraggingRed) {
          // Kept gift: settle back into the traveler's hand instead of
          // returning to the old scene-space backpack point.
          redObjectGroup.visible = true;
          redTargetPos.copy(getTravelerHandTarget() ?? backpackOffset);
          redObjectGroup.scale.lerp(new THREE.Vector3(0.35, 0.35, 0.35), 0.08);
          redCoreMat.emissiveIntensity = 1.8 + Math.sin(elapsed * 2.5) * 0.5;
        } else if (giftOfferedRef.current === null && !isDraggingRed) {
          // Hold the gift in the traveler's palm while it is waiting to be
          // offered. The fallback keeps the interaction usable if the model
          // has not finished loading yet.
          redObjectGroup.visible = true;
          redTargetPos.copy(getTravelerHandTarget() ?? hoveringEncounterPos);
          redObjectGroup.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.08);
          redCoreMat.emissiveIntensity = 2.4;
        }
      } else {
        // Keep the gift attached to the traveler's hand between encounters as
        // well, so it never appears as an unparented prop in front of them.
        if (!isDraggingRed && redObjectGroup.visible) {
          redTargetPos.copy(getTravelerHandTarget() ?? backpackOffset);
          redObjectGroup.scale.lerp(new THREE.Vector3(0.35, 0.35, 0.35), 0.1);
          redCoreMat.emissiveIntensity = 1.6 + Math.sin(elapsed * 2.5) * 0.5;
        }
      }

      // Re-enable Red Gift for next stage or reset (tucked inside backpack)
      if (giftOfferedRef.current === null && !redObjectGroup.visible && gamePhaseRef.current !== 'encounter_decision') {
        redObjectGroup.visible = true;
        redObjectGroup.scale.set(0.35, 0.35, 0.35);
        const handTarget = getTravelerHandTarget() ?? backpackOffset;
        redObjectGroup.position.copy(handTarget);
        redTargetPos.copy(handTarget);
      }

      // Update gift offering on the colossus surface (扫光 shader)
      const offerU = giftOffering.uniforms;
      offerU.uOfferTime.value = elapsed;
      encounterRootGroup.updateWorldMatrix(true, false);
      offerU.uOfferRootInverse.value.copy(encounterRootGroup.matrixWorld).invert();
      offerU.uOfferPrime.value = THREE.MathUtils.lerp(offerU.uOfferPrime.value, offerPrimeTarget, 0.12);
      if (sweepActive) {
        const monumentTop = encounterShownType
          ? tarotEntities.heights[encounterShownType] ?? defaultMonumentTop
          : defaultMonumentTop;
        sweepProgress = Math.min(1, sweepProgress + dt / sweepDuration);
        // Ease-out climb: surges up the base, then settles into the crown.
        const climb = 1 - Math.pow(1 - sweepProgress, 2.2);
        offerU.uOfferFront.value = THREE.MathUtils.lerp(-2, monumentTop + 6, climb);
        offerU.uOfferSweep.value = Math.min(1, sweepProgress * 6) * (1 - THREE.MathUtils.smoothstep(sweepProgress, 0.82, 1));
        offerU.uOfferInfuse.value = Math.min(1, sweepProgress * 3);
        sweepPointLight.position.y = Math.min(offerU.uOfferFront.value, monumentTop);
        sweepPointLight.intensity = offerU.uOfferSweep.value * 120;
        if (sweepProgress >= 1) {
          sweepActive = false;
          offerU.uOfferSweep.value = 0;
          sweepPointLight.intensity = 0;
        }
      } else if (!encounterShownType) {
        // Fade the infusion out once the colossus has sunk.
        offerU.uOfferInfuse.value = THREE.MathUtils.lerp(offerU.uOfferInfuse.value, 0, 0.06);
        if (offerU.uOfferInfuse.value < 0.01) offerU.uOfferFront.value = -10;
      }

      // Update Crimson Burst Sparks
      if (burstActive) {
        burstTimer += dt;
        const pAttr = burstSparkGeo.attributes.position as THREE.BufferAttribute;
        for (let b = 0; b < burstSparkCount; b++) {
          burstSparkPos[b * 3] += burstSparkVel[b].x * dt;
          burstSparkPos[b * 3 + 1] += burstSparkVel[b].y * dt;
          burstSparkPos[b * 3 + 2] += burstSparkVel[b].z * dt;
          burstSparkVel[b].y -= dt * 2.2;
          burstSparkVel[b].multiplyScalar(0.965);
        }
        pAttr.needsUpdate = true;
        burstSparkMat.opacity = Math.max(0, 1.0 - burstTimer / 1.15);
        if (burstTimer > 1.15) {
          burstActive = false;
          burstSparkMat.opacity = 0;
        }
      }

      // 3D Tarot Cards in Sky Animation Loop
      if (gamePhaseRef.current === 'card_selection' || gamePhaseRef.current === 'approaching') {
        cardsSkyGroup.visible = true;
        const anyCardSelected = cardScene.cards3DList.some((c) => c.isSelected);

        cardScene.cards3DList.forEach((item) => {
          if (item.isSelected) {
            // Reveal sequence: fall backward, settle on the ground, fade out,
            // then let the neutral still-life grow from the same spot.
            // The first third is reserved for the fall, so the backward tilt
            // is visible on the very first few frames after the click.
            item.spinProgress = Math.min(1, item.spinProgress + dt / 1.5);
            const fallProgress = THREE.MathUtils.smoothstep(item.spinProgress, 0.0, 0.27);
            const fadeProgress = THREE.MathUtils.smoothstep(item.spinProgress, 0.38, 0.68);
            const sproutProgress = THREE.MathUtils.smoothstep(item.spinProgress, 0.55, 1.0);
            item.sproutProgress = sproutProgress;
            if (item.spinProgress >= 0.38 && item.spinProgress - dt / 1.5 < 0.38) cardScene.triggerRevealFx(item);
            item.group.position.lerpVectors(item.initialPos, item.groundPos, fallProgress);
            item.group.rotation.set(-Math.PI * 0.5 * fallProgress, item.initialRot.y, item.initialRot.z);
            item.group.scale.setScalar(cardScale);
            item.group.visible = fadeProgress < 0.995;
            const cardOpacity = 1 - fadeProgress;
            item.cardMaterials.forEach((material) => {
              if ('opacity' in material) material.opacity = cardOpacity;
              material.transparent = cardOpacity < 0.999;
            });
            (item.borderLines.material as THREE.LineBasicMaterial).opacity = cardOpacity;
            item.hitbox.visible = false;
            item.sproutGroup.visible = sproutProgress > 0.005;
            item.sproutGroup.scale.setScalar(Math.max(0.001, sproutProgress));
            item.sproutGroup.children.forEach((child, index) => {
              child.position.y = 0.18 * sproutProgress;
              child.rotation.y += dt * (0.18 + index * 0.03);
            });
          } else if (anyCardSelected) {
            // The unchosen cards dissolve away instead of popping out. A
            // slight outward drift makes the three-card choice feel airy.
            item.dissolveProgress = Math.min(1, item.dissolveProgress + dt / 0.72);
            const dissolve = THREE.MathUtils.smoothstep(item.dissolveProgress, 0, 1);
            item.group.visible = dissolve < 0.995;
            item.sproutGroup.visible = false;
            item.group.position.copy(item.initialPos);
            item.group.position.x += (item.index - 1) * dissolve * 1.3;
            item.group.position.y += Math.sin(dissolve * Math.PI) * 0.5;
            item.group.scale.setScalar(cardScale * (1 - dissolve * 0.28));
            item.cardMaterials.forEach((material) => {
              if ('opacity' in material) material.opacity = 1 - dissolve;
              material.transparent = true;
            });
            (item.borderLines.material as THREE.LineBasicMaterial).opacity = 0.7 * (1 - dissolve);
            item.hitbox.visible = false;
          } else {
            item.group.visible = true;
            item.sproutGroup.visible = false;
            item.dissolveProgress = 0;
            item.group.position.copy(item.initialPos);
            item.group.position.y += Math.sin(elapsed * 1.8 + item.index * 1.7) * 0.34;
            if (item.isHovered) {
              item.targetPos.copy(item.initialPos);
              item.targetRot.copy(item.initialRot);
              item.targetScale = cardScale * 1.06;
              (item.borderLines.material as THREE.LineBasicMaterial).color.setHex(0xfff0aa);
              (item.borderLines.material as THREE.LineBasicMaterial).opacity = 1.0;
            } else {
              item.targetPos.copy(item.initialPos);
              item.targetRot.copy(item.initialRot);
              item.targetScale = cardScale;
              (item.borderLines.material as THREE.LineBasicMaterial).color.setHex(0xc8b273);
              (item.borderLines.material as THREE.LineBasicMaterial).opacity = 0.7;
            }
            item.group.position.lerp(item.targetPos, 0.1);
            item.group.rotation.x = THREE.MathUtils.lerp(item.group.rotation.x, item.targetRot.x, 0.1);
            item.group.rotation.y = THREE.MathUtils.lerp(item.group.rotation.y, item.targetRot.y, 0.1);
            item.group.rotation.z = THREE.MathUtils.lerp(item.group.rotation.z, item.targetRot.z, 0.1);
            item.group.scale.lerp(new THREE.Vector3(item.targetScale, item.targetScale, item.targetScale), 0.1);
          }
        });
      } else {
        // Keep the still-life visible as the title and encounter phase begin;
        // the card itself has already disappeared at this point.
        cardsSkyGroup.visible = cardScene.cards3DList.some((c) => c.isSelected && c.sproutProgress > 0.01);
      }
      cardScene.updateRevealFx(dt);

      // Camera Position dynamically steered by Game Phase and Perspective
      const targetCam = new THREE.Vector3();
      const lookTarget = new THREE.Vector3();

      if (gamePhaseRef.current === 'card_selection') {
        // Pull back for the card encounter: show the full doorway, the gap
        // where the duo stops, and enough ground to make the approach legible.
        targetCam.set(8.5 + mouse.x * 1.4, 7.2 + mouse.y * 0.9, 19.5);
        lookTarget.set(0, 2.6, -4.8);
      } else if (gamePhaseRef.current === 'approaching' || gamePhaseRef.current === 'encounter_decision') {
        // Crane up and back (拉远+升高) as the colossus rises, so the duo and
        // the whole monument share the frame for the gift.
        const aspectFit = 1 / Math.min(1, camera.aspect);
        const pullBack = gamePhaseRef.current === 'encounter_decision'
          ? 1
          : THREE.MathUtils.smoothstep(legProgress, 0.15, 0.9);
        targetCam.set(
          THREE.MathUtils.lerp(9, 18, pullBack) + mouse.x * 0.8,
          THREE.MathUtils.lerp(8, 26, pullBack) + mouse.y * 0.4,
          THREE.MathUtils.lerp(30, 62, pullBack) * aspectFit
        );
        lookTarget.set(0, THREE.MathUtils.lerp(9, 14, pullBack), THREE.MathUtils.lerp(-6, -14, pullBack));
      } else if (gamePhaseRef.current === 'homecoming' || gamePhaseRef.current === 'final_reading') {
        // High orbit to watch the planet turn as the duo closes the lap.
        const aspectFit = 1 / Math.min(1, camera.aspect);
        targetCam.set(26 + mouse.x * 1.5, 52 + mouse.y, 66 * aspectFit);
        lookTarget.set(0, -6, -8);
      } else if (viewRef.current === 'cinematic') {
        // Ultra-distant deep-space panoramic vantage
        targetCam.set(18.0 + mouse.x * 2.5, 14.5 + mouse.y * 1.8, 45.0);
        lookTarget.set(-1.0, 3.8, -4.5);
      } else if (viewRef.current === 'close') {
        // Intimate companion angle
        targetCam.set(3.2 + mouse.x * 0.8, 3.0 + mouse.y * 0.6, 7.2);
        lookTarget.set(-0.2, 2.8, -2.4);
      } else {
        // Standard 3/4 trailing view
        targetCam.set(4.8 + mouse.x * 1.2, 4.4 + mouse.y * 0.8, 11.0);
        lookTarget.set(-0.5, 3.8, -3.8);
      }

      // Ease camera view changes more gently so switching between close and
      // cinematic perspectives does not feel like a sudden zoom.
      camera.position.lerp(targetCam, 0.03);
      camera.lookAt(lookTarget);

      // Walking sounds and trail response
      if (speedMult > 0.05) {
        // Audio Step trigger
        const stepInterval = Math.max(0.2, 0.52 / speedMult);
        if (elapsed - lastStepTime > stepInterval) {
          lastStepTime = elapsed;
          audioService.playHoofStep(Math.random() > 0.4);

        }

      }

      shootingStar.update(dt);

      encounterTitle.update();
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
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      starShaderMaterial.uniforms.uPixelRatio.value = pixelRatio;
      floatingMoteShaderMat.uniforms.uPixelRatio.value = pixelRatio;
      ecology.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // 13. Cleanup
    return () => {
      tarotEntities.dispose();
      ecology.dispose();
      celestialModels.dispose();
      horseDisposed = true;
      travelerDisposed = true;
      travelerAnimation?.dispose();
      if (travelerModel) disposeThreeObject(travelerModel);
      horseAnimation?.dispose();
      if (loadedHorse) {
        disposeThreeObject(loadedHorse);
      }
      cancelAnimationFrame(animId);
      timer.dispose();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      encounterTitle.dispose();
      starGeo.dispose();
      starShaderMaterial.dispose();
      cardScene.dispose();
      shootingStar.dispose();
      cosmicDustGeo.dispose();
      dustTexture.dispose();
      cosmicDustMat.dispose();
      floatingMoteGeo.dispose();
      floatingMoteShaderMat.dispose();
      nebulaGeo.dispose();
      nebulaMat.dispose();
      [horseTrail, travelerTrail, giftTrail].forEach((trail) => {
        trail.geometries.forEach((geometry) => geometry.dispose());
        trail.materials.forEach((material) => material.dispose());
      });
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
