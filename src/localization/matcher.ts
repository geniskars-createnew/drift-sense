// Template matching localization engine using Normalized Cross-Correlation (NCC)
// Enhanced with multi-scale refinement, sub-pixel parabola interpolation,
// histogram equalization, Gaussian blur, small rotation tolerance, and calibrated confidence.

export interface MatchResult {
  x: number;
  y: number;
  confidence: number;
  candidates: { x: number; y: number; score: number }[];
}

interface GrayscaleData {
  data: Float32Array;
  width: number;
  height: number;
}

/**
 * Applies Histogram Equalization to Float32Array grayscale pixel data in-place (0..255).
 */
function equalizeHistogram(gray: Float32Array): void {
  const n = gray.length;
  if (n === 0) return;

  const hist = new Int32Array(256);
  for (let i = 0; i < n; i++) {
    const v = Math.min(255, Math.max(0, Math.round(gray[i])));
    hist[v]++;
  }

  const cdf = new Int32Array(256);
  let acc = 0;
  let cdfMin = -1;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    cdf[i] = acc;
    if (cdfMin === -1 && hist[i] > 0) {
      cdfMin = acc;
    }
  }

  if (cdfMin === -1 || n <= cdfMin) return;

  const lut = new Float32Array(256);
  const denom = n - cdfMin;
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255);
  }

  for (let i = 0; i < n; i++) {
    const v = Math.min(255, Math.max(0, Math.round(gray[i])));
    gray[i] = lut[v];
  }
}

/**
 * Applies a Gaussian Blur (3x3 kernel, sigma ~ 0.5) to 2D Float32Array grayscale pixel data.
 */
function gaussianBlur(data: Float32Array, width: number, height: number): Float32Array {
  const output = new Float32Array(width * height);
  // Normalized 3x3 Gaussian kernel for sigma = 0.5
  const wCenter = 0.3319;
  const wEdge = 0.1221;
  const wCorner = 0.0449;

  for (let y = 0; y < height; y++) {
    const yPrev = y > 0 ? y - 1 : y;
    const yNext = y < height - 1 ? y + 1 : y;

    const rowPrev = yPrev * width;
    const rowCurr = y * width;
    const rowNext = yNext * width;

    for (let x = 0; x < width; x++) {
      const xPrev = x > 0 ? x - 1 : x;
      const xNext = x < width - 1 ? x + 1 : x;

      const p00 = data[rowPrev + xPrev];
      const p10 = data[rowPrev + x];
      const p20 = data[rowPrev + xNext];

      const p01 = data[rowCurr + xPrev];
      const p11 = data[rowCurr + x];
      const p21 = data[rowCurr + xNext];

      const p02 = data[rowNext + xPrev];
      const p12 = data[rowNext + x];
      const p22 = data[rowNext + xNext];

      const val =
        (p00 + p20 + p02 + p22) * wCorner +
        (p10 + p01 + p21 + p12) * wEdge +
        p11 * wCenter;

      output[rowCurr + x] = val;
    }
  }

  return output;
}

/**
 * Converts an HTMLImageElement to a preprocessed 2D grayscale Float32Array.
 * Applies optional rotation, histogram equalization, and Gaussian noise suppression.
 */
function getGrayscaleData(
  img: HTMLImageElement,
  targetWidth?: number,
  targetHeight?: number,
  angleDeg = 0
): GrayscaleData {
  const w = Math.max(1, targetWidth || img.naturalWidth || img.width || 100);
  const h = Math.max(1, targetHeight || img.naturalHeight || img.height || 100);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { data: new Float32Array(w * h), width: w, height: h };
  }

  if (angleDeg !== 0) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }

  const imgData = ctx.getImageData(0, 0, w, h);
  const rgba = imgData.data;
  let gray = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Preprocessing: Histogram equalization & Gaussian blur (sigma = 0.5)
  equalizeHistogram(gray);
  gray = gaussianBlur(gray, w, h);

  return { data: gray, width: w, height: h };
}

/**
 * Computes Normalized Cross-Correlation (NCC) score between template patch and search image window.
 */
