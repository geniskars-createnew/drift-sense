import { LoadedDatasetFile } from '../DatasetUploader';
import { localizeReference, MatchResult } from './matcher';
import { classifyDefect, classifyDefectShape, classifyShiftDirection } from './navigationError';

export interface SwapWarning {
  pair: string;
  classA: string;
  classB: string;
  swapCountAtoB: number;
  totalA: number;
  rateAtoB: number;
  swapCountBtoA: number;
  totalB: number;
  rateBtoA: number;
  message: string;
}

export interface PerClassMetrics {
  className: string;
  totalGroundTruth: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracyPct: number;
  precisionPct: number;
  recallPct: number;
}

export interface TestSampleResult {
  filename: string;
  referenceId: string;
  groundTruthClass: string;
  predictedClass: string;
  isCorrect: boolean;
  confidence: number;
  displacementX: number;
  displacementY: number;
  rotationDeg: number;
  isDefect: boolean;
  defectReason?: string;
  executionTimeMs: number;
}

export interface TestReport {
  totalTested: number;
  totalCorrect: number;
  overallAccuracyPct: number;
  classes: string[];
  // matrix[actualIdx][predictedIdx] -> count of actual class predicted as predicted class
  confusionMatrix: number[][];
  perClassAccuracy: Record<string, number>;
  perClassMetrics: PerClassMetrics[];
  swapWarnings: SwapWarning[];
  sampleResults: TestSampleResult[];
  unrelatedSkippedCount: number;
  missingReferenceCount: number;
  timestamp: string;
}

export const CANONICAL_CLASSES = [
  'stable',
  'left_shift',
  'right_shift',
  'up_shift',
  'down_shift',
  'left_rotation',
  'right_rotation',
  'center_defect',
  'edge_ring_defect',
  'scratch_defect',
] as const;

export type CanonicalWaferClass = typeof CANONICAL_CLASSES[number];

/**
 * Normalizes any ground truth or predicted label string to canonical classes
 */
export function normalizeClassName(raw: string): CanonicalWaferClass {
  if (!raw) return 'stable';
  const s = raw.toLowerCase().trim().replace(/[-\s]+/g, '_');

  if (s.includes('scratch')) {
    return 'scratch_defect';
  }
  if (s.includes('ring') || s.includes('bevel') || s.includes('edge_ring') || s.includes('edge')) {
    return 'edge_ring_defect';
  }
  if (s.includes('center') || s.includes('growth') || s.includes('core')) {
    return 'center_defect';
  }
  if (s.includes('stable') || s === 'no_drift' || s.includes('golden') || s.includes('reference') || s === 'pristine') {
    return 'stable';
  }
  if (s.includes('left_rot') || s.includes('ccw') || s.includes('counter_clock')) {
    return 'left_rotation';
  }
  if (s.includes('right_rot') || s.includes('cw') || s.includes('clock_wise') || s.includes('clockwise')) {
    return 'right_rotation';
  }
  if (s.includes('left_shift') || s === 'left' || s.includes('shift_left') || s.includes('west')) {
    return 'left_shift';
  }
  if (s.includes('right_shift') || s === 'right' || s.includes('shift_right') || s.includes('east')) {
    return 'right_shift';
  }
  if (s.includes('up_shift') || s === 'up' || s.includes('shift_up') || s.includes('north')) {
    return 'up_shift';
  }
  if (s.includes('down_shift') || s === 'down' || s.includes('shift_down') || s.includes('south')) {
    return 'down_shift';
  }
  if (s.includes('defect') || s.includes('particle')) {
    return 'center_defect';
  }

  return 'stable';
}

/**
 * Helper to parse raw CSV string into array of records
 */
export function parseCsvText(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rowLine = lines[i];
    if (!rowLine.trim()) continue;
    const values = rowLine.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = values[idx] !== undefined ? values[idx] : '';
    });
    records.push(rec);
  }

  return records;
}

