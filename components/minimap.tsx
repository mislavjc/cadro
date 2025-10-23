'use client';

import Image from 'next/image';

import type { Border, DroppedImage, Side } from '../lib/types';

type MinimapProps = {
  image: DroppedImage | null;
  border: Border;
  unit: 'px' | '%';
  getDisplayValue: (side: Side) => number;
};

export const Minimap = ({
  image,
  border,
  unit,
  getDisplayValue,
}: MinimapProps) => {
  const styles = (() => {
    if (!image)
      return null as null | {
        container: React.CSSProperties;
        image: React.CSSProperties;
      };
    const maxW = 64;
    const maxH = 48;
    const denomW = image.width + border.left + border.right;
    const denomH = image.height + border.top + border.bottom;
    if (denomW <= 0 || denomH <= 0) return null;
    const s = Math.min(maxW / denomW, maxH / denomH, 1);
    const container = {
      width: Math.round(denomW * s),
      height: Math.round(denomH * s),
    } as React.CSSProperties;
    const imageStyle = {
      top: Math.round(border.top * s),
      left: Math.round(border.left * s),
      width: Math.max(0, Math.round(image.width * s)),
      height: Math.max(0, Math.round(image.height * s)),
    } as React.CSSProperties;
    return { container, image: imageStyle };
  })();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className="relative border bg-white"
          style={styles?.container ?? { width: 64, height: 48 }}
        >
          {image && styles?.image && (
            <Image
              src={image.url}
              alt="Minimap preview"
              className="absolute select-none"
              width={styles.image.width as number}
              height={styles.image.height as number}
              style={styles.image}
              draggable={false}
            />
          )}
        </div>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
          {getDisplayValue('top')}
          {unit}
        </div>
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -right-6 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
          {getDisplayValue('right')}
          {unit}
        </div>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-4 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
          {getDisplayValue('bottom')}
          {unit}
        </div>
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-6 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
          {getDisplayValue('left')}
          {unit}
        </div>
      </div>
    </div>
  );
};
