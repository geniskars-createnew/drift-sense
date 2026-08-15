import { MatchResult } from './matcher';

export interface NavError {
  deltaX: number;
  deltaY: number;
  euclidean: number;
  withinTolerance: boolean;
}

/**
 * Computes displacement (dx, dy) of the found structure relative to expected center.
 * SIGN CONVENTION:
 * - If predicted.x < expected.x (structure shifted LEFT of expected), deltaX < 0 ("left_shift")
 * - If predicted.x > expected.x (structure shifted RIGHT of expected), deltaX > 0 ("right_shift")
 * - If predicted.y < expected.y (structure shifted UP of expected), deltaY < 0 ("up_shift")
 * - If predicted.y > expected.y (structure shifted DOWN of expected), deltaY > 0 ("down_shift")
 */
export function computeNavigationError(
  predicted: { x: number; y: number },
  expected: { x: number; y: number },
  tolerancePx: number = 5
): NavError {
  const deltaX = predicted.x - expected.x;
  const deltaY = predicted.y - expected.y;
  const euclidean = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const withinTolerance = euclidean < tolerancePx;

  return {
    deltaX: Math.round(deltaX * 100) / 100,
    deltaY: Math.round(deltaY * 100) / 100,
    euclidean: Math.round(euclidean * 100) / 100,
    withinTolerance,
  };
}

/**
 * Classifies directional shift from displacement (dx, dy) based on unified sign convention.
 */
export function classifyShiftDirection(
  dx: number,
  dy: number,
  thresholdPx: number = 1.8
): 'left_shift' | 'right_shift' | 'up_shift' | 'down_shift' | 'stable' {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const euclidean = Math.hypot(dx, dy);

  if (euclidean < thresholdPx) {
    return 'stable';
  }

  if (absDx >= absDy) {
    return dx < 0 ? 'left_shift' : 'right_shift';
  } else {
    return dy < 0 ? 'up_shift' : 'down_shift';
  }
}

/**
 * Analyzes the morphological shape of a pixel-difference mask between aligned reference
 * and inspection images.
 *
 * Distinguishes between:
 * - 'scratch': Long thin elongated shape (aspect ratio > 4:1 using bounding box or PCA-based axis ratio)
 * - 'edge_ring': Annulus shape near outer boundary of wafer circle (outer 20% radius band, low in center)
 * - 'center': Roughly circular/compact blob near the wafer center
 * - 'unknown': No prominent defect signature or ambiguous geometry
 */
