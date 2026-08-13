import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Flame, Grid, Target, Maximize2 } from 'lucide-react';
import { renderWaferCanvas } from '../../utils/waferGenerator';

interface WaferCanvasProps {
  type: 'reference' | 'drifted' | 'aligned' | 'heatmap' | 'diff';
  driftXNm?: number;
  driftYNm?: number;
  rotationDeg?: number;
  noiseLevel?: number;
  title?: string;
  subTitle?: string;
  showControls?: boolean;
  enableSliderMode?: boolean;
  className?: string;
  height?: number;
  datasetScenario?: 'stable' | 'center_growth' | 'edge_ring_onset' | 'scratch_migration';
  driftStrength?: number;
  lotIndex?: number;
}

export const WaferCanvas: React.FC<WaferCanvasProps> = ({
  type,
  driftXNm = 0,
  driftYNm = 0,
  rotationDeg = 0,
  noiseLevel = 0.1,
  title,
  subTitle,
  showControls = true,
  enableSliderMode = false,
  className = '',
  height = 360,
  datasetScenario,
  driftStrength = 0,
  lotIndex = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [sliderPos, setSliderPos] = useState(50); // percentage for before/after slider

  // Render on prop or interaction change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive Canvas Resizing
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth || 500;
      canvas.height = height;
    }

    renderWaferCanvas({
      canvas,
      type,
      driftXNm,
      driftYNm,
      rotationDeg,
      noiseLevel,
      zoom,
      panX: pan.x,
      panY: pan.y,
      showCrosshair,
      showGrid,
      showHeatmapOverlay: showHeatmap,
      datasetScenario,
      driftStrength,
      lotIndex,
    });
  }, [
    type,
    driftXNm,
    driftYNm,
    rotationDeg,
    noiseLevel,
    zoom,
    pan,
    showHeatmap,
    showGrid,
    showCrosshair,
    height,
    datasetScenario,
    driftStrength,
    lotIndex,
  ]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Header Bar */}
      {(title || showControls) && (
        <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                type === 'reference'
                  ? 'bg-cyan-400 animate-pulse'
                  : type === 'drifted'
                  ? 'bg-amber-400 animate-pulse'
                  : type === 'diff'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="font-semibold text-slate-200 uppercase tracking-wider">{title || type}</span>
            {subTitle && <span className="text-slate-400 hidden sm:inline">({subTitle})</span>}
          </div>

          {showControls && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/60 text-slate-300">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z * 1.25, 4))}
                title="Zoom In"
                className="p-1 hover:text-cyan-400 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z / 1.25, 0.5))}
                title="Zoom Out"
                className="p-1 hover:text-cyan-400 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset Pan/Zoom"
                className="p-1 hover:text-cyan-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => setShowHeatmap(!showHeatmap)}
                title="Toggle Error Heatmap Overlay"
                className={`p-1 transition-colors ${showHeatmap ? 'text-amber-400 font-bold' : 'hover:text-amber-400'}`}
              >
                <Flame className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Die Grid"
                className={`p-1 transition-colors ${showGrid ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowCrosshair(!showCrosshair)}
                title="Toggle Crosshair Reticle"
                className={`p-1 transition-colors ${showCrosshair ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
              >
                <Target className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleFullscreen}
                title="Toggle Fullscreen"
                className="p-1 hover:text-cyan-400 transition-colors ml-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Canvas Container */}
      <div
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Before/After Split Slider Mode if enabled */}
        {enableSliderMode && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Split line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_#06B6D4] pointer-events-auto cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                ↔
              </div>
            </div>
          </div>
        )}

        {/* Scale Bar Indicator */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 flex items-center gap-2">
          <div className="w-8 h-1 bg-cyan-400 rounded-sm" />
          <span>{Math.round(100 / zoom)} nm</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">ZOOM: {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};