function computeNCC(
  search: GrayscaleData,
  startX: number,
  startY: number,
  template: GrayscaleData
): number {
  const tw = template.width;
  const th = template.height;
  const sw = search.width;
  const sh = search.height;

  if (startX < 0 || startY < 0 || startX + tw > sw || startY + th > sh) {
    return -1;
  }

  let sumT = 0;
  let sumI = 0;
  const count = tw * th;

  for (let ty = 0; ty < th; ty++) {
    const sOffset = (startY + ty) * sw + startX;
    const tOffset = ty * tw;
    for (let tx = 0; tx < tw; tx++) {
      sumI += search.data[sOffset + tx];
      sumT += template.data[tOffset + tx];
    }
  }

  const meanI = sumI / count;
  const meanT = sumT / count;

  let num = 0;
  let denomISq = 0;
  let denomTSq = 0;

  for (let ty = 0; ty < th; ty++) {
    const sOffset = (startY + ty) * sw + startX;
    const tOffset = ty * tw;
    for (let tx = 0; tx < tw; tx++) {
      const diffI = search.data[sOffset + tx] - meanI;
      const diffT = template.data[tOffset + tx] - meanT;

      num += diffI * diffT;
      denomISq += diffI * diffI;
      denomTSq += diffT * diffT;
    }
  }

  const denom = Math.sqrt(denomISq * denomTSq);
  if (denom < 1e-6) return 0;

  return num / denom;
}

/**
 * Performs high-precision multi-scale, sub-pixel template matching with
 * rotation tolerance, intensity normalization, and calibrated confidence.
 */
