'use client';

import React from 'react';

import type { Border, DroppedImage, Side } from '../lib/types';

type BorderStageProps = {
  image: DroppedImage | null;
  isDraggingOver: boolean;
  onBrowse: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFilesChange: (files: FileList | null) => void;
  innerRef: React.RefObject<HTMLDivElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  display: { width: number; height: number; scale: number };
  border: Border;
  unit: 'px' | '%';
  getDisplayValue: (side: Side) => number;
  onStartDrag: (side: Side, e: React.PointerEvent<HTMLDivElement>) => void;
};

export const BorderStage = ({
  image,
  isDraggingOver,
  onBrowse,
  fileInputRef,
  onFilesChange,
  innerRef,
  imgRef,
  display,
  border,
  unit,
  getDisplayValue,
  onStartDrag,
}: BorderStageProps) => {
  return (
    <div className="relative flex-1">
      {!image && (
        <button
          type="button"
          onClick={onBrowse}
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
        onChange={(e) => onFilesChange(e.currentTarget.files)}
      />

      {/* Drop handling is managed by the outer paper container to avoid overlay blocking */}

      {image && (
        <div
          ref={innerRef}
          className="absolute inset-4 overflow-visible flex items-center justify-center"
        >
          <div
            data-og-stage
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

            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                onPointerDown={(e) => onStartDrag('top', e)}
                title={`Top: ${getDisplayValue('top')}${unit}`}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                onPointerDown={(e) => onStartDrag('bottom', e)}
                title={`Bottom: ${getDisplayValue('bottom')}${unit}`}
              />
              <div
                className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                onPointerDown={(e) => onStartDrag('left', e)}
                title={`Left: ${getDisplayValue('left')}${unit}`}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize pointer-events-auto z-10 bg-transparent hover:bg-foreground/5 select-none touch-none"
                onPointerDown={(e) => onStartDrag('right', e)}
                title={`Right: ${getDisplayValue('right')}${unit}`}
              />

              <div
                role="slider"
                aria-label="Top border"
                aria-valuenow={getDisplayValue('top')}
                className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border border-foreground/20 cursor-ns-resize pointer-events-auto z-20 select-none touch-none transition flex flex-col items-center justify-center"
                onPointerDown={(e) => onStartDrag('top', e)}
                title={`Top: ${getDisplayValue('top')}${unit}`}
              >
                <div className="w-3 h-px bg-foreground/50" />
                <div className="w-3 h-px bg-foreground/50 mt-0.5" />
              </div>
              <div
                role="slider"
                aria-label="Right border"
                aria-valuenow={getDisplayValue('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border border-foreground/20 cursor-ew-resize pointer-events-auto z-20 select-none touch-none transition flex items-center justify-center"
                onPointerDown={(e) => onStartDrag('right', e)}
                title={`Right: ${getDisplayValue('right')}${unit}`}
              >
                <div className="h-3 w-px bg-foreground/50" />
                <div className="h-3 w-px bg-foreground/50 ml-0.5" />
              </div>
              <div
                role="slider"
                aria-label="Bottom border"
                aria-valuenow={getDisplayValue('bottom')}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border border-foreground/20 cursor-ns-resize pointer-events-auto z-20 select-none touch-none transition flex flex-col items-center justify-center"
                onPointerDown={(e) => onStartDrag('bottom', e)}
                title={`Bottom: ${getDisplayValue('bottom')}${unit}`}
              >
                <div className="w-3 h-px bg-foreground/50" />
                <div className="w-3 h-px bg-foreground/50 mt-0.5" />
              </div>
              <div
                role="slider"
                aria-label="Left border"
                aria-valuenow={getDisplayValue('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-white/90 supports-[backdrop-filter]:bg-white/70 backdrop-blur border border-foreground/20 cursor-ew-resize pointer-events-auto z-20 select-none touch-none transition flex items-center justify-center"
                onPointerDown={(e) => onStartDrag('left', e)}
                title={`Left: ${getDisplayValue('left')}${unit}`}
              >
                <div className="h-3 w-px bg-foreground/50" />
                <div className="h-3 w-px bg-foreground/50 ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
