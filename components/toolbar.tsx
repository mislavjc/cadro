'use client';

import type { Border, DroppedImage, Side } from '../lib/types';

import { Minimap } from './minimap';

type ToolbarProps = {
  image: DroppedImage | null;
  border: Border;
  unit: 'px' | '%';
  setUnit: (u: 'px' | '%') => void;
  linkAll: boolean;
  setLinkAll: (updater: (v: boolean) => boolean) => void;
  linkTB: boolean;
  setLinkTB: (updater: (v: boolean) => boolean) => void;
  linkLR: boolean;
  setLinkLR: (updater: (v: boolean) => boolean) => void;
  getDisplayValue: (side: Side) => number;
  updateBorderFromDisplay: (side: Side, value: number) => void;
  borderMax: number;
};

export const Toolbar = ({
  image,
  border,
  unit,
  setUnit,
  linkAll,
  setLinkAll,
  linkTB,
  setLinkTB,
  linkLR,
  setLinkLR,
  getDisplayValue,
  updateBorderFromDisplay,
  borderMax,
}: ToolbarProps) => {
  return (
    <div className="px-4 pt-3 pb-2 border-b border-foreground/10 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/35">
      <div className="text-xs grid grid-cols-2 gap-3 md:grid md:grid-cols-3 md:items-center md:gap-4">
        <div className="hidden md:grid md:col-start-1 grid-cols-4 gap-2 items-end">
          {(['top', 'right', 'bottom', 'left'] as Side[]).map((side) => (
            <label className="grid gap-1" key={side}>
              <span className="opacity-70 text-[11px]">
                {side[0].toUpperCase() + side.slice(1)}
              </span>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  step={unit === 'px' ? 1 : 0.1}
                  aria-label={`${side} border`}
                  className="h-8 w-20 rounded border pr-7 pl-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right font-mono tabular-nums"
                  value={getDisplayValue(side)}
                  min={0}
                  max={unit === 'px' ? borderMax : 100}
                  onChange={(e) =>
                    updateBorderFromDisplay(
                      side,
                      parseFloat(e.currentTarget.value || '0'),
                    )
                  }
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">
                  {unit}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 md:col-start-2 md:justify-self-center">
          <Minimap
            image={image}
            border={border}
            unit={unit}
            getDisplayValue={getDisplayValue}
          />
        </div>

        <div className="col-start-2 justify-self-end md:col-start-3 flex flex-wrap items-center gap-3 md:gap-4">
          <div className="grid gap-1 md:ml-0">
            <span className="opacity-70 text-[11px]">Link</span>
            <div className="inline-flex rounded-md border border-foreground/20 overflow-hidden bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <button
                type="button"
                title="Link all sides"
                aria-pressed={linkAll}
                className={`h-8 px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  linkAll
                    ? 'bg-foreground text-background'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setLinkAll((v) => !v)}
              >
                ALL
              </button>
              <button
                type="button"
                title="Link Top-Bottom"
                aria-pressed={linkTB && !linkAll}
                className={`h-8 px-2.5 text-xs border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  linkTB && !linkAll
                    ? 'bg-foreground text-background'
                    : 'hover:bg-foreground/5'
                } ${linkAll ? 'disabled:opacity-50' : ''}`}
                onClick={() => setLinkTB((v) => !v)}
                disabled={linkAll}
              >
                T=B
              </button>
              <button
                type="button"
                title="Link Left-Right"
                aria-pressed={linkLR && !linkAll}
                className={`h-8 px-2.5 text-xs border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  linkLR && !linkAll
                    ? 'bg-foreground text-background'
                    : 'hover:bg-foreground/5'
                } ${linkAll ? 'disabled:opacity-50' : ''}`}
                onClick={() => setLinkLR((v) => !v)}
                disabled={linkAll}
              >
                L=R
              </button>
            </div>
          </div>
          <div className="grid gap-1">
            <span className="opacity-70 text-[11px]">Units</span>
            <div className="inline-flex rounded-md border border-foreground/20 overflow-hidden bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <button
                type="button"
                title="Use pixels"
                aria-pressed={unit === 'px'}
                className={`h-8 px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  unit === 'px'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setUnit('px')}
              >
                PX
              </button>
              <button
                type="button"
                title="Use percent"
                aria-pressed={unit === '%'}
                className={`h-8 px-2.5 text-xs border-l transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  unit === '%'
                    ? 'bg-foreground text-background'
                    : 'hover:bg-foreground/5'
                }`}
                onClick={() => setUnit('%')}
              >
                %
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:hidden grid-cols-4 gap-2 w-full col-span-2">
          {(['top', 'right', 'bottom', 'left'] as Side[]).map((side) => (
            <label className="grid gap-1" key={`m-${side}`}>
              <span className="opacity-70 text-[11px]">
                {side[0].toUpperCase()}
              </span>
              <input
                type="number"
                inputMode="numeric"
                step={unit === 'px' ? 1 : 0.1}
                aria-label={`${side} border`}
                className="h-8 w-full rounded border px-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring text-right font-mono tabular-nums"
                value={getDisplayValue(side)}
                min={0}
                max={unit === 'px' ? borderMax : 100}
                onChange={(e) =>
                  updateBorderFromDisplay(
                    side,
                    parseFloat(e.currentTarget.value || '0'),
                  )
                }
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
