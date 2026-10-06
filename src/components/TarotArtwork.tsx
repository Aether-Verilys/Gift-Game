import { useState } from 'react';
import { CardSymbol } from '../types';
import { tarotArtworkUrl } from '../utils/tarotArtwork';
import { TarotSymbol } from './TarotSvgSymbols';

export function TarotArtwork({ symbol, className = 'w-full h-full' }: { symbol: CardSymbol; className?: string }) {
  const url = tarotArtworkUrl(symbol);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (!url || failedUrl === url) return <TarotSymbol symbol={symbol} className={className} />;
  return <img src={url} alt="" draggable={false} onError={() => setFailedUrl(url)}
    className={`${className} object-cover rounded-sm`}
    style={{ filter: 'grayscale(1) contrast(1.12) brightness(0.9)' }} />;
}
