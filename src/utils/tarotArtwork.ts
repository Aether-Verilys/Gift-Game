import { CardSymbol } from '../types';

const artwork: Partial<Record<CardSymbol, string>> = {
  fool: 'The-Fool.webp',
  watcher: 'high-priestess-v2F.webp',
  monolith: 'emperor-tarotF2.webp',
  beacon: 'heirophant-v2F.webp',
  lovers: 'lover-tarotF.webp',
  chariot: 'chariot-tarotF.webp',
  hermit: 'hermitF2.webp',
  rings: 'wheels-of-fate-tarotF.webp',
  prism: 'tower-v3F.webp',
  star: 'star-cardF2.webp',
  sun: 'sun-cardF2.webp',
  world: 'the-world-tarotF.webp',
};

export function tarotArtworkUrl(symbol: CardSymbol): string | undefined {
  const filename = artwork[symbol];
  return filename ? `${import.meta.env.BASE_URL}assets/${filename}` : undefined;
}

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadTarotArtwork(symbol: CardSymbol): Promise<HTMLImageElement> | undefined {
  const url = tarotArtworkUrl(symbol);
  if (!url) return;
  let pending = images.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    images.set(url, pending);
  }
  return pending;
}
