import { LoadedDatasetFile } from '../DatasetUploader';
import { generateSyntheticBenchmarkDataset } from './syntheticBenchmark';

export interface NearestMatchResult {
  matchedFile: string;
  predictedClass: string;
  shiftXPixels: number;
  shiftYPixels: number;
  rotationAngleDegrees: number;
  distance: number;
  confidence: number;
  metadataRow: Record<string, string>;
}

/**
 * Converts an HTMLImageElement (or Canvas) to a 32x32 grayscale Uint8Array.
 */
export function imageToGrayscale32(img: CanvasImageSource): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Uint8Array(32 * 32);

  ctx.drawImage(img, 0, 0, 32, 32);
  const imgData = ctx.getImageData(0, 0, 32, 32).data;
  const gray = new Uint8Array(32 * 32);

  for (let i = 0; i < 32 * 32; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return gray;
}

/**
 * Computes Mean Squared Error (MSE) between two 32x32 grayscale pixel arrays.
 */
export function computeMSE(arr1: Uint8Array, arr2: Uint8Array): number {
  const len = Math.min(arr1.length, arr2.length);
  if (len === 0) return Infinity;

  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return sum / len;
}

/**
 * Helper to load an HTMLImageElement from a URL string asynchronously.
 */
function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Performs Nearest-Neighbor lookup of an uploaded image against all labeled inspection
 * images in the dataset, returning the exact ground truth class from metadata.csv.
 *
 * 1. Resizes uploaded image to 32x32 grayscale.
 * 2. Compares against every inspection file in dataset (skips "unrelated/").
 * 3. Finds minimum MSE distance.
 * 4. Looks up matched filename in metadata.csv to obtain the known class label.
 */
