'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DroppedImage = {
  url: string;
  width: number;
  height: number;
};

export default function Home() {
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
      boxShadow:
        'inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 20px 40px rgba(0,0,0,0.03), inset 0 -20px 40px rgba(0,0,0,0.035)',
    } as React.CSSProperties;
  }, []);

  type Side = 'top' | 'right' | 'bottom' | 'left';
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

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
        window.removeEventListener('pointermove', onMove as any);
        window.removeEventListener('pointerup', onUp as any);
        window.removeEventListener('pointercancel', onCancel as any);
        target.removeEventListener('lostpointercapture', onCancel as any);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        (document.body.style as any).webkitUserSelect = '';
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
      target.addEventListener(
        'lostpointercapture',
        onCancel as any,
        { passive: true } as any,
      );
      document.body.style.cursor =
        side === 'left' || side === 'right' ? 'ew-resize' : 'ns-resize';
      document.body.style.userSelect = 'none';
      (document.body.style as any).webkitUserSelect = 'none';
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

  return (
    <div className="min-h-dvh w-full flex flex-col">
      <header className="px-6 py-4 border-b flex items-center gap-4">
        <h1 className="text-xl font-medium mr-auto">Border Lab</h1>
        <button
          type="button"
          onClick={exportPng}
          disabled={!image || isExporting}
          className={`h-9 px-4 rounded-md border text-sm font-medium transition-colors ${
            image && !isExporting
              ? 'bg-foreground text-background hover:opacity-90'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          {isExporting ? 'Exporting…' : 'Export PNG'}
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div
          className="relative w-full max-w-5xl h-[70vh] rounded-md overflow-hidden shadow-2xl flex flex-col"
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
          {/* Paper toolbar as header (outside bounding area) */}
          <div className="px-4 pt-3 pb-2 border-b border-foreground/10 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/35">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Left cluster: Minimap */}
              <div className="flex items-center gap-2">
                {/* Minimap */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="relative w-16 h-12 border bg-white">
                      {/* image area */}
                      <div
                        className="absolute bg-black/10"
                        style={{
                          top: border.top / 8,
                          right: border.right / 8,
                          bottom: border.bottom / 8,
                          left: border.left / 8,
                        }}
                      />
                    </div>
                    {/* side value labels OUTSIDE */}
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-4 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
                      {border.top}px
                    </div>
                    <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -right-6 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
                      {border.right}px
                    </div>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-4 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
                      {border.bottom}px
                    </div>
                    <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-6 text-[10px] text-foreground/80 bg-white/90 border rounded px-1">
                      {border.left}px
                    </div>
                  </div>
                </div>
              </div>

              {/* Right cluster: Locking, Inputs, Presets */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Lock controls */}
                <div className="inline-flex items-center gap-1 rounded-md border overflow-hidden">
                  <button
                    type="button"
                    title="Link all sides"
                    className={`h-7 px-2 text-xs ${
                      linkAll ? 'bg-foreground text-background' : ''
                    }`}
                    onClick={() => setLinkAll((v) => !v)}
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    title="Link Top-Bottom"
                    className={`h-7 px-2 text-xs border-l ${
                      linkTB && !linkAll ? 'bg-foreground text-background' : ''
                    }`}
                    onClick={() => setLinkTB((v) => !v)}
                    disabled={linkAll}
                  >
                    T=B
                  </button>
                  <button
                    type="button"
                    title="Link Left-Right"
                    className={`h-7 px-2 text-xs border-l ${
                      linkLR && !linkAll ? 'bg-foreground text-background' : ''
                    }`}
                    onClick={() => setLinkLR((v) => !v)}
                    disabled={linkAll}
                  >
                    L=R
                  </button>
                </div>
                {/* Numeric inputs */}
                <div className="hidden md:flex items-center gap-2">
                  <label className="flex items-center gap-1">
                    <span className="opacity-70">T</span>
                    <input
                      type="number"
                      className="h-7 w-16 rounded border px-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={border.top}
                      min={0}
                      max={BORDER_MAX}
                      onChange={(e) => {
                        const v = clamp(
                          parseInt(e.currentTarget.value || '0', 10),
                          0,
                          BORDER_MAX,
                        );
                        setBorder((prev) => {
                          if (linkAll)
                            return { top: v, right: v, bottom: v, left: v };
                          return {
                            ...prev,
                            top: v,
                            bottom: linkTB ? v : prev.bottom,
                          };
                        });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="opacity-70">R</span>
                    <input
                      type="number"
                      className="h-7 w-16 rounded border px-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={border.right}
                      min={0}
                      max={BORDER_MAX}
                      onChange={(e) => {
                        const v = clamp(
                          parseInt(e.currentTarget.value || '0', 10),
                          0,
                          BORDER_MAX,
                        );
                        setBorder((prev) => {
                          if (linkAll)
                            return { top: v, right: v, bottom: v, left: v };
                          return {
                            ...prev,
                            right: v,
                            left: linkLR ? v : prev.left,
                          };
                        });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="opacity-70">B</span>
                    <input
                      type="number"
                      className="h-7 w-16 rounded border px-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={border.bottom}
                      min={0}
                      max={BORDER_MAX}
                      onChange={(e) => {
                        const v = clamp(
                          parseInt(e.currentTarget.value || '0', 10),
                          0,
                          BORDER_MAX,
                        );
                        setBorder((prev) => {
                          if (linkAll)
                            return { top: v, right: v, bottom: v, left: v };
                          return {
                            ...prev,
                            bottom: v,
                            top: linkTB ? v : prev.top,
                          };
                        });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="opacity-70">L</span>
                    <input
                      type="number"
                      className="h-7 w-16 rounded border px-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={border.left}
                      min={0}
                      max={BORDER_MAX}
                      onChange={(e) => {
                        const v = clamp(
                          parseInt(e.currentTarget.value || '0', 10),
                          0,
                          BORDER_MAX,
                        );
                        setBorder((prev) => {
                          if (linkAll)
                            return { top: v, right: v, bottom: v, left: v };
                          return {
                            ...prev,
                            left: v,
                            right: linkLR ? v : prev.right,
                          };
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex-1">
            {!image && (
              <button
                type="button"
                onClick={handleBrowse}
                className={`absolute inset-4 border-2 border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground transition-colors ${
                  isDraggingOver
                    ? 'bg-accent/40 border-foreground/30'
                    : 'hover:bg-accent/30'
                }`}
              >
                Drop an image here or click to browse
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFiles(e.currentTarget.files)}
            />

            {image && (
              <div
                ref={innerRef}
                className="absolute inset-4 overflow-visible flex items-center justify-center"
              >
                <div
                  className="inline-block relative"
                  style={{
                    background: 'white',
                    paddingTop: Math.round(border.top * display.scale),
                    paddingRight: Math.round(border.right * display.scale),
                    paddingBottom: Math.round(border.bottom * display.scale),
                    paddingLeft: Math.round(border.left * display.scale),
                  }}
                >
                  <img
                    ref={imgRef}
                    src={image.url}
                    alt="Dropped"
                    className="block select-none"
                    style={{ width: display.width, height: display.height }}
                    draggable={false}
                  />

                  {/* Measurement arrows removed */}
                  {false && border.top > 0 && (
                    <div
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30"
                      style={{
                        top: -border.top,
                        height: border.top,
                      }}
                    >
                      <div
                        style={{
                          width: 2,
                          height: Math.max(0, border.top - 12),
                          background: '#000',
                          margin: '6px auto',
                        }}
                      />
                      {/* arrowheads */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translate(-50%, 50%) rotate(180deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold"
                        style={{
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                          {border.top}px
                        </span>
                      </div>
                    </div>
                  )}

                  {false && border.bottom > 0 && (
                    <div
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-30"
                      style={{
                        bottom: -border.bottom,
                        height: border.bottom,
                      }}
                    >
                      <div
                        style={{
                          width: 2,
                          height: Math.max(0, border.bottom - 12),
                          background: '#000',
                          margin: '6px auto',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translate(-50%, 50%) rotate(180deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold"
                        style={{
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                          {border.bottom}px
                        </span>
                      </div>
                    </div>
                  )}

                  {false && border.left > 0 && (
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 z-30"
                      style={{
                        left: -border.left,
                        width: border.left,
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          width: Math.max(0, border.left - 12),
                          background: '#000',
                          margin: 'auto 6px',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translate(-50%, -50%) rotate(-90deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          transform: 'translate(50%, -50%) rotate(90deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 text-[11px] font-bold"
                        style={{
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                          {border.left}px
                        </span>
                      </div>
                    </div>
                  )}

                  {false && border.right > 0 && (
                    <div
                      className="pointer-events-none absolute top-1/2 -translate-y-1/2 z-30"
                      style={{
                        right: -border.right,
                        width: border.right,
                      }}
                    >
                      <div
                        style={{
                          height: 2,
                          width: Math.max(0, border.right - 12),
                          background: '#000',
                          margin: 'auto 6px',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          transform: 'translate(50%, -50%) rotate(90deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translate(-50%, -50%) rotate(-90deg)',
                          width: 0,
                          height: 0,
                          borderLeft: '7px solid transparent',
                          borderRight: '7px solid transparent',
                          borderBottom: '10px solid #000',
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 text-[11px] font-bold"
                        style={{
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="bg-foreground text-background px-1.5 py-0.5 rounded-sm">
                          {border.right}px
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Drag bars (full-length) and handles */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Bars with large hit areas */}
                    <div
                      className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                      onPointerDown={(e) => startDrag('top', e)}
                      title={`Top: ${border.top}px`}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                      onPointerDown={(e) => startDrag('bottom', e)}
                      title={`Bottom: ${border.bottom}px`}
                    />
                    <div
                      className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                      onPointerDown={(e) => startDrag('left', e)}
                      title={`Left: ${border.left}px`}
                    />
                    <div
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                      onPointerDown={(e) => startDrag('right', e)}
                      title={`Right: ${border.right}px`}
                    />

                    {/* Circles positioned INSIDE the edges */}
                    <div
                      role="slider"
                      aria-label="Top border"
                      aria-valuenow={border.top}
                      className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white border border-foreground shadow cursor-ns-resize pointer-events-auto z-20 select-none touch-none"
                      onPointerDown={(e) => startDrag('top', e)}
                      title={`Top: ${border.top}px`}
                    />
                    <div
                      role="slider"
                      aria-label="Right border"
                      aria-valuenow={border.right}
                      className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-foreground shadow cursor-ew-resize pointer-events-auto z-20 select-none touch-none"
                      onPointerDown={(e) => startDrag('right', e)}
                      title={`Right: ${border.right}px`}
                    />
                    <div
                      role="slider"
                      aria-label="Bottom border"
                      aria-valuenow={border.bottom}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-foreground shadow cursor-ns-resize pointer-events-auto z-20 select-none touch-none"
                      onPointerDown={(e) => startDrag('bottom', e)}
                      title={`Bottom: ${border.bottom}px`}
                    />
                    <div
                      role="slider"
                      aria-label="Left border"
                      aria-valuenow={border.left}
                      className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-white border border-foreground shadow cursor-ew-resize pointer-events-auto z-20 select-none touch-none"
                      onPointerDown={(e) => startDrag('left', e)}
                      title={`Left: ${border.left}px`}
                    />
                  </div>

                  {/* End measurement arrows */}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