export async function localizeReference(
  referenceImg: HTMLImageElement,
  searchImg: HTMLImageElement,
  priorLocation?: { x: number; y: number }
): Promise<MatchResult> {
  const origSearchW = searchImg.naturalWidth || searchImg.width || 400;
  const origSearchH = searchImg.naturalHeight || searchImg.height || 400;
  const origRefW = referenceImg.naturalWidth || referenceImg.width || 100;
  const origRefH = referenceImg.naturalHeight || referenceImg.height || 100;

  // Scale working search canvas for fast execution (~320px max dimension)
  const maxSearchDim = 320;
  const workScale = Math.min(1.0, maxSearchDim / Math.max(origSearchW, origSearchH));
  const workSearchW = Math.round(origSearchW * workScale);
  const workSearchH = Math.round(origSearchH * workScale);

  // Search image preprocessed with Histogram Equalization & Gaussian Blur (sigma=0.5)
  const searchData = getGrayscaleData(searchImg, workSearchW, workSearchH);

  // STEP 1: COARSE MULTI-SCALE SEARCH across [0.8, 0.9, 1.0, 1.1, 1.2]
  const coarseScales = [0.8, 0.9, 1.0, 1.1, 1.2];
  let bestCoarseScore = -1;
  let bestCoarseScale = 1.0;
  let bestCoarseX = 0;
  let bestCoarseY = 0;

  const coarseMatches: { x: number; y: number; score: number; scale: number }[] = [];
  const stride = 2; // Step size in working space for coarse speed

  for (const scale of coarseScales) {
    const refW = Math.max(8, Math.round(origRefW * workScale * scale));
    const refH = Math.max(8, Math.round(origRefH * workScale * scale));

    if (refW >= workSearchW || refH >= workSearchH) continue;

    const templateData = getGrayscaleData(referenceImg, refW, refH);

    for (let sy = 0; sy <= workSearchH - refH; sy += stride) {
      for (let sx = 0; sx <= workSearchW - refW; sx += stride) {
        const score = computeNCC(searchData, sx, sy, templateData);

        if (score > 0.2) {
          coarseMatches.push({ x: sx, y: sy, score, scale });
          if (score > bestCoarseScore) {
            bestCoarseScore = score;
            bestCoarseScale = scale;
            bestCoarseX = sx;
            bestCoarseY = sy;
          }
        }
      }
    }
  }

  if (coarseMatches.length === 0) {
    const fallbackX = Math.round(origSearchW / 2);
    const fallbackY = Math.round(origSearchH / 2);
    console.warn('[Localization] No valid NCC matches found — returning fallback center.');
    return {
      x: fallbackX,
      y: fallbackY,
      confidence: 0,
      candidates: [{ x: fallbackX, y: fallbackY, score: 0 }],
    };
  }

  // STEP 2: FINE-SCALE REFINEMENT around bestCoarseScale in 0.02 increments
  // e.g. if 1.0 won, search [0.94, 0.96, 0.98, 1.0, 1.02, 1.04, 1.06]
  const fineScales: number[] = [];
  for (let offset = -0.06; offset <= 0.06; offset += 0.02) {
    const s = Math.round((bestCoarseScale + offset) * 100) / 100;
    if (s >= 0.5 && s <= 1.5) {
      fineScales.push(s);
    }
  }

  let bestFineScore = -1;
  let bestFineScale = bestCoarseScale;
  let bestFineX = bestCoarseX;
  let bestFineY = bestCoarseY;

  // Search locally around top coarse candidate region (window +/- 12px, stride 1)
  const searchMargin = 12;
  const minSearchX = Math.max(0, bestCoarseX - searchMargin);
  const maxSearchX = Math.min(workSearchW, bestCoarseX + searchMargin);
  const minSearchY = Math.max(0, bestCoarseY - searchMargin);
  const maxSearchY = Math.min(workSearchH, bestCoarseY + searchMargin);

  for (const scale of fineScales) {
    const refW = Math.max(8, Math.round(origRefW * workScale * scale));
    const refH = Math.max(8, Math.round(origRefH * workScale * scale));

    if (refW >= workSearchW || refH >= workSearchH) continue;

    const templateData = getGrayscaleData(referenceImg, refW, refH);

    for (let sy = minSearchY; sy <= Math.min(workSearchH - refH, maxSearchY); sy++) {
      for (let sx = minSearchX; sx <= Math.min(workSearchW - refW, maxSearchX); sx++) {
        const score = computeNCC(searchData, sx, sy, templateData);
        if (score > bestFineScore) {
          bestFineScore = score;
          bestFineScale = scale;
          bestFineX = sx;
          bestFineY = sy;
        }
      }
    }
  }

  // STEP 3: ROTATION SEARCH (-3°, -1.5°, 0°, +1.5°, +3°) at best-scale candidate position
  const rotationAngles = [-3, -1.5, 0, 1.5, 3];
  let bestRotScore = bestFineScore;
  let bestAngle = 0;
  let bestRotX = bestFineX;
  let bestRotY = bestFineY;

  const finalRefW = Math.max(8, Math.round(origRefW * workScale * bestFineScale));
  const finalRefH = Math.max(8, Math.round(origRefH * workScale * bestFineScale));

  const rotMinX = Math.max(0, bestFineX - 4);
  const rotMaxX = Math.min(workSearchW - finalRefW, bestFineX + 4);
  const rotMinY = Math.max(0, bestFineY - 4);
  const rotMaxY = Math.min(workSearchH - finalRefH, bestFineY + 4);

  for (const angle of rotationAngles) {
    const rotTemplate = getGrayscaleData(referenceImg, finalRefW, finalRefH, angle);

    for (let sy = rotMinY; sy <= rotMaxY; sy++) {
      for (let sx = rotMinX; sx <= rotMaxX; sx++) {
        const score = computeNCC(searchData, sx, sy, rotTemplate);
        if (score > bestRotScore) {
          bestRotScore = score;
          bestAngle = angle;
          bestRotX = sx;
          bestRotY = sy;
        }
      }
    }
  }

  // STEP 4: SUB-PIXEL PARABOLIC REFINEMENT on 3x3 neighborhood around peak (bestRotX, bestRotY)
  const optimalTemplate = getGrayscaleData(referenceImg, finalRefW, finalRefH, bestAngle);

  // Sample 3x3 scores around peak
  const s00 = computeNCC(searchData, bestRotX, bestRotY, optimalTemplate);
  const sm10 = computeNCC(searchData, bestRotX - 1, bestRotY, optimalTemplate);
  const sp10 = computeNCC(searchData, bestRotX + 1, bestRotY, optimalTemplate);
  const s0m1 = computeNCC(searchData, bestRotX, bestRotY - 1, optimalTemplate);
  const s0p1 = computeNCC(searchData, bestRotX, bestRotY + 1, optimalTemplate);

  // Parabolic interpolation along X
  let deltaX = 0;
  const denomX = sm10 - 2 * s00 + sp10;
  if (denomX < -1e-6) {
    deltaX = (sm10 - sp10) / (2 * denomX);
    deltaX = Math.max(-0.5, Math.min(0.5, deltaX));
  }

  // Parabolic interpolation along Y
  let deltaY = 0;
  const denomY = s0m1 - 2 * s00 + s0p1;
  if (denomY < -1e-6) {
    deltaY = (s0m1 - s0p1) / (2 * denomY);
    deltaY = Math.max(-0.5, Math.min(0.5, deltaY));
  }

  // Calculate center in working space and convert to original pixel coordinates
  const workSubCenterX = bestRotX + deltaX + finalRefW / 2;
  const workSubCenterY = bestRotY + deltaY + finalRefH / 2;

  const origSubCenterX = Math.round((workSubCenterX / workScale) * 100) / 100;
  const origSubCenterY = Math.round((workSubCenterY / workScale) * 100) / 100;

  // STEP 5: CONFIDENCE CALIBRATION
  // Remap raw NCC score using: confidence = max(0, (rawScore - 0.3) / 0.5) clamped to [0, 1]
  const rawScore = Math.max(0, bestRotScore);
  const calibratedConfidence0to1 = Math.max(0, Math.min(1.0, (rawScore - 0.3) / 0.5));
  let calibratedConfidencePct = Math.round(calibratedConfidence0to1 * 100 * 10) / 10;

  // PERIODIC PATTERN DISAMBIGUATION & SPATIAL PRIOR WEIGHTING
  let candidates: { x: number; y: number; score: number; rawScore: number }[] = [
    {
      x: origSubCenterX,
      y: origSubCenterY,
      score: calibratedConfidence0to1,
      rawScore,
    },
  ];

  // Collect NMS top distinct candidates for multi-candidate view
  coarseMatches.sort((a, b) => b.score - a.score);
  const minDistSq = Math.pow(Math.max(origRefW, origRefH) * 0.3, 2);

  for (const match of coarseMatches) {
    const candOrigX = Math.round((match.x + finalRefW / 2) / workScale);
    const candOrigY = Math.round((match.y + finalRefH / 2) / workScale);

    let tooClose = false;
    for (const cand of candidates) {
      const dx = candOrigX - cand.x;
      const dy = candOrigY - cand.y;
      if (dx * dx + dy * dy < minDistSq) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      const matchCalibrated = Math.max(0, Math.min(1.0, (match.score - 0.3) / 0.5));
      candidates.push({
        x: candOrigX,
        y: candOrigY,
        score: matchCalibrated,
        rawScore: match.score,
      });
      if (candidates.length >= 5) break;
    }
  }

  if (priorLocation) {
    const maxDiag = Math.sqrt(origSearchW * origSearchW + origSearchH * origSearchH);
    for (const cand of candidates) {
      const dist = Math.sqrt(
        Math.pow(cand.x - priorLocation.x, 2) + Math.pow(cand.y - priorLocation.y, 2)
      );
      const penalty = Math.exp(-dist / (0.4 * maxDiag));
      cand.score = cand.score * (0.6 + 0.4 * penalty);
    }
    candidates.sort((a, b) => b.score - a.score);
    calibratedConfidencePct = Math.round(candidates[0].score * 100 * 10) / 10;
  }

  const topCandidates = candidates.map((c) => ({
    x: Math.round(c.x),
    y: Math.round(c.y),
    score: Math.round(c.score * 1000) / 1000,
  }));

  // STEP 6: CONSOLE LOG SUMMARY
  console.log(`[Localization Pipeline] Template Matching Detection Complete:
  - Coarse Best Scale: ${bestCoarseScale.toFixed(2)}
  - Refined Scale:     ${bestFineScale.toFixed(2)}
  - Rotation Angle:    ${bestAngle}°
  - Sub-pixel Center:  (${origSubCenterX.toFixed(2)}, ${origSubCenterY.toFixed(2)}) px
  - Raw Peak NCC:      ${rawScore.toFixed(4)}
  - Calibrated Conf:   ${calibratedConfidencePct.toFixed(1)}%`);

  return {
    x: origSubCenterX,
    y: origSubCenterY,
    confidence: calibratedConfidencePct,
    candidates: topCandidates,
  };
}

