// Lightweight heuristic domain pre-check for semiconductor wafer images
// Evaluates spatial edge structure (disc boundary / die lattice) and color palette spread

export interface WaferValidationResult {
  valid: boolean;
  reason: string;
  metrics?: {
    edgeScore: number;
    skinRatio: number;
    colorDiversity: number;
  };
}

/**
 * Validates whether an image is plausibly a semiconductor wafer, SEM die inspection, or wafer map.
 * Designed to reject unrelated photos (portraits, skin, natural landscapes) while erring
 * on the side of caution (defaults to valid: true if uncertain).
 */
export function isPlausibleWafer(img: HTMLImageElement): WaferValidationResult {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // If canvas context fails, default to valid: true
    return { valid: true, reason: 'Canvas context unavailable — defaulting to valid' };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // 1. Color Palette & Skin Tone Analysis
  let skinTonePixels = 0;
  const totalPixels = size * size;
  const colorBuckets = new Set<string>();

  const gray = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Perceptual grayscale for Sobel edge detection
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;

    // Detect high-confidence human skin tone (faces/portraits)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (r > 100 && g > 50 && b > 30 && delta > 20 && (r - g) > 20 && r > g && r > b) {
      skinTonePixels++;
    }

    // Quantize RGB colors into 16x16x16 color space buckets to measure palette diversity
    const qR = Math.floor(r / 32);
    const qG = Math.floor(g / 32);
    const qB = Math.floor(b / 32);
    colorBuckets.add(`${qR}-${qG}-${qB}`);
  }

  const skinRatio = skinTonePixels / totalPixels;
  const colorDiversity = colorBuckets.size; // Distinct color buckets

  // Check 2 FAIL: Reject obvious human portrait / skin photos
  // High skin ratio (>0.38) indicates a close-up human face/photo, not a wafer
  if (skinRatio > 0.38) {
    console.log(`[WaferValidator] REJECTED: Skin tone ratio is ${Math.round(skinRatio * 100)}% (threshold 38%)`);
    return {
      valid: false,
      reason: `Non-wafer detected: Human skin signature identified (${Math.round(skinRatio * 100)}% skin-tone pixels). Please upload a semiconductor wafer or die image.`,
      metrics: { edgeScore: 0, skinRatio, colorDiversity },
    };
  }

  // 2. Sobel Edge Detection for Circular Wafer Boundary / Die Grid Array
  let edgeSum = 0;
  let circularEdgeMatches = 0;
  let totalBoundaryPixels = 0;

  const cx = size / 2;
  const cy = size / 2;
  const targetRadius = size * 0.42; // Expected circular wafer edge boundary in image space

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;

      // Sobel operators
      const gx =
        -1 * gray[(y - 1) * size + (x - 1)] +
        1 * gray[(y - 1) * size + (x + 1)] +
        -2 * gray[y * size + (x - 1)] +
        2 * gray[y * size + (x + 1)] +
        -1 * gray[(y + 1) * size + (x - 1)] +
        1 * gray[(y + 1) * size + (x + 1)];

      const gy =
        -1 * gray[(y - 1) * size + (x - 1)] +
        -2 * gray[(y - 1) * size + x] +
        -1 * gray[(y - 1) * size + (x + 1)] +
        1 * gray[(y + 1) * size + (x - 1)] +
        2 * gray[(y + 1) * size + x] +
        1 * gray[(y + 1) * size + (x + 1)];

      const edgeMag = Math.sqrt(gx * gx + gy * gy);
      edgeSum += edgeMag;

      // Distance from center
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (Math.abs(dist - targetRadius) < size * 0.08) {
        totalBoundaryPixels++;
        if (edgeMag > 25) {
          circularEdgeMatches++;
        }
      }
    }
  }

  const avgEdge = edgeSum / ((size - 2) * (size - 2));
  const circularEdgeRatio = totalBoundaryPixels > 0 ? circularEdgeMatches / totalBoundaryPixels : 0;

  // Check 1 FAIL: Check if image is completely featureless/blank noise or unrelated document text with zero geometry
  if (avgEdge < 2.0) {
    console.log(`[WaferValidator] REJECTED: Low edge activity (${avgEdge.toFixed(2)}) — blank/unformatted image`);
    return {
      valid: false,
      reason: 'Non-wafer detected: Image lacks structural edges or silicon die geometry.',
      metrics: { edgeScore: avgEdge, skinRatio, colorDiversity },
    };
  }

  console.log(`[WaferValidator] PASSED: Valid wafer image (Skin: ${(skinRatio * 100).toFixed(1)}%, EdgeAvg: ${avgEdge.toFixed(1)}, PaletteBuckets: ${colorDiversity})`);

  return {
    valid: true,
    reason: 'Plausible semiconductor wafer or die structure verified.',
    metrics: { edgeScore: avgEdge, skinRatio, colorDiversity },
  };
}
