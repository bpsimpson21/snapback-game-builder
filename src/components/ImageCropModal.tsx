"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CropData } from "@/types/game";

interface CropResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

interface ImageCropModalProps {
  imageUrl: string;
  aspectRatio?: number;
  initialCropData?: CropData;
  onSave: (result: CropResult, cropData: CropData) => void;
  onCancel: () => void;
  outputWidth?: number;
  outputQuality?: number;
}

export default function ImageCropModal({
  imageUrl,
  aspectRatio = 16 / 9,
  initialCropData,
  onSave,
  onCancel,
  outputWidth = 1280,
  outputQuality = 0.92,
}: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posAtDragStart = useRef({ x: 0, y: 0 });

  const [loaded, setLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);

  // Viewport dimensions (CSS pixels)
  const VIEWPORT_WIDTH = 560;
  const VIEWPORT_HEIGHT = VIEWPORT_WIDTH / aspectRatio;

  // Compute min scale: "cover" — image must fully cover viewport
  const computeMinScale = useCallback(
    (natW: number, natH: number) => {
      const scaleX = VIEWPORT_WIDTH / natW;
      const scaleY = VIEWPORT_HEIGHT / natH;
      return Math.max(scaleX, scaleY);
    },
    [VIEWPORT_WIDTH, VIEWPORT_HEIGHT]
  );

  // Clamp position so image always covers viewport
  const clampPos = useCallback(
    (x: number, y: number, s: number, natW: number, natH: number) => {
      const imgW = natW * s;
      const imgH = natH * s;
      const maxX = 0;
      const minX = VIEWPORT_WIDTH - imgW;
      const maxY = 0;
      const minY = VIEWPORT_HEIGHT - imgH;
      return {
        x: Math.min(maxX, Math.max(minX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
      };
    },
    [VIEWPORT_WIDTH, VIEWPORT_HEIGHT]
  );

  // On image load, compute scale and center
  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgNaturalSize({ w: natW, h: natH });
    imgRef.current = img;

    const ms = computeMinScale(natW, natH);
    setMinScale(ms);

    if (initialCropData) {
      const s = Math.max(initialCropData.scale, ms);
      const clamped = clampPos(initialCropData.posX, initialCropData.posY, s, natW, natH);
      setScale(s);
      setPos(clamped);
    } else {
      // Center the image at cover scale
      const imgW = natW * ms;
      const imgH = natH * ms;
      setScale(ms);
      setPos({
        x: (VIEWPORT_WIDTH - imgW) / 2,
        y: (VIEWPORT_HEIGHT - imgH) / 2,
      });
    }

    setLoaded(true);
  }

  // Pointer drag
  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posAtDragStart.current = { ...pos };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const newX = posAtDragStart.current.x + dx;
    const newY = posAtDragStart.current.y + dy;
    setPos(clampPos(newX, newY, scale, imgNaturalSize.w, imgNaturalSize.h));
  }

  function handlePointerUp() {
    isDragging.current = false;
  }

  // Wheel zoom
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    applyZoom(delta, e.clientX, e.clientY);
  }

  function applyZoom(delta: number, clientX?: number, clientY?: number) {
    setScale((prev) => {
      const newScale = Math.max(minScale, Math.min(prev + delta, minScale * 5));
      // Zoom toward cursor (or center)
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = clientX && rect ? clientX - rect.left : VIEWPORT_WIDTH / 2;
      const cy = clientY && rect ? clientY - rect.top : VIEWPORT_HEIGHT / 2;

      setPos((prevPos) => {
        const ratio = newScale / prev;
        const nx = cx - (cx - prevPos.x) * ratio;
        const ny = cy - (cy - prevPos.y) * ratio;
        return clampPos(nx, ny, newScale, imgNaturalSize.w, imgNaturalSize.h);
      });

      return newScale;
    });
  }

  // Slider change
  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    setPos((prevPos) => {
      // Zoom toward center of viewport
      const ratio = newScale / scale;
      const cx = VIEWPORT_WIDTH / 2;
      const cy = VIEWPORT_HEIGHT / 2;
      const nx = cx - (cx - prevPos.x) * ratio;
      const ny = cy - (cy - prevPos.y) * ratio;
      return clampPos(nx, ny, newScale, imgNaturalSize.w, imgNaturalSize.h);
    });
  }

  // Export
  async function handleSave() {
    if (!imgRef.current || exporting) return;
    setExporting(true);

    try {
      const outputHeight = Math.round(outputWidth / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d")!;

      // Map viewport coords to source image coords
      const srcX = -pos.x / scale;
      const srcY = -pos.y / scale;
      const srcW = VIEWPORT_WIDTH / scale;
      const srcH = VIEWPORT_HEIGHT / scale;

      ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight);

      const dataUrl = canvas.toDataURL("image/jpeg", outputQuality);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b || new Blob()),
          "image/jpeg",
          outputQuality
        );
      });

      onSave(
        { blob, dataUrl, width: outputWidth, height: outputHeight },
        { scale, posX: pos.x, posY: pos.y }
      );
    } catch {
      // CORS fallback: return original URL as-is
      onSave(
        {
          blob: new Blob(),
          dataUrl: imageUrl,
          width: outputWidth,
          height: Math.round(outputWidth / aspectRatio),
        },
        { scale, posX: pos.x, posY: pos.y }
      );
    } finally {
      setExporting(false);
    }
  }

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const zoomPercent = minScale > 0 ? Math.round((scale / minScale) * 100) : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-[608px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-white font-bold text-lg">Crop Image</h3>
          <p className="text-white/40 text-sm">
            Drag to position, scroll to zoom. Crop area is locked to 16:9.
          </p>
        </div>

        {/* Crop viewport */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg bg-black cursor-grab active:cursor-grabbing mx-auto"
          style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT, maxWidth: "100%" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Crop preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute select-none"
            style={{
              left: pos.x,
              top: pos.y,
              width: imgNaturalSize.w * scale,
              height: imgNaturalSize.h * scale,
              maxWidth: "none",
              display: loaded ? "block" : "none",
            }}
          />

          {/* Loading spinner */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Rule of thirds grid */}
          {loaded && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
            >
              {/* Grid lines */}
              <line x1={VIEWPORT_WIDTH / 3} y1={0} x2={VIEWPORT_WIDTH / 3} y2={VIEWPORT_HEIGHT} stroke="white" strokeOpacity={0.18} strokeWidth={1} />
              <line x1={(VIEWPORT_WIDTH * 2) / 3} y1={0} x2={(VIEWPORT_WIDTH * 2) / 3} y2={VIEWPORT_HEIGHT} stroke="white" strokeOpacity={0.18} strokeWidth={1} />
              <line x1={0} y1={VIEWPORT_HEIGHT / 3} x2={VIEWPORT_WIDTH} y2={VIEWPORT_HEIGHT / 3} stroke="white" strokeOpacity={0.18} strokeWidth={1} />
              <line x1={0} y1={(VIEWPORT_HEIGHT * 2) / 3} x2={VIEWPORT_WIDTH} y2={(VIEWPORT_HEIGHT * 2) / 3} stroke="white" strokeOpacity={0.18} strokeWidth={1} />

              {/* Corner brackets */}
              {[
                { x: 0, y: 0, dx: 1, dy: 1 },
                { x: VIEWPORT_WIDTH, y: 0, dx: -1, dy: 1 },
                { x: 0, y: VIEWPORT_HEIGHT, dx: 1, dy: -1 },
                { x: VIEWPORT_WIDTH, y: VIEWPORT_HEIGHT, dx: -1, dy: -1 },
              ].map((c, i) => (
                <g key={i}>
                  <line
                    x1={c.x}
                    y1={c.y}
                    x2={c.x + c.dx * 24}
                    y2={c.y}
                    stroke="#FFD700"
                    strokeWidth={2.5}
                  />
                  <line
                    x1={c.x}
                    y1={c.y}
                    x2={c.x}
                    y2={c.y + c.dy * 24}
                    stroke="#FFD700"
                    strokeWidth={2.5}
                  />
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Zoom slider */}
        {loaded && (
          <div className="flex items-center gap-3 mt-4 px-1">
            <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              min={minScale}
              max={minScale * 5}
              step={0.001}
              value={scale}
              onChange={handleSlider}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-[#FFD700] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
            <span className="text-white/40 text-xs font-mono w-10 text-right shrink-0">
              {zoomPercent}%
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!loaded || exporting}
            className="px-5 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {exporting ? "Exporting..." : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