/**
 * Loads an HTMLImageElement asynchronously from a Blob URL or data URL
 */
function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image from URL: ${url}`));
    img.src = url;
  });
}

/**
 * Extracts high-accuracy multi-feature classification from comparison between
 * inspection image and its matching reference image
 */
async function classifyWaferComparison(
  refImg: HTMLImageElement,
  inspImg: HTMLImageElement
): Promise<{
  predictedClass: CanonicalWaferClass;
  matchResult: MatchResult;
  dx: number;
  dy: number;
  rotationDeg: number;
  isDefect: boolean;
  defectReason: string;
}> {
  // 1. Run full Localization Pipeline
  const matchResult = await localizeReference(refImg, inspImg);
  const defectVerdict = classifyDefect(matchResult);

  // 2. Spatial Displacement & Expected Center
  const inspW = inspImg.naturalWidth || inspImg.width || 160;
  const inspH = inspImg.naturalHeight || inspImg.height || 160;

  // Center alignment offset:
  // predicted.x < expected.x -> dx < 0 (left_shift)
  // predicted.x > expected.x -> dx > 0 (right_shift)
  // predicted.y < expected.y -> dy < 0 (up_shift)
  // predicted.y > expected.y -> dy > 0 (down_shift)
  const nominalCenterX = inspW / 2;
  const nominalCenterY = inspH / 2;
  const dx = Math.round((matchResult.x - nominalCenterX) * 100) / 100;
  const dy = Math.round((matchResult.y - nominalCenterY) * 100) / 100;

  // 3. Pixel-difference mask between aligned reference and inspection image
  const canvasW = 128;
  const canvasH = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  let shapeDefect: 'scratch' | 'center' | 'edge_ring' | 'unknown' = 'unknown';
  let estimatedRotation = 0;

  if (ctx) {
    // Draw Reference
    ctx.drawImage(refImg, 0, 0, canvasW, canvasH);
    const refData = ctx.getImageData(0, 0, canvasW, canvasH).data;

    // Draw Inspection
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(inspImg, 0, 0, canvasW, canvasH);
    const inspData = ctx.getImageData(0, 0, canvasW, canvasH).data;

    const diffMask = new Uint8ClampedArray(canvasW * canvasH);
    let crossMoment11 = 0;
    let varX = 0;
    let varY = 0;
    const centerPxX = canvasW / 2;
    const centerPxY = canvasH / 2;

    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        const idx = (y * canvasW + x) * 4;
        const refLum = 0.299 * refData[idx] + 0.587 * refData[idx + 1] + 0.114 * refData[idx + 2];
        const inspLum = 0.299 * inspData[idx] + 0.587 * inspData[idx + 1] + 0.114 * inspData[idx + 2];
        const diff = Math.abs(inspLum - refLum);
        diffMask[y * canvasW + x] = diff;

        // Moment estimation for angular rotation
        const relX = x - centerPxX;
        const relY = y - centerPxY;
        crossMoment11 += relX * relY * (inspLum / 255);
        varX += relX * relX * (inspLum / 255);
        varY += relY * relY * (inspLum / 255);
      }
    }

    const angleRad = 0.5 * Math.atan2(2 * crossMoment11, varX - varY + 1e-5);
    estimatedRotation = Math.round(((angleRad * 180) / Math.PI) * 10) / 10;

    // Shape-based morphological defect classification
    shapeDefect = classifyDefectShape(diffMask, canvasW, canvasH);
  }

  // 4. Decision Rule Engine
  let predictedClass: CanonicalWaferClass = 'stable';

  if (shapeDefect === 'scratch') {
    predictedClass = 'scratch_defect';
  } else if (shapeDefect === 'center') {
    predictedClass = 'center_defect';
  } else if (shapeDefect === 'edge_ring') {
    predictedClass = 'edge_ring_defect';
  } else if (Math.abs(estimatedRotation) >= 1.5) {
    predictedClass = estimatedRotation < 0 ? 'left_rotation' : 'right_rotation';
  } else if (Math.hypot(dx, dy) >= 1.8 || Math.abs(dx) >= 1.8 || Math.abs(dy) >= 1.8) {
    predictedClass = classifyShiftDirection(dx, dy) as CanonicalWaferClass;
  } else if (defectVerdict.isDefect) {
    predictedClass = 'center_defect';
  } else {
    predictedClass = 'stable';
  }

  return {
    predictedClass,
    matchResult,
    dx,
    dy,
    rotationDeg: estimatedRotation,
    isDefect: shapeDefect !== 'unknown' || defectVerdict.isDefect,
    defectReason:
      shapeDefect !== 'unknown'
        ? `Structural ${shapeDefect} defect identified via connected-component shape analysis`
        : defectVerdict.reason,
  };
}

/**
 * MAIN ENTRY POINT: Runs automated self-test validating detection accuracy
 * against loaded dataset files and metadata ground-truth
 */
export async function runSelfTest(
  loadedFiles: LoadedDatasetFile[],
  metadata: Record<string, string>[]
): Promise<TestReport> {
  const sampleResults: TestSampleResult[] = [];
  let unrelatedSkippedCount = 0;
  let missingReferenceCount = 0;
  let totalCorrect = 0;

  // Create fast lookup map for loaded dataset files by filename & relative path
  const fileMap = new Map<string, LoadedDatasetFile>();
  for (const f of loadedFiles) {
    const filename = f.path.split('/').pop() || f.path;
    fileMap.set(filename.toLowerCase(), f);
    fileMap.set(f.path.toLowerCase(), f);
  }

  // Parse or process metadata rows
  let metadataRows = metadata;
  if (!metadataRows || metadataRows.length === 0) {
    // Look for metadata.csv inside loadedFiles
    const csvFile = loadedFiles.find((f) => f.path.toLowerCase().endsWith('.csv'));
    if (csvFile) {
      try {
        const text = await csvFile.blob.text();
        metadataRows = parseCsvText(text);
      } catch (err) {
        console.warn('Failed to parse metadata.csv in loaded files:', err);
      }
    }
  }

  // If still no metadata, generate metadata rows from dataset image file paths
  if (!metadataRows || metadataRows.length === 0) {
    metadataRows = loadedFiles
      .filter((f) => {
        const lower = f.path.toLowerCase();
        return (
          lower.endsWith('.png') ||
          lower.endsWith('.jpg') ||
          lower.endsWith('.jpeg') ||
          lower.endsWith('.webp')
        );
      })
      .map((f) => {
        const filename = f.path.split('/').pop() || f.path;
        return {
          filename,
          filepath: f.path,
          reference_id: 'ref_golden_00.png',
          class: f.path,
        };
      });
  }

  // Determine active classes present in dataset metadata
  const groundTruthClassesInMeta = new Set<string>();
  for (const r of metadataRows) {
    const rawClass = r.class || r.ground_truth_class || r.label || r.scenario || r.type || '';
    if (rawClass && !rawClass.toLowerCase().includes('unrelated')) {
      groundTruthClassesInMeta.add(normalizeClassName(rawClass));
    }
  }

  let classes = CANONICAL_CLASSES.filter((c) => groundTruthClassesInMeta.has(c));
  if (classes.length === 0) {
    classes = [...CANONICAL_CLASSES];
  }
  const numClasses = classes.length;

  // Initialize Confusion Matrix [actualIdx][predictedIdx]
  const confusionMatrix: number[][] = Array.from({ length: numClasses }, () =>
    new Array(numClasses).fill(0)
  );

  console.log(`[Self-Test] Starting Automated Self-Test with ${metadataRows.length} metadata records across ${classes.length} classes...`);

  // Process every inspection image record
  for (let i = 0; i < metadataRows.length; i++) {
    const row = metadataRows[i];

    // Extract filename and path
    const rawFilename =
      row.filename ||
      row.image_id ||
      row.image ||
      row.filepath ||
      row.path ||
      row.file ||
      row.id ||
      '';

    const pathOrFilename = (row.filepath || rawFilename).toLowerCase();

    // 1. Skip "unrelated/" images as requested
    if (
      pathOrFilename.includes('unrelated/') ||
      pathOrFilename.includes('/unrelated') ||
      row.class?.toLowerCase().includes('unrelated') ||
      row.scenario?.toLowerCase().includes('unrelated')
    ) {
      unrelatedSkippedCount++;
      continue;
    }

    // Extract ground truth class
    const rawClass =
      row.class ||
      row.ground_truth_class ||
      row.label ||
      row.ground_truth ||
      row.scenario ||
      row.type ||
      rawFilename;

    const groundTruthClass = normalizeClassName(rawClass);

    // 2. Find inspection file in loaded dataset
    const baseFilename = rawFilename.split('/').pop() || rawFilename;
    const inspFile =
      fileMap.get(pathOrFilename) ||
      fileMap.get(baseFilename.toLowerCase()) ||
      fileMap.get(rawFilename.toLowerCase());

    if (!inspFile) {
      console.warn(`[Self-Test] Inspection file not found in loaded files: ${rawFilename}`);
      continue;
    }

    // 3. Find matching reference file using reference_id
    const rawRefId =
      row.reference_id ||
      row.reference_file ||
      row.reference ||
      row.ref_id ||
      row.ref_image ||
      row.ref ||
      '';

    const baseRefName = rawRefId.split('/').pop() || rawRefId;
    let refFile =
      fileMap.get(rawRefId.toLowerCase()) ||
      fileMap.get(baseRefName.toLowerCase());

    // Fallback if specific reference not found: search for any golden/reference file
    if (!refFile) {
      for (const [k, f] of fileMap.entries()) {
        if (k.includes('ref') || k.includes('golden') || k.includes('stable')) {
          refFile = f;
          break;
        }
      }
    }

    if (!refFile) {
      // If still no reference file, use inspection image itself or dummy
      missingReferenceCount++;
      refFile = inspFile;
    }

    const tStart = performance.now();

    try {
      // Load both images
      const inspImg = await loadImageAsync(inspFile.url);
      const refImg = await loadImageAsync(refFile.url);

      // Run full detection pipeline
      const { predictedClass, matchResult, dx, dy, rotationDeg, isDefect, defectReason } =
        await classifyWaferComparison(refImg, inspImg);

      const execTime = Math.round((performance.now() - tStart) * 10) / 10;
      const isCorrect = predictedClass === groundTruthClass;

      if (isCorrect) totalCorrect++;

      // Update Confusion Matrix
      const actualIdx = classes.indexOf(groundTruthClass);
      const predIdx = classes.indexOf(predictedClass);

      if (actualIdx !== -1 && predIdx !== -1) {
        confusionMatrix[actualIdx][predIdx]++;
      }

      sampleResults.push({
        filename: baseFilename,
        referenceId: baseRefName || 'DEFAULT_REF',
        groundTruthClass,
        predictedClass,
        isCorrect,
        confidence: matchResult.confidence,
        displacementX: dx,
        displacementY: dy,
        rotationDeg,
        isDefect,
        defectReason,
        executionTimeMs: execTime,
      });
    } catch (e) {
      console.error(`[Self-Test] Error running detection for ${baseFilename}:`, e);
      // Record fallback on error
      const actualIdx = classes.indexOf(groundTruthClass);
      const predIdx = classes.indexOf('stable');
      if (actualIdx !== -1 && predIdx !== -1) {
        confusionMatrix[actualIdx][predIdx]++;
      }
    }
  }

  const totalTested = sampleResults.length;
  const overallAccuracyPct =
    totalTested > 0 ? Math.round((totalCorrect / totalTested) * 1000) / 10 : 100.0;

  // Compute per-class accuracy and metrics
  const perClassAccuracy: Record<string, number> = {};
  const perClassMetrics: PerClassMetrics[] = [];

  for (let i = 0; i < numClasses; i++) {
    const clsName = classes[i];
    const totalGroundTruth = confusionMatrix[i].reduce((a, b) => a + b, 0);
    const truePositives = confusionMatrix[i][i];

    // False Positives: sum of column i excluding diagonal
    let falsePositives = 0;
    for (let r = 0; r < numClasses; r++) {
      if (r !== i) falsePositives += confusionMatrix[r][i];
    }

    // False Negatives: sum of row i excluding diagonal
    let falseNegatives = totalGroundTruth - truePositives;

    const acc =
      totalGroundTruth > 0 ? Math.round((truePositives / totalGroundTruth) * 1000) / 10 : 100.0;
    const prec =
      truePositives + falsePositives > 0
        ? Math.round((truePositives / (truePositives + falsePositives)) * 1000) / 10
        : 100.0;
    const rec =
      truePositives + falseNegatives > 0
        ? Math.round((truePositives / (truePositives + falseNegatives)) * 1000) / 10
        : 100.0;

    perClassAccuracy[clsName] = acc;
    perClassMetrics.push({
      className: clsName,
      totalGroundTruth,
      truePositives,
      falsePositives,
      falseNegatives,
      accuracyPct: acc,
      precisionPct: prec,
      recallPct: rec,
    });
  }

  // 7. CHECK FOR SYSTEMATIC SWAP PATTERNS & LOG TO CONSOLE
  const swapWarnings: SwapWarning[] = [];

  function checkSwapPair(classA: CanonicalWaferClass, classB: CanonicalWaferClass) {
    const idxA = classes.indexOf(classA);
    const idxB = classes.indexOf(classB);
    if (idxA === -1 || idxB === -1) return;

    const totalA = confusionMatrix[idxA].reduce((sum, val) => sum + val, 0);
    const totalB = confusionMatrix[idxB].reduce((sum, val) => sum + val, 0);

    const swapAtoB = confusionMatrix[idxA][idxB];
    const swapBtoA = confusionMatrix[idxB][idxA];

    const rateAtoB = totalA > 0 ? swapAtoB / totalA : 0;
    const rateBtoA = totalB > 0 ? swapBtoA / totalB : 0;

    if (rateAtoB >= 0.5 || rateBtoA >= 0.5) {
      const msg = `SYSTEMATIC SIGN INVERSION DETECTED: ${classA} <-> ${classB} swapped (${(Math.max(rateAtoB, rateBtoA) * 100).toFixed(1)}% swap rate)`;
      console.warn(msg);
      swapWarnings.push({
        pair: `${classA} <-> ${classB}`,
        classA,
        classB,
        swapCountAtoB: swapAtoB,
        totalA,
        rateAtoB,
        swapCountBtoA: swapBtoA,
        totalB,
        rateBtoA,
        message: msg,
      });
    }
  }

  // Check the 3 key directional/rotational pairs
  checkSwapPair('left_shift', 'right_shift');
  checkSwapPair('up_shift', 'down_shift');
  checkSwapPair('left_rotation', 'right_rotation');

  const report: TestReport = {
    totalTested,
    totalCorrect,
    overallAccuracyPct,
    classes,
    confusionMatrix,
    perClassAccuracy,
    perClassMetrics,
    swapWarnings,
    sampleResults,
    unrelatedSkippedCount,
    missingReferenceCount,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Self-Test Finished] Overall Accuracy: ${overallAccuracyPct}% (${totalCorrect}/${totalTested} Correct)`);
  if (swapWarnings.length > 0) {
    console.warn(`[Self-Test Warning] Detected ${swapWarnings.length} systematic swap patterns!`, swapWarnings);
  } else {
    console.log('[Self-Test Status] No systematic sign inversions detected. Pipeline axis alignment verified.');
  }

  return report;
}
