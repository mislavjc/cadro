'use client';

import type { DroppedImage } from '../lib/types';

type AppHeaderProps = {
  image: DroppedImage | null;
  isExporting: boolean;
  onExport: () => void;
};

export const AppHeader = ({ image, isExporting, onExport }: AppHeaderProps) => {
  return (
    <header className="sticky top-4 z-30 mx-auto w-[calc(100%-3rem)] max-w-5xl px-4 py-2.5 flex items-center gap-3 rounded-xl border bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <h1 className="text-xl font-medium mr-auto">Border Lab</h1>
      <button
        type="button"
        onClick={onExport}
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
  );
};
