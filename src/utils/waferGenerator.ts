/**
 * Semiconductor Wafer Canvas Generator
 * Renders realistic synthetic semiconductor wafer inspection patterns,
 * fiducial alignment marks, circuit traces, defects, and applies physical drift.
 */

export interface RenderWaferOptions {
  canvas: HTMLCanvasElement;
  type: 'reference' | 'drifted' | 'aligned' | 'heatmap' | 'diff';
  driftXNm?: number; // X displacement in nm
  driftYNm?: number; // Y displacement in nm
  rotationDeg?: number; // Rotation in degrees
  noiseLevel?: number; // 0 to 1
  zoom?: number;
  panX?: number;
  panY?: number;
  showCrosshair?: boolean;
  showGrid?: boolean;
  showHeatmapOverlay?: boolean;
  waferType?: string;
  datasetScenario?: 'stable' | 'center_growth' | 'edge_ring_onset' | 'scratch_migration';
  driftStrength?: number;
  lotIndex?: number;
}

export function renderWaferCanvas(opts: RenderWaferOptions) {
  const {
    canvas,
    type,
    driftXNm = 0,
    driftYNm = 0,
    rotationDeg = 0,
    noiseLevel = 0.1,
    zoom = 1,
    panX = 0,
    panY = 0,
    showCrosshair = true,
    showGrid = true,
    showHeatmapOverlay = false,
    datasetScenario,
    driftStrength = 0,
    lotIndex = 0,
  } = opts;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas background (dark silicon wafer substrate or SEM image style)
  ctx.save();
  ctx.fillStyle = '#0F172A'; // Deep silicon dark slate
  ctx.fillRect(0, 0, width, height);

  // Set up world coordinate system centered at canvas center
  const centerX = width / 2 + panX;
  const centerY = height / 2 + panY;

  ctx.translate(centerX, centerY);
  ctx.scale(zoom, zoom);

  // Convert nm to pixels (1 pixel = 10 nm in our visual simulation scale)
  const dxPx = (type === 'drifted' ? driftXNm : 0) / 10;
  const dyPx = (type === 'drifted' ? driftYNm : 0) / 10;
  const rotRad = (type === 'drifted' ? rotationDeg : 0) * (Math.PI / 180);

  // Apply drift transforms for 'drifted' mode
  ctx.save();
  ctx.translate(dxPx, dyPx);
  ctx.rotate(rotRad);

  // If a dataset scenario is provided, render the dataset wafer disc
  if (datasetScenario) {
    drawDatasetWaferDisc(ctx, datasetScenario, driftStrength, lotIndex, type);
  } else {
    // Standard semiconductor IC circuit rendering
    if (showGrid) {
      const gridSize = 80;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -width; x < width; x += gridSize) {
        ctx.moveTo(x, -height);
        ctx.lineTo(x, height);
      }
      for (let y = -height; y < height; y += gridSize) {
        ctx.moveTo(-width, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
    drawSemiconductorCircuit(ctx, type, noiseLevel);
    drawFiducialMark(ctx);
  }

  ctx.restore(); // Restore from drift transform

  // 4. Heatmap overlay mode or overlay flag
  if (type === 'heatmap' || (showHeatmapOverlay && type === 'drifted')) {
    drawHeatmapOverlayLayer(ctx, width / zoom, height / zoom, driftXNm, driftYNm, rotationDeg);
  }

  ctx.restore(); // Restore from center transform

  // 5. Draw HUD & Crosshairs (fixed in screen space)
  if (showCrosshair) {
    drawScreenHUD(ctx, width, height, type, driftXNm, driftYNm, rotationDeg);
  }
}

/**
 * Renders the exact green wafer disc and red defect signatures matching user's inspection dataset
 */
function drawDatasetWaferDisc(
  ctx: CanvasRenderingContext2D,
  scenario: 'stable' | 'center_growth' | 'edge_ring_onset' | 'scratch_migration',
  driftStrength: number,
  lotIndex: number,
  type: string
) {
  const radius = 135;

  // 1. Draw Green Wafer Substrate Disc
  ctx.save();
  ctx.fillStyle = '#15803d'; // Rich green silicon wafer substrate
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Wafer Orientation Notch
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(0, radius - 2, 6, 0, Math.PI * 2);
  ctx.fill();

  // Wafer Die Grid Overlay on Green Substrate
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 0.8;
  const dieStep = 24;
  for (let x = -radius; x < radius; x += dieStep) {
    ctx.beginPath();
    ctx.moveTo(x, -radius);
    ctx.lineTo(x, radius);
    ctx.stroke();
  }
  for (let y = -radius; y < radius; y += dieStep) {
    ctx.beginPath();
    ctx.moveTo(-radius, y);
    ctx.lineTo(radius, y);
    ctx.stroke();
  }

  // Clip defects to inside the circular wafer disc
  ctx.beginPath();
  ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
  ctx.clip();

  // 2. Render Red Defect Pixel Patterns based on Scenario & Lot Index
  const defectColor = '#ef4444'; // Bright red defect pixels
  ctx.fillStyle = defectColor;
  const isDiffMode = type === 'diff';

  if (scenario === 'stable' || driftStrength === 0) {
    if (!isDiffMode) {
      // STABLE / NO DRIFT: Uniform sparse random noise across disc
      const seed = (lotIndex + 1) * 777;
      for (let i = 0; i < 90; i++) {
        const angle = ((seed * i * 17) % 360) * (Math.PI / 180);
        const r = ((seed * i * 31) % (radius - 10));
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        ctx.fillRect(px, py, 3, 3);
      }
    }
  } else if (scenario === 'center_growth') {
    // CENTER GROWTH: Red cluster concentrated at the wafer center, expanding with driftStrength
    const clusterRadius = Math.max(15, driftStrength * 95);
    const density = Math.floor(80 + driftStrength * 400);

    // Baseline background noise (skipped in diff mode)
    if (!isDiffMode) {
      for (let i = 0; i < 40; i++) {
        const angle = (i * 137.5) * (Math.PI / 180);
        const r = (i * 19) % (radius - 12);
        ctx.fillRect(Math.cos(angle) * r, Math.sin(angle) * r, 2.5, 2.5);
      }
    }

    // Dense expanding center cluster (new defects)
    for (let i = 0; i < density; i++) {
      const angle = (i * 2.399) % (Math.PI * 2);
      const dist = Math.pow(Math.random(), 0.6) * clusterRadius;
      ctx.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 3);
    }
  } else if (scenario === 'edge_ring_onset') {
    // EDGE RING ONSET: Dense ring along outer perimeter of wafer
    const ringInner = radius - 38;
    const ringOuter = radius - 8;
    const density = 380;

    // Baseline noise (skipped in diff mode)
    if (!isDiffMode) {
      for (let i = 0; i < 40; i++) {
        const angle = (i * 137.5) * (Math.PI / 180);
        const r = (i * 17) % (radius - 40);
        ctx.fillRect(Math.cos(angle) * r, Math.sin(angle) * r, 2.5, 2.5);
      }
    }

    // Outer edge ring cluster (new defects)
    for (let i = 0; i < density; i++) {
      const angle = (i * 1.618) % (Math.PI * 2);
      const dist = ringInner + Math.random() * (ringOuter - ringInner);
      ctx.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 3);
    }
  } else if (scenario === 'scratch_migration') {
    // SCRATCH MIGRATION: Continuous diagonal scratch line traversing across wafer surface
    const offset = (lotIndex - 6) * 12; // Migration shift per lot
    const lineLength = radius * 1.8;

    // Baseline noise (skipped in diff mode)
    if (!isDiffMode) {
      for (let i = 0; i < 40; i++) {
        const angle = (i * 137.5) * (Math.PI / 180);
        const r = (i * 23) % (radius - 12);
        ctx.fillRect(Math.cos(angle) * r, Math.sin(angle) * r, 2.5, 2.5);
      }
    }

    // Diagonal scratch path (new defects)
    ctx.save();
    ctx.rotate(-Math.PI / 4); // 45-degree angle
    for (let x = -lineLength / 2; x <= lineLength / 2; x += 1.5) {
      const jitterY = offset + (Math.random() - 0.5) * 6;
      ctx.fillRect(x, jitterY, 3, 3);
      // Secondary scratch particles
      if (Math.random() > 0.4) {
        ctx.fillRect(x + (Math.random() - 0.5) * 8, jitterY + (Math.random() - 0.5) * 8, 2, 2);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawSemiconductorCircuit(ctx: CanvasRenderingContext2D, type: string, noiseLevel: number) {
  // Primary Silicon Die Pad
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.roundRect(-160, -160, 320, 320, 12);
  ctx.fill();
  ctx.stroke();

  // Fine Metal 1/Metal 2 Circuit Traces
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Concentric IC routing tracks
  for (let r = 20; r <= 140; r += 20) {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  ctx.stroke();

  // Bus lines
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-150, 0); ctx.lineTo(150, 0);
  ctx.moveTo(0, -150); ctx.lineTo(0, 150);
  ctx.moveTo(-110, -110); ctx.lineTo(110, 110);
  ctx.moveTo(-110, 110); ctx.lineTo(110, -110);
  ctx.stroke();

  // Transistor Array Blocks
  ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 0.8;

  const positions = [-120, -60, 60, 120];
  positions.forEach(px => {
    positions.forEach(py => {
      ctx.fillRect(px - 18, py - 18, 36, 36);
      ctx.strokeRect(px - 18, py - 18, 36, 36);
      // Memory cell dot grid
      ctx.fillStyle = '#60A5FA';
      for (let dx = -10; dx <= 10; dx += 10) {
        for (let dy = -10; dy <= 10; dy += 10) {
          ctx.fillRect(px + dx - 1, py + dy - 1, 2, 2);
        }
      }
      ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
    });
  });

  // Simulated SEM Noise or Grain
  if (noiseLevel > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < noiseLevel * 300; i++) {
      const rx = (Math.random() - 0.5) * 320;
      const ry = (Math.random() - 0.5) * 320;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }
}

function drawFiducialMark(ctx: CanvasRenderingContext2D) {
  // Sub-micron High-Precision Cross-hair Fiducial Alignment Pattern
  ctx.shadowColor = '#06B6D4';
  ctx.shadowBlur = 8;

  // Outer ring
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 35, 0, Math.PI * 2);
  ctx.stroke();

  // Inner crosshair target
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Precision alignment ticks
  ctx.strokeStyle = '#22D3EE';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // North tick
  ctx.moveTo(0, -45); ctx.lineTo(0, -15);
  // South tick
  ctx.moveTo(0, 15); ctx.lineTo(0, 45);
  // West tick
  ctx.moveTo(-45, 0); ctx.lineTo(-15, 0);
  // East tick
  ctx.moveTo(15, 0); ctx.lineTo(45, 0);
  ctx.stroke();

  // L-shaped Corner alignment keys
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#10B981';
  ctx.strokeRect(-120, -120, 20, 20);
  ctx.strokeRect(100, -120, 20, 20);
  ctx.strokeRect(-120, 100, 20, 20);
  ctx.strokeRect(100, 100, 20, 20);

  ctx.shadowBlur = 0;
}

function drawHeatmapOverlayLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  driftX: number,
  driftY: number,
  rotation: number
) {
  // Creates a radial + directional error vector heatmap
  const totalDrift = Math.sqrt(driftX * driftX + driftY * driftY) + Math.abs(rotation) * 20;

  const gradient = ctx.createRadialGradient(
    (driftX / 10), (driftY / 10), 10,
    0, 0, Math.max(120, totalDrift * 2)
  );

  const normIntensity = Math.min(1.0, totalDrift / 150);
  gradient.addColorStop(0, `rgba(239, 68, 68, ${0.65 * normIntensity})`); // High error (Red)
  gradient.addColorStop(0.4, `rgba(245, 158, 11, ${0.45 * normIntensity})`); // Mid error (Amber)
  gradient.addColorStop(0.7, `rgba(16, 185, 129, ${0.25 * normIntensity})`); // Low error (Green)
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 200, 0, Math.PI * 2);
  ctx.fill();

  // Draw Drift Vector Arrow
  if (totalDrift > 0.5) {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(driftX / 10, driftY / 10);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(driftY, driftX);
    const headLen = 8;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(driftX / 10, driftY / 10);
    ctx.lineTo(
      driftX / 10 - headLen * Math.cos(angle - Math.PI / 6),
      driftY / 10 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      driftX / 10 - headLen * Math.cos(angle + Math.PI / 6),
      driftY / 10 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }
}

function drawScreenHUD(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: string,
  dx: number,
  dy: number,
  rot: number
) {
  // Screen center reticle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 20, height / 2);
  ctx.lineTo(width / 2 + 20, height / 2);
  ctx.moveTo(width / 2, height / 2 - 20);
  ctx.lineTo(width / 2, height / 2 + 20);
  ctx.stroke();

  // Corner Bounding Frame
  const p = 16;
  const l = 20;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
  ctx.lineWidth = 2;

  // Top Left
  ctx.beginPath(); ctx.moveTo(p, p + l); ctx.lineTo(p, p); ctx.lineTo(p + l, p); ctx.stroke();
  // Top Right
  ctx.beginPath(); ctx.moveTo(width - p - l, p); ctx.lineTo(width - p, p); ctx.lineTo(width - p, p + l); ctx.stroke();
  // Bottom Left
  ctx.beginPath(); ctx.moveTo(p, height - p - l); ctx.lineTo(p, height - p); ctx.lineTo(p + l, height - p); ctx.stroke();
  // Bottom Right
  ctx.beginPath(); ctx.moveTo(width - p - l, height - p); ctx.lineTo(width - p, height - p); ctx.lineTo(width - p, height - p - l); ctx.stroke();

  // Top Badge Status
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(p + 8, p + 8, 160, 28);
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.strokeRect(p + 8, p + 8, 160, 28);

  ctx.font = '11px monospace';
  ctx.fillStyle = type === 'reference' ? '#38BDF8' : type === 'drifted' ? '#F59E0B' : '#10B981';
  ctx.fillText(`VIEW: ${type.toUpperCase()}`, p + 16, p + 26);
}
