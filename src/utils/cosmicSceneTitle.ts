import * as THREE from 'three';
import type { TarotCardDef } from '../types';
import type { Language } from '../i18n';

export interface EncounterTitleState {
  card: TarotCardDef | null;
  active: boolean;
  language: Language;
  stage: number;
}

export interface EncounterTitleController {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  texture: THREE.CanvasTexture;
  update: () => void;
  dispose: () => void;
}

/** Creates the in-world encounter title and keeps its reveal animation isolated. */
export function createEncounterTitle(
  scene: THREE.Scene,
  readState: () => EncounterTitleState,
): EncounterTitleController {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(-17, 8, -82);
  sprite.scale.set(220, 72, 1);
  sprite.renderOrder = 0;
  scene.add(sprite);

  let renderedKey = '';
  let animationKey = '';
  let animationStartedAt = -Infinity;
  const revealDelayMs = 3000;
  const fadeInDurationMs = 6000;
  const fadeOutDurationMs = 3000;

  const update = () => {
    const { card, active, language, stage } = readState();
    const label = card ? (language === 'zh' ? card.nameZh : card.nameEn) : '';
    const key = `${active}:${language}:${card?.id ?? ''}`;
    if (key !== renderedKey) {
      renderedKey = key;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (label) {
        const isChinese = language === 'zh';
        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = isChinese
          ? '300 360px "Noto Serif SC", "ZCOOL XiaoWei", serif'
          : '600 300px Cinzel, "Cormorant Garamond", serif';
        context.letterSpacing = isChinese ? '34px' : '20px';
        context.shadowColor = 'rgba(0, 0, 0, 0.9)';
        context.shadowBlur = 28;
        context.fillStyle = 'rgba(238, 241, 247, 0.92)';
        const maxTextWidth = canvas.width * 0.94;
        if (isChinese) {
          const glyphs = Array.from(label);
          const edge = canvas.width * 0.18;
          glyphs.forEach((glyph, index) => {
            const x = glyphs.length === 1
              ? canvas.width / 2
              : edge + (canvas.width - edge * 2) * (index / (glyphs.length - 1));
            context.fillText(glyph, x, canvas.height / 2);
          });
        } else {
          const measured = context.measureText(label).width;
          if (measured > maxTextWidth) {
            const scale = maxTextWidth / measured;
            context.scale(scale, scale);
            context.fillText(label, canvas.width / (2 * scale), canvas.height / (2 * scale));
          } else {
            context.fillText(label, canvas.width / 2, canvas.height / 2);
          }
        }
        context.restore();
        texture.needsUpdate = true;
      }
    }

    if (!active || !card) {
      animationKey = '';
      material.opacity = 0;
      return;
    }
    const nextAnimationKey = `${stage}:${language}:${card.id}`;
    if (nextAnimationKey !== animationKey) {
      animationKey = nextAnimationKey;
      animationStartedAt = performance.now();
    }
    const elapsed = performance.now() - animationStartedAt - revealDelayMs;
    const fadeIn = THREE.MathUtils.clamp(elapsed / fadeInDurationMs, 0, 1);
    const fadeOut = THREE.MathUtils.clamp((elapsed - fadeInDurationMs) / fadeOutDurationMs, 0, 1);
    const easeIn = fadeIn * fadeIn * (3 - 2 * fadeIn);
    const easeOut = fadeOut * fadeOut * (3 - 2 * fadeOut);
    material.opacity = 0.84 * (1 - easeOut) * easeIn;
  };

  const dispose = () => {
    scene.remove(sprite);
    material.dispose();
    texture.dispose();
  };
  return { sprite, material, texture, update, dispose };
}
