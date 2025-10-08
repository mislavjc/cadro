'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { AppHeader } from '../components/app-header';
import { BorderStage } from '../components/border-stage';
import { Toolbar } from '../components/toolbar';
import type { DroppedImage } from '../lib/types';

import { OGCapture } from './shared/OGCapture';

function MainApp() {
  const BORDER_MAX = 2048;
  const [image, setImage] = useState<DroppedImage | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [border, setBorder] = useState({
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
  });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [innerSize, setInnerSize] = useState({ width: 0, height: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const [linkTB, setLinkTB] = useState(true);
  const [linkLR, setLinkLR] = useState(true);
  const [linkAll, setLinkAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previousImageUrlRef = useRef<string | null>(null);
  const [unit, setUnit] = useState<'px' | '%'>('px');
  // Special rendering for OG capture mode (/?og=1) handled above before hooks

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    await img.decode().catch(() => {});
    setImage({
      url: objectUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    // Scale default border with image size (~5% of larger dimension)
    const largerDim = Math.max(img.naturalWidth, img.naturalHeight);
    const suggested = Math.round(largerDim * 0.05);
    const sized = Math.max(5, Math.min(suggested, BORDER_MAX));
    setBorder({ top: sized, right: sized, bottom: sized, left: sized });
  }, []);

  // Revoke previously created blob URL to avoid leaks when a new image is loaded or on unmount
  useEffect(() => {
    const previous = previousImageUrlRef.current;
    const current = image?.url ?? null;
    if (previous && previous !== current && previous.startsWith('blob:')) {
      URL.revokeObjectURL(previous);
    }
    previousImageUrlRef.current = current;
    return () => {
      const last = previousImageUrlRef.current;
      if (last && last.startsWith('blob:')) {
        URL.revokeObjectURL(last);
      }
    };
  }, [image?.url]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  const exportPng = useCallback(async () => {
    if (!image || isExporting) return;
    setIsExporting(true);
    try {
      // Compute display scale locally based on current layout
      const availableW = Math.max(
        0,
        innerSize.width - (border.left + border.right),
      );
      const availableH = Math.max(
        0,
        innerSize.height - (border.top + border.bottom),
      );
      const scale =
        availableW === 0 || availableH === 0
          ? 1
          : Math.min(availableW / image.width, availableH / image.height, 1);
      const left = Math.round(border.left / scale);
      const top = Math.round(border.top / scale);
      const right = Math.round(border.right / scale);
      const bottom = Math.round(border.bottom / scale);

      const canvas = document.createElement('canvas');
      // Ensure non-zero canvas size
      canvas.width = Math.max(1, Math.floor(image.width + left + right));
      canvas.height = Math.max(1, Math.floor(image.height + top + bottom));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White background border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image centered within border
      const imgEl = new Image();
      imgEl.src = image.url;
      await imgEl.decode().catch(() => {});
      ctx.drawImage(imgEl, left, top, image.width, image.height);

      let url: string | null = null;
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png'),
      );
      if (blob) {
        url = URL.createObjectURL(blob);
      } else {
        // Fallback for browsers that return null from toBlob
        try {
          url = canvas.toDataURL('image/png');
        } catch {
          url = null;
        }
      }
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bordered-image.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [image, border, isExporting, innerSize]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const paperBackground = useMemo(() => {
    // Subtle paper-like texture using layered radial gradients and vignette
    return {
      backgroundColor: '#f7f4ec',
      backgroundImage:
        'radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), ' +
        'radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), ' +
        'linear-gradient(to bottom, rgba(0,0,0,0.03), rgba(0,0,0,0))',
      backgroundSize: '6px 6px, 10px 10px, 100% 100%',
      backgroundPosition: '0 0, 2px 2px, 0 0',
    } as React.CSSProperties;
  }, []);

  type Side = 'top' | 'right' | 'bottom' | 'left';
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const getAxisDimension = useCallback(
    (side: Side): number => {
      if (!image) return 0;
      return side === 'top' || side === 'bottom' ? image.height : image.width;
    },
    [image],
  );

  const getDisplayValue = useCallback(
    (side: Side): number => {
      const px = border[side as keyof typeof border] as number;
      if (unit === 'px') return px;
      const dim = getAxisDimension(side);
      if (dim <= 0) return 0;
      return Math.round((px / dim) * 100);
    },
    [border, unit, getAxisDimension],
  );

  const toPxFromDisplay = useCallback(
    (side: Side, value: number): number => {
      if (unit === 'px') return clamp(Math.round(value), 0, BORDER_MAX);
      const dim = getAxisDimension(side);
      const pct = clamp(value, 0, 100);
      const px = Math.round((pct / 100) * Math.max(0, dim));
      return clamp(px, 0, BORDER_MAX);
    },
    [unit, getAxisDimension],
  );

  const updateBorderFromDisplay = useCallback(
    (side: Side, displayValue: number) => {
      const nextPx = toPxFromDisplay(side, displayValue);
      setBorder((prev) => {
        const current = prev[side as keyof typeof prev] as number;
        const delta = nextPx - current;
        let top = prev.top as number;
        let right = prev.right as number;
        let bottom = prev.bottom as number;
        let left = prev.left as number;
        if (linkAll) {
          top = clamp(top + delta, 0, BORDER_MAX);
          right = clamp(right + delta, 0, BORDER_MAX);
          bottom = clamp(bottom + delta, 0, BORDER_MAX);
          left = clamp(left + delta, 0, BORDER_MAX);
        } else if (side === 'top') {
          top = nextPx;
          if (linkTB) bottom = clamp(bottom + delta, 0, BORDER_MAX);
        } else if (side === 'bottom') {
          bottom = nextPx;
          if (linkTB) top = clamp(top + delta, 0, BORDER_MAX);
        } else if (side === 'left') {
          left = nextPx;
          if (linkLR) right = clamp(right + delta, 0, BORDER_MAX);
        } else if (side === 'right') {
          right = nextPx;
          if (linkLR) left = clamp(left + delta, 0, BORDER_MAX);
        }
        return { top, right, bottom, left };
      });
    },
    [toPxFromDisplay, linkAll, linkTB, linkLR],
  );

  const startDrag = useCallback(
    (side: Side, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // End any previous drag cleanly
      if (cleanupDragRef.current) cleanupDragRef.current();
      // Capture current scale to convert CSS px to intrinsic px during drag
      const denomW = image
        ? image.width + (border.left as number) + (border.right as number)
        : 0;
      const denomH = image
        ? image.height + (border.top as number) + (border.bottom as number)
        : 0;
      const scaleAtStart =
        image && denomW > 0 && denomH > 0
          ? Math.min(innerSize.width / denomW, innerSize.height / denomH, 1)
          : 1;
      const startX = e.clientX;
      const startY = e.clientY;
      const startVal = border[side as keyof typeof border];
      const pointerId = e.pointerId;
      activePointerIdRef.current = pointerId;
      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture?.(pointerId);
      } catch {}

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== activePointerIdRef.current) return;
        ev.preventDefault();
        let next = startVal;
        const invScale = scaleAtStart > 0 ? 1 / scaleAtStart : 1;
        const invScaleLimited = Math.min(invScale, 12); // higher cap for large images
        const speedFactor = ev.shiftKey ? 0.5 : ev.altKey ? 4 : 2;
        if (side === 'top')
          next =
            startVal +
            Math.round((startY - ev.clientY) * invScaleLimited * speedFactor);
        if (side === 'bottom')
          next =
            startVal +
            Math.round((ev.clientY - startY) * invScaleLimited * speedFactor);
        if (side === 'left')
          next =
            startVal +
            Math.round((startX - ev.clientX) * invScaleLimited * speedFactor);
        if (side === 'right')
          next =
            startVal +
            Math.round((ev.clientX - startX) * invScaleLimited * speedFactor);
        next = clamp(Math.round(next), 0, BORDER_MAX);
        setBorder((prev) => {
          const delta = next - (prev[side as keyof typeof prev] as number);
          let top = prev.top as number;
          let right = prev.right as number;
          let bottom = prev.bottom as number;
          let left = prev.left as number;
          if (linkAll) {
            top = clamp((prev.top as number) + delta, 0, BORDER_MAX);
            right = clamp((prev.right as number) + delta, 0, BORDER_MAX);
            bottom = clamp((prev.bottom as number) + delta, 0, BORDER_MAX);
            left = clamp((prev.left as number) + delta, 0, BORDER_MAX);
          } else if (side === 'top') {
            top = next;
            if (linkTB) bottom = clamp(bottom + delta, 0, BORDER_MAX);
          } else if (side === 'bottom') {
            bottom = next;
            if (linkTB) top = clamp(top + delta, 0, BORDER_MAX);
          } else if (side === 'left') {
            left = next;
            if (linkLR) right = clamp(right + delta, 0, BORDER_MAX);
          } else if (side === 'right') {
            right = next;
            if (linkLR) left = clamp(left + delta, 0, BORDER_MAX);
          }
          return { top, right, bottom, left };
        });
      };

      const end = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        target.removeEventListener('lostpointercapture', onCancel);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.removeProperty('-webkit-user-select');
        document.body.style.touchAction = '';
        activePointerIdRef.current = null;
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        try {
          target.releasePointerCapture?.(pointerId);
        } catch {}
        end();
      };

      const onCancel = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        try {
          target.releasePointerCapture?.(pointerId);
        } catch {}
        end();
      };

      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp, { passive: true });
      window.addEventListener('pointercancel', onCancel, { passive: true });
      target.addEventListener('lostpointercapture', onCancel, {
        passive: true,
      });
      document.body.style.cursor =
        side === 'left' || side === 'right' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
      document.body.style.setProperty('-webkit-user-select', 'none');
      document.body.style.touchAction = 'none';

      cleanupDragRef.current = end;
    },
    [border, linkTB, linkLR, linkAll, innerSize, image],
  );

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    // Set initial size immediately
    const rect = el.getBoundingClientRect();
    setInnerSize({ width: rect.width, height: rect.height });
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      setInnerSize({ width: cr.width, height: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [image]);

  const display = useMemo(() => {
    if (!image) return { width: 0, height: 0, scale: 1 };
    const denomW = image.width + border.left + border.right;
    const denomH = image.height + border.top + border.bottom;
    if (denomW <= 0 || denomH <= 0) return { width: 0, height: 0, scale: 1 };
    const s = Math.min(innerSize.width / denomW, innerSize.height / denomH, 1);
    const width = Math.max(0, Math.floor(image.width * s));
    const height = Math.max(0, Math.floor(image.height * s));
    return { width, height, scale: s };
  }, [image, innerSize, border]);

  // minimap styles moved into components/minimap

  return (
    <div className="min-h-dvh w-full flex flex-col">
      <AppHeader image={image} isExporting={isExporting} onExport={exportPng} />
      <main
        className="flex-1 flex items-center justify-center px-6"
        data-og-canvas
      >
        <div
          className="relative w-full max-w-5xl h-[70vh] rounded-md overflow-hidden flex flex-col"
          data-og-paper
          style={{
            ...paperBackground,
            border: '1px solid rgba(0,0,0,0.08)',
            outline: '1px solid rgba(255,255,255,0.5)',
            outlineOffset: '-1px',
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="region"
          aria-label="Drop image here"
        >
          <Toolbar
            image={image}
            border={border}
            unit={unit}
            setUnit={setUnit}
            linkAll={linkAll}
            setLinkAll={(updater) => setLinkAll(updater)}
            linkTB={linkTB}
            setLinkTB={(updater) => setLinkTB(updater)}
            linkLR={linkLR}
            setLinkLR={(updater) => setLinkLR(updater)}
            getDisplayValue={getDisplayValue}
            updateBorderFromDisplay={updateBorderFromDisplay}
            borderMax={BORDER_MAX}
          />

          <BorderStage
            image={image}
            isDraggingOver={isDraggingOver}
            onBrowse={handleBrowse}
            fileInputRef={fileInputRef}
            onFilesChange={(files) => onFiles(files)}
            innerRef={innerRef}
            imgRef={imgRef}
            display={display}
            border={border}
            unit={unit}
            getDisplayValue={getDisplayValue}
            onStartDrag={(side: Side, e) => startDrag(side, e)}
          />
        </div>
      </main>
    </div>
  );
}

import { Suspense } from 'react';

function HomeInner() {
  const searchParams = useSearchParams();
  const isOg = searchParams?.get('og') === '1';
  if (isOg) return <OGCapture />;
  return <MainApp />;
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
