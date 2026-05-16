'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type ImageLightboxProps = {
  open: boolean;
  src: string | undefined;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ open, src, alt, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, zoomIn, zoomOut]);

  useEffect(() => {
    if (open) setZoom(1);
  }, [src, open]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="معاينة الصورة"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-[2px] cursor-zoom-out"
        onClick={onClose}
        aria-label="إغلاق المعاينة"
      />

      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-3 pointer-events-none">
        <p className="text-white/90 text-sm font-medium truncate pointer-events-auto">{alt}</p>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
            disabled={zoom <= MIN_ZOOM}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="تصغير"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="min-w-[3.5rem] text-center text-sm text-white/80 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
            disabled={zoom >= MAX_ZOOM}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="تكبير"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            disabled={zoom === 1}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="إعادة ضبط التكبير"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-red-500/30 hover:border-red-400/40 transition-colors flex items-center justify-center"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="relative z-[1] max-w-[95vw] max-h-[85vh] p-4 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            'flex items-center justify-center transition-transform duration-200 ease-out origin-center',
            zoom > 1 && 'cursor-grab',
          )}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