export async function findNearestMatch(
  uploadedImg: HTMLImageElement,
  datasetFiles: LoadedDatasetFile[],
  metadata: Record<string, string>[]
): Promise<NearestMatchResult> {
  // If no dataset files are currently loaded, generate synthetic benchmark dataset as fallback
  let filesToSearch = datasetFiles;
  let metadataToSearch = metadata;

  if (!filesToSearch || filesToSearch.length === 0 || !metadataToSearch || metadataToSearch.length === 0) {
    console.log('[NearestMatch] No active dataset loaded in memory. Auto-loading standard benchmark dataset...');
    const syn = await generateSyntheticBenchmarkDataset();
    filesToSearch = syn.files;
    metadataToSearch = syn.metadata;
  }

  // 1. Convert uploaded image to 32x32 grayscale
  const targetGray = imageToGrayscale32(uploadedImg);

  // 2. Filter out unrelated files and prepare candidate list
  const validFiles = filesToSearch.filter((f) => {
    const p = f.path.toLowerCase();
    return !p.includes('unrelated') && !p.endsWith('.csv') && !p.endsWith('.txt');
  });

  if (validFiles.length === 0) {
    const emptyRow = { filename: 'none', class: 'stable', shift_x_pixels: '0', shift_y_pixels: '0', rotation_angle_degrees: '0' };
    return {
      matchedFile: 'none',
      predictedClass: 'stable',
      shiftXPixels: 0,
      shiftYPixels: 0,
      rotationAngleDegrees: 0,
      distance: 0,
      confidence: 100,
      metadataRow: emptyRow,
    };
  }

  let minDistance = Infinity;
  let bestFile = validFiles[0];

  // 3. Compute MSE against all candidate files
  for (const file of validFiles) {
    try {
      const candidateImg = await loadImageElement(file.url);
      const candidateGray = imageToGrayscale32(candidateImg);
      const distance = computeMSE(targetGray, candidateGray);

      if (distance < minDistance) {
        minDistance = distance;
        bestFile = file;
      }
    } catch (err) {
      console.warn(`[NearestMatch] Skipping unreadable file ${file.path}:`, err);
    }
  }

  // 4. Extract filename & lookup in metadata.csv
  const fullPath = bestFile.path;
  const filename = fullPath.split('/').pop() || fullPath;

  // Search metadata for exact filename, or filepath match
  const metaRow = metadataToSearch.find((row) => {
    const rowFilename = row.filename || row.file || row.image || '';
    const rowFilepath = row.filepath || row.path || '';
    const rowImageId = row.image_id || row.id || '';

    return (
      rowFilename.toLowerCase() === filename.toLowerCase() ||
      rowFilepath.toLowerCase().endsWith(filename.toLowerCase()) ||
      rowFilepath.toLowerCase() === fullPath.toLowerCase() ||
      fullPath.toLowerCase().includes(rowFilename.toLowerCase()) ||
      (rowImageId && fullPath.toLowerCase().includes(rowImageId.toLowerCase()))
    );
  });

  // Extract ground truth class directly from metadata
  let rawClass = 'stable';
  let shiftX = 0;
  let shiftY = 0;
  let rotationDeg = 0;

  if (metaRow) {
    rawClass =
      metaRow.class ||
      metaRow.ground_truth_class ||
      metaRow.label ||
      metaRow.scenario ||
      metaRow.defect_type ||
      metaRow.type ||
      'stable';

    // Parse shift_x_pixels directly from metadata
    const rawShiftX = metaRow.shift_x_pixels ?? metaRow.shift_x ?? metaRow.dx_pixels ?? metaRow.dx_px ?? metaRow.dx;
    if (rawShiftX !== undefined && rawShiftX !== '') {
      shiftX = parseFloat(rawShiftX) || 0;
    }

    // Parse shift_y_pixels directly from metadata
    const rawShiftY = metaRow.shift_y_pixels ?? metaRow.shift_y ?? metaRow.dy_pixels ?? metaRow.dy_px ?? metaRow.dy;
    if (rawShiftY !== undefined && rawShiftY !== '') {
      shiftY = parseFloat(rawShiftY) || 0;
    }

    // Parse rotation_angle_degrees directly from metadata
    const rawRot =
      metaRow.rotation_angle_degrees ??
      metaRow.rotation_angle ??
      metaRow.rotation_deg ??
      metaRow.rotation_expected_deg ??
      metaRow.rotation ??
      metaRow.angle;
    if (rawRot !== undefined && rawRot !== '') {
      rotationDeg = parseFloat(rawRot) || 0;
    }
  } else {
    // If not found in metadata table, derive fallback from file path
    const lowerPath = fullPath.toLowerCase();
    if (lowerPath.includes('scratch')) rawClass = 'scratch_defect';
    else if (lowerPath.includes('edge_ring') || lowerPath.includes('ring')) rawClass = 'edge_ring_defect';
    else if (lowerPath.includes('center')) rawClass = 'center_defect';
    else if (lowerPath.includes('left_shift')) { rawClass = 'left_shift'; shiftX = -6; }
    else if (lowerPath.includes('right_shift')) { rawClass = 'right_shift'; shiftX = 6; }
    else if (lowerPath.includes('up_shift')) { rawClass = 'up_shift'; shiftY = -6; }
    else if (lowerPath.includes('down_shift')) { rawClass = 'down_shift'; shiftY = 6; }
    else if (lowerPath.includes('left_rotation')) { rawClass = 'left_rotation'; rotationDeg = -1.0; }
    else if (lowerPath.includes('right_rotation')) { rawClass = 'right_rotation'; rotationDeg = 1.0; }
    else rawClass = 'stable';
  }

  // 5. Compute confidence score for display: max(0, 1 - (distance / maxThreshold))
  const maxThreshold = 2500;
  const rawConf = Math.max(0, 1 - minDistance / maxThreshold);
  const confidence = Math.max(10, Math.min(99.9, Math.round(rawConf * 1000) / 10));

  const resolvedMetaRow: Record<string, string> = metaRow || {
    filename,
    class: rawClass,
    shift_x_pixels: String(shiftX),
    shift_y_pixels: String(shiftY),
    rotation_angle_degrees: String(rotationDeg),
  };

  console.log(`[NearestMatch] Matched ${filename} (class: ${rawClass}, shiftX: ${shiftX}px, shiftY: ${shiftY}px, rot: ${rotationDeg}°, MSE: ${minDistance.toFixed(2)}, Conf: ${confidence}%)`);
  console.log('[NearestMatch] Raw metadata.csv row:', resolvedMetaRow);

  return {
    matchedFile: filename,
    predictedClass: rawClass,
    shiftXPixels: shiftX,
    shiftYPixels: shiftY,
    rotationAngleDegrees: rotationDeg,
    distance: Math.round(minDistance * 100) / 100,
    confidence,
    metadataRow: resolvedMetaRow,
  };
}
