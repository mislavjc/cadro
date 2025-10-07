'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { BorderStage } from '../../components/border-stage';
import type { DroppedImage } from '../../lib/types';

type Side = 'top' | 'right' | 'bottom' | 'left';

export function OGCapture() {
  const ogInnerRef = useRef<HTMLDivElement | null>(null);
  const ogImgRef = useRef<HTMLImageElement | null>(null);
  const ogFileInputRef = useRef<HTMLInputElement | null>(null);
  const [ogImage, setOgImage] = useState<DroppedImage | null>(null);
  const [ogInnerSize, setOgInnerSize] = useState({ width: 0, height: 0 });
  const [ogBorder, setOgBorder] = useState({
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  });

  useEffect(() => {
    let canceled = false;
    const img = new Image();
    img.src = '/dummy.jpg';
    img.onload = () => {
      if (canceled) return;
      setOgImage({
        url: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      const larger = Math.max(img.naturalWidth, img.naturalHeight);
      const pad = Math.max(24, Math.round(larger * 0.08));
      setOgBorder({ top: pad, right: pad, bottom: pad, left: pad });
      document.getElementById('og-root')?.setAttribute('data-ready', '1');
    };
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const el = ogInnerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setOgInnerSize({ width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ogDisplay = useMemo(() => {
    if (!ogImage) return { width: 0, height: 0, scale: 1 };
    const denomW = ogImage.width + ogBorder.left + ogBorder.right;
    const denomH = ogImage.height + ogBorder.top + ogBorder.bottom;
    if (denomW <= 0 || denomH <= 0) return { width: 0, height: 0, scale: 1 };
    const s = Math.min(
      ogInnerSize.width / denomW,
      ogInnerSize.height / denomH,
      1,
    );
    const width = Math.max(0, Math.floor(ogImage.width * s));
    const height = Math.max(0, Math.floor(ogImage.height * s));
    return { width, height, scale: s };
  }, [ogImage, ogInnerSize, ogBorder]);

  const ogGetDisplayValue = (side: Side): number => {
    const px = ogBorder[side as keyof typeof ogBorder] as number;
    return Math.round(px);
  };

  return (
    <div
      id="og-root"
      className="relative flex items-start p-14"
      style={{ width: 1200, height: 630 }}
    >
      <div className="flex flex-col gap-2">
        <div className="text-[72px] leading-none font-extrabold tracking-tight text-gray-900">
          Cadro
        </div>
        <div className="text-[26px] text-gray-600 max-w-[740px]">
          Add clean borders to images. Drag, adjust, export crisp PNGs.
        </div>
      </div>

      <div
        className="flex rounded-[28px] absolute"
        style={{
          right: -40,
          bottom: -40,
          width: Math.round(1200 * 0.68),
          height: Math.round(630 * 0.78),
        }}
      >
        <div className="absolute inset-[60px]">
          <BorderStage
            image={ogImage}
            isDraggingOver={false}
            onBrowse={() => {}}
            fileInputRef={ogFileInputRef}
            onFilesChange={() => {}}
            innerRef={ogInnerRef}
            imgRef={ogImgRef}
            display={ogDisplay}
            border={ogBorder}
            unit="px"
            getDisplayValue={ogGetDisplayValue}
            onStartDrag={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