export function classifyDefectShape(
  diffMask: Uint8ClampedArray,
  width: number,
  height: number
): 'scratch' | 'center' | 'edge_ring' | 'unknown' {
  if (!diffMask || width <= 0 || height <= 0) return 'unknown';

  const isRGBA = diffMask.length >= width * height * 4;
  const step = isRGBA ? 4 : 1;
  const totalPixels = width * height;

  const threshold = 28; // Minimum intensity difference threshold
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const outerBandThreshold = 0.75 * maxRadius;
  const centerBandThreshold = 0.45 * maxRadius;

  // 1. Collect defect coordinates and compute global metrics
  const defectPoints: { x: number; y: number }[] = [];
  let outerBandCount = 0;
  let centerBandCount = 0;
  let middleBandCount = 0;

  // Track angular distribution in 12 sectors around center for annulus check
  const angleBins = new Uint32Array(12);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * step;
      // If RGBA, compute luminance; otherwise use single channel value
      const val = isRGBA
        ? 0.299 * diffMask[idx] + 0.587 * diffMask[idx + 1] + 0.114 * diffMask[idx + 2]
        : diffMask[idx];

      if (val > threshold) {
        defectPoints.push({ x, y });
        const dist = Math.hypot(x - centerX, y - centerY);

        if (dist >= outerBandThreshold) {
          outerBandCount++;
          // Compute polar angle [0..2PI)
          let angle = Math.atan2(y - centerY, x - centerX);
          if (angle < 0) angle += 2 * Math.PI;
          const bin = Math.min(11, Math.floor((angle / (2 * Math.PI)) * 12));
          angleBins[bin]++;
        } else if (dist <= centerBandThreshold) {
          centerBandCount++;
        } else {
          middleBandCount++;
        }
      }
    }
  }

  const numDefectPixels = defectPoints.length;
  // Minimum defect threshold: must have at least ~0.3% of image as defect
  if (numDefectPixels < Math.max(12, totalPixels * 0.003)) {
    return 'unknown';
  }

  // 2. Compute Connected Components (BFS on 2D grid)
  const visited = new Uint8Array(totalPixels);
  const components: {
    points: { x: number; y: number }[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    aspectRatio: number;
    pcaRatio: number;
    meanDistFromCenter: number;
  }[] = [];

  // Binary lookup grid for fast BFS
  const grid = new Uint8Array(totalPixels);
  for (const pt of defectPoints) {
    grid[pt.y * width + pt.x] = 1;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      if (grid[pIdx] === 1 && visited[pIdx] === 0) {
        // Start new component
        const compPoints: { x: number; y: number }[] = [];
        const queue: number[] = [pIdx];
        visited[pIdx] = 1;

        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let sumX = 0;
        let sumY = 0;

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cy = Math.floor(curr / width);
          const cx = curr % width;

          compPoints.push({ x: cx, y: cy });
          sumX += cx;
          sumY += cy;

          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-neighborhood
          const neighbors = [
            cy > 0 ? (cy - 1) * width + cx : -1,
            cy < height - 1 ? (cy + 1) * width + cx : -1,
            cx > 0 ? cy * width + (cx - 1) : -1,
            cx < width - 1 ? cy * width + (cx + 1) : -1,
          ];

          for (const nIdx of neighbors) {
            if (nIdx !== -1 && grid[nIdx] === 1 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }

        const compSize = compPoints.length;
        if (compSize >= 8) {
          const bboxW = maxX - minX + 1;
          const bboxH = maxY - minY + 1;
          const bboxAspectRatio = Math.max(bboxW, bboxH) / Math.max(1, Math.min(bboxW, bboxH));

          // Compute PCA / Second-order central moments
          const meanX = sumX / compSize;
          const meanY = sumY / compSize;
          let mu20 = 0;
          let mu02 = 0;
          let mu11 = 0;
          let distSum = 0;

          for (const pt of compPoints) {
            const dx = pt.x - meanX;
            const dy = pt.y - meanY;
            mu20 += dx * dx;
            mu02 += dy * dy;
            mu11 += dx * dy;
            distSum += Math.hypot(pt.x - centerX, pt.y - centerY);
          }

          mu20 /= compSize;
          mu02 /= compSize;
          mu11 /= compSize;

          const trace = mu20 + mu02;
          const det = mu20 * mu02 - mu11 * mu11;
          const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));
          const lambda1 = (trace + disc) / 2;
          const lambda2 = Math.max(1e-4, (trace - disc) / 2);
          const pcaRatio = Math.sqrt(Math.max(1, lambda1 / lambda2));

          components.push({
            points: compPoints,
            minX,
            maxX,
            minY,
            maxY,
            aspectRatio: bboxAspectRatio,
            pcaRatio,
            meanDistFromCenter: distSum / compSize,
          });
        }
      }
    }
  }

  // Sort components by size descending
  components.sort((a, b) => b.points.length - a.points.length);
  const primaryComponent = components[0];

  // 3. SHAPE DISCRIMINATION RULES

  // a) Long thin elongated shape (Scratch)
  // Check if primary component or any large component has aspect ratio > 4:1 (or PCA ratio > 4:1)
  if (primaryComponent) {
    const hasLongElongated = components.some(
      (c) =>
        c.points.length >= 10 &&
        (c.pcaRatio >= 3.8 || (c.aspectRatio >= 4.0 && c.points.length / (Math.max(1, c.maxX - c.minX) * Math.max(1, c.maxY - c.minY)) < 0.6))
    );

    if (hasLongElongated) {
      return 'scratch';
    }
  }

  // Global PCA over all defect points if components are fragmented
  if (defectPoints.length >= 15) {
    let sumX = 0;
    let sumY = 0;
    for (const pt of defectPoints) {
      sumX += pt.x;
      sumY += pt.y;
    }
    const meanX = sumX / defectPoints.length;
    const meanY = sumY / defectPoints.length;

    let gMu20 = 0;
    let gMu02 = 0;
    let gMu11 = 0;
    for (const pt of defectPoints) {
      const dx = pt.x - meanX;
      const dy = pt.y - meanY;
      gMu20 += dx * dx;
      gMu02 += dy * dy;
      gMu11 += dx * dy;
    }
    gMu20 /= defectPoints.length;
    gMu02 /= defectPoints.length;
    gMu11 /= defectPoints.length;

    const gTrace = gMu20 + gMu02;
    const gDet = gMu20 * gMu02 - gMu11 * gMu11;
    const gDisc = Math.sqrt(Math.max(0, gTrace * gTrace - 4 * gDet));
    const gLambda1 = (gTrace + gDisc) / 2;
    const gLambda2 = Math.max(1e-4, (gTrace - gDisc) / 2);
    const globalPcaRatio = Math.sqrt(Math.max(1, gLambda1 / gLambda2));

    if (globalPcaRatio >= 4.0) {
      return 'scratch';
    }
  }

  // b) Ring / Annulus shape near outer boundary (Edge Ring)
  // High density in outer 20% radius band, low density in center, spans multiple angular sectors
  let occupiedAngleSectors = 0;
  for (let i = 0; i < 12; i++) {
    if (angleBins[i] > 0) occupiedAngleSectors++;
  }

  const outerRatio = outerBandCount / numDefectPixels;
  const centerRatio = centerBandCount / numDefectPixels;

  if (outerRatio >= 0.52 || (outerBandCount > 25 && occupiedAngleSectors >= 4 && centerRatio < 0.25)) {
    return 'edge_ring';
  }

  // c) Roughly circular/compact blob near the wafer center (Center Defect)
  if (centerRatio >= 0.50 || (centerBandCount > 20 && outerRatio < 0.25)) {
    return 'center';
  }

  // Secondary check based on mean distance of primary component from wafer center
  if (primaryComponent) {
    if (primaryComponent.meanDistFromCenter <= centerBandThreshold && primaryComponent.pcaRatio < 3.0) {
      return 'center';
    }
    if (primaryComponent.meanDistFromCenter >= outerBandThreshold && occupiedAngleSectors >= 3) {
      return 'edge_ring';
    }
  }

  return 'unknown';
}

/**
 * Verifies if match result indicates a defect based on confidence or structural anomalies.
 */
export function classifyDefect(
  matchResult: MatchResult,
  errorThreshold: number = 0.6
): { isDefect: boolean; reason: string } {
  const thresholdPct = errorThreshold <= 1 ? errorThreshold * 100 : errorThreshold;

  if (matchResult.confidence < thresholdPct) {
    return {
      isDefect: true,
      reason: 'low match confidence — possible structural defect or navigation drift',
    };
  }

  // Check if top 2 candidates have very close scores (ambiguous periodic match)
  if (matchResult.candidates && matchResult.candidates.length > 1) {
    const gap = Math.abs(matchResult.candidates[0].score - matchResult.candidates[1].score);
    if (gap < 0.05) {
      return {
        isDefect: true,
        reason: 'ambiguous periodic pattern — low localization certainty',
      };
    }
  }

  return {
    isDefect: false,
    reason: 'pattern match verified — normal alignment',
  };
}

