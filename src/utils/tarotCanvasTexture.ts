import * as THREE from 'three';
import { TarotCardDef, CardSymbol } from '../types';

// Helper to draw sacred geometric symbols on 2D canvas
function drawSymbolOnCanvas(ctx: CanvasRenderingContext2D, symbol: CardSymbol, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = '#e2e8f0';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (symbol) {
    case 'star': {
      // 8-pointed celestial star
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        const len = i % 2 === 0 ? r : r * 0.65;
        const width = len * 0.22;
        ctx.moveTo(0, -len);
        ctx.lineTo(width, 0);
        ctx.lineTo(0, len);
        ctx.lineTo(-width, 0);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(226, 232, 240, 0.7)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // Central glowing core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#ffeedd';
      ctx.fill();
      break;
    }
    case 'chariot': {
      // Cosmic wheel with winged spokes
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (r * 0.35), Math.sin(ang) * (r * 0.35));
        ctx.lineTo(Math.cos(ang) * (r * 0.75), Math.sin(ang) * (r * 0.75));
        ctx.stroke();
      }
      // Wings
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, -r * 0.2);
      ctx.quadraticCurveTo(-r * 1.2, -r * 0.6, -r * 0.4, -r * 0.7);
      ctx.quadraticCurveTo(-r * 0.6, -r * 0.35, -r * 0.3, -r * 0.35);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(r * 0.8, -r * 0.2);
      ctx.quadraticCurveTo(r * 1.2, -r * 0.6, r * 0.4, -r * 0.7);
      ctx.quadraticCurveTo(r * 0.6, -r * 0.35, r * 0.3, -r * 0.35);
      ctx.stroke();
      break;
    }
    case 'hermit': {
      // Glowing arcane lantern
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(r * 0.35, -r * 0.55);
      ctx.lineTo(r * 0.25, r * 0.65);
      ctx.lineTo(-r * 0.25, r * 0.65);
      ctx.lineTo(-r * 0.35, -r * 0.55);
      ctx.closePath();
      ctx.stroke();

      // Top handle ring
      ctx.beginPath();
      ctx.arc(0, -r * 0.95, r * 0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Inner flame
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffdfba';
      ctx.fill();

      // Radiating light rays
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (r * 0.45), Math.sin(ang) * (r * 0.45));
        ctx.lineTo(Math.cos(ang) * (r * 0.85), Math.sin(ang) * (r * 0.85));
        ctx.strokeStyle = 'rgba(255, 230, 180, 0.6)';
        ctx.stroke();
      }
      break;
    }
    case 'beacon': {
      // Tower beacon
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, r * 0.8);
      ctx.lineTo(-r * 0.15, -r * 0.4);
      ctx.lineTo(0, -r * 0.8);
      ctx.lineTo(r * 0.15, -r * 0.4);
      ctx.lineTo(r * 0.25, r * 0.8);
      ctx.closePath();
      ctx.stroke();

      // Light beam arcs
      for (let s = 1; s <= 3; s++) {
        ctx.beginPath();
        ctx.arc(0, -r * 0.8, r * 0.25 * s, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 - s * 0.2})`;
        ctx.stroke();
      }
      break;
    }
    case 'prism': {
      // Faceted hexagonal crystal
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(r * 0.55, -r * 0.35);
      ctx.lineTo(r * 0.55, r * 0.35);
      ctx.lineTo(0, r * 0.85);
      ctx.lineTo(-r * 0.55, r * 0.35);
      ctx.lineTo(-r * 0.55, -r * 0.35);
      ctx.closePath();
      ctx.stroke();

      // Inner facet lines
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(0, r * 0.85);
      ctx.moveTo(-r * 0.55, -r * 0.35);
      ctx.lineTo(r * 0.55, r * 0.35);
      ctx.moveTo(-r * 0.55, r * 0.35);
      ctx.lineTo(r * 0.55, -r * 0.35);
      ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
      ctx.stroke();
      break;
    }
    case 'rings': {
      // Ringed gas giant planet
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.save();
      ctx.rotate(-0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'monolith': {
      // Isometric hypercube
      const side = r * 0.5;
      ctx.strokeRect(-side / 2, -side / 2, side, side);
      ctx.strokeRect(-side / 2 + r * 0.25, -side / 2 - r * 0.25, side, side);
      // Connect corners
      ctx.beginPath();
      ctx.moveTo(-side / 2, -side / 2);
      ctx.lineTo(-side / 2 + r * 0.25, -side / 2 - r * 0.25);
      ctx.moveTo(side / 2, -side / 2);
      ctx.lineTo(side / 2 + r * 0.25, -side / 2 - r * 0.25);
      ctx.moveTo(side / 2, side / 2);
      ctx.lineTo(side / 2 + r * 0.25, side / 2 - r * 0.25);
      ctx.moveTo(-side / 2, side / 2);
      ctx.lineTo(-side / 2 + r * 0.25, side / 2 - r * 0.25);
      ctx.stroke();
      break;
    }
    case 'world': {
      // Sacred Ouroboros / Cosmic Ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // 4 Cardinal points
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * (r * 0.65), Math.sin(ang) * (r * 0.65), 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      break;
    }
    case 'sun': {
      // Radiant Solar Corona
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff4cc';
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 12; i++) {
        const ang = (i * Math.PI) / 6;
        ctx.beginPath();
        const l1 = i % 2 === 0 ? r * 0.85 : r * 0.65;
        ctx.moveTo(Math.cos(ang) * (r * 0.48), Math.sin(ang) * (r * 0.48));
        ctx.lineTo(Math.cos(ang) * l1, Math.sin(ang) * l1);
        ctx.strokeStyle = 'rgba(255, 220, 140, 0.8)';
        ctx.stroke();
      }
      break;
    }
    default: {
      // Celestial Astrolabe / Cross
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, 0);
      ctx.lineTo(r * 0.8, 0);
      ctx.moveTo(0, -r * 0.8);
      ctx.lineTo(0, r * 0.8);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

/**
 * Generates an ultra-crisp 512x800 Canvas texture for a 3D Tarot Card in Three.js
 */
export function createTarotFrontTexture(card: TarotCardDef, index: number, isHovered = false): THREE.CanvasTexture {
  const width = 512;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Deep Midnight Obsidian Void Background
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width * 0.7);
  if (isHovered) {
    bgGrad.addColorStop(0, '#151528');
    bgGrad.addColorStop(0.65, '#0b0b18');
    bgGrad.addColorStop(1, '#05050d');
  } else {
    bgGrad.addColorStop(0, '#0c0c1a');
    bgGrad.addColorStop(0.65, '#070712');
    bgGrad.addColorStop(1, '#020206');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle star dust speckles on card surface
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let s = 0; s < 45; s++) {
    const sx = (Math.sin(s * 73.1 + index * 12) * 0.5 + 0.5) * width;
    const sy = (Math.cos(s * 41.7 + index * 9) * 0.5 + 0.5) * height;
    const sr = (Math.sin(s) * 0.5 + 0.5) * 1.2 + 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Ornate Double Golden / Silver Borders
  const borderMargin = 22;
  const borderColor = isHovered ? '#f5d77f' : '#c8b273';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isHovered ? 2.5 : 1.8;
  ctx.strokeRect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2);

  // Inner inset border
  const innerMargin = 34;
  ctx.strokeStyle = isHovered ? 'rgba(245, 215, 127, 0.75)' : 'rgba(200, 178, 115, 0.45)';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Four corner star flourishes ✦
  ctx.fillStyle = borderColor;
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', innerMargin, innerMargin);
  ctx.fillText('✦', width - innerMargin, innerMargin);
  ctx.fillText('✦', innerMargin, height - innerMargin);
  ctx.fillText('✦', width - innerMargin, height - innerMargin);

  // 3. Top Header: Roman Numeral & Title
  ctx.textAlign = 'center';
  ctx.fillStyle = isHovered ? '#ffffff' : '#e6e9f0';
  ctx.font = '600 32px "Cinzel", "Times New Roman", serif';
  ctx.fillText(card.numeral, width / 2, 72);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '10px "Cinzel", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('TAROT ARCANA', width / 2, 98);
  ctx.letterSpacing = '0px';

  // 4. Center Symbol Sigil
  drawSymbolOnCanvas(ctx, card.symbol, width / 2, 280, 85);

  // 5. Card Title in Chinese & English
  ctx.fillStyle = isHovered ? '#ffffff' : '#f0f3fa';
  ctx.font = 'bold 36px "Songti SC", "SimSun", "Noto Serif SC", serif';
  ctx.letterSpacing = '6px';
  ctx.fillText(card.nameZh, width / 2, 450);

  ctx.fillStyle = isHovered ? 'rgba(245, 215, 127, 0.95)' : 'rgba(200, 178, 115, 0.75)';
  ctx.font = '12px "Cinzel", "Times New Roman", serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(card.nameEn, width / 2, 480);
  ctx.letterSpacing = '0px';

  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 80, 508);
  ctx.lineTo(width / 2 + 80, 508);
  ctx.stroke();

  // 6. Keywords
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '14px "Songti SC", "SimSun", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(card.keywordUpright, width / 2, 540);

  // 7. Encounter Preview Hint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '13px "Songti SC", "SimSun", sans-serif';
  ctx.fillText(`前路邂逅：${card.encounter.name}`, width / 2, 595);

  // 8. Bottom Selection Cue
  ctx.fillStyle = isHovered ? '#ffd166' : 'rgba(255, 255, 255, 0.4)';
  ctx.font = '12px "Cinzel", "Songti SC", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(`[ ✦ 点击或按 ${index + 1} 抽取 ✦ ]`, width / 2, 730);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Generates an ornate cosmic back texture for 3D Tarot Cards
 */
export function createTarotBackTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Deep obsidian velvet
  const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
  grad.addColorStop(0, '#0a0a16');
  grad.addColorStop(1, '#020205');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Double golden border
  const margin = 24;
  ctx.strokeStyle = '#8a7747';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  const innerMargin = 36;
  ctx.strokeStyle = 'rgba(138, 119, 71, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

  // Mandala / Compass Star in Center
  ctx.save();
  ctx.translate(width / 2, height / 2);

  // Concentric Rings
  for (let r = 50; r <= 160; r += 35) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 180, 120, 0.35)';
    ctx.stroke();
  }

  // Rays
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 45, Math.sin(ang) * 45);
    ctx.lineTo(Math.cos(ang) * 165, Math.sin(ang) * 165);
    ctx.strokeStyle = 'rgba(200, 180, 120, 0.25)';
    ctx.stroke();
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}
