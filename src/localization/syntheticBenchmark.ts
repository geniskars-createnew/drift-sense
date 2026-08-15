import { LoadedDatasetFile } from '../DatasetUploader';

/**
 * Generates a full in-memory synthetic 9-class benchmark dataset with inspection images,
 * reference templates, and metadata.csv for automated self-testing.
 */
export async function generateSyntheticBenchmarkDataset(): Promise<{
  files: LoadedDatasetFile[];
  metadata: Record<string, string>[];
}> {
  const files: LoadedDatasetFile[] = [];
  const metadata: Record<string, string>[] = [];

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  function drawGoldenPattern(targetCtx: CanvasRenderingContext2D, dx = 0, dy = 0, rotDeg = 0, defectType = 'none') {
    targetCtx.save();
    targetCtx.fillStyle = '#0a0f1d';
    targetCtx.fillRect(0, 0, 160, 160);

    // Wafer outer boundary
    targetCtx.beginPath();
    targetCtx.arc(80, 80, 72, 0, Math.PI * 2);
    targetCtx.fillStyle = '#10172a';
    targetCtx.fill();
    targetCtx.strokeStyle = '#00e5ff';
    targetCtx.lineWidth = 2;
    targetCtx.stroke();

    // Transformation for drift/rotation
    targetCtx.translate(80 + dx, 80 + dy);
    if (rotDeg !== 0) {
      targetCtx.rotate((rotDeg * Math.PI) / 180);
    }

    // Die grid array
    targetCtx.strokeStyle = '#1e293b';
    targetCtx.lineWidth = 1;
    for (let x = -60; x <= 60; x += 20) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, -60);
      targetCtx.lineTo(x, 60);
      targetCtx.stroke();
    }
    for (let y = -60; y <= 60; y += 20) {
      targetCtx.beginPath();
      targetCtx.moveTo(-60, y);
      targetCtx.lineTo(60, y);
      targetCtx.stroke();
    }

    // Center alignment fiducial crosshair
    targetCtx.strokeStyle = '#00e5ff';
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.moveTo(-15, 0);
    targetCtx.lineTo(15, 0);
    targetCtx.moveTo(0, -15);
    targetCtx.lineTo(0, 15);
    targetCtx.stroke();

    // Fiducial center square
    targetCtx.fillStyle = '#10b981';
    targetCtx.fillRect(-4, -4, 8, 8);

    // Structural Defect rendering
    if (defectType === 'center_defect') {
      targetCtx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 14, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (defectType === 'edge_ring_defect') {
      targetCtx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
      targetCtx.lineWidth = 4;
      targetCtx.beginPath();
      targetCtx.arc(0, 0, 52, 0, Math.PI * 2);
      targetCtx.stroke();
    } else if (defectType === 'scratch_defect' || defectType === 'scratch') {
      targetCtx.strokeStyle = 'rgba(239, 68, 68, 0.95)';
      targetCtx.lineWidth = 2.5;
      targetCtx.beginPath();
      targetCtx.moveTo(-35, -25);
      targetCtx.lineTo(25, 35);
      targetCtx.stroke();
    }

    targetCtx.restore();
  }

  // 1. Create Golden Reference Image
  if (ctx) {
    drawGoldenPattern(ctx, 0, 0, 0, 'none');
  }
  const refBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const refUrl = URL.createObjectURL(refBlob);
  const refFilename = 'ref_golden_wafer.png';

  files.push({
    path: `reference/${refFilename}`,
    blob: refBlob,
    url: refUrl,
  });

  // 2. Define the Canonical Benchmark Classes with multiple test samples per class
  const classConfigs = [
    { cls: 'stable', dx: 0, dy: 0, rot: 0, defect: 'none', count: 6 },
    { cls: 'left_shift', dx: -6, dy: 0, rot: 0, defect: 'none', count: 5 },
    { cls: 'right_shift', dx: 6, dy: 0, rot: 0, defect: 'none', count: 5 },
    { cls: 'up_shift', dx: 0, dy: -6, rot: 0, defect: 'none', count: 5 },
    { cls: 'down_shift', dx: 0, dy: 6, rot: 0, defect: 'none', count: 5 },
    { cls: 'left_rotation', dx: 0, dy: 0, rot: -4.5, defect: 'none', count: 5 },
    { cls: 'right_rotation', dx: 0, dy: 0, rot: 4.5, defect: 'none', count: 5 },
    { cls: 'center_defect', dx: 0, dy: 0, rot: 0, defect: 'center_defect', count: 5 },
    { cls: 'edge_ring_defect', dx: 0, dy: 0, rot: 0, defect: 'edge_ring_defect', count: 5 },
    { cls: 'scratch_defect', dx: 0, dy: 0, rot: 0, defect: 'scratch_defect', count: 5 },
  ];

  let sampleIdx = 1;
  for (const cfg of classConfigs) {
    for (let c = 0; c < cfg.count; c++) {
      const idxStr = String(sampleIdx++).padStart(3, '0');
      const filename = `insp_${cfg.cls}_${idxStr}.png`;
      const relPath = `inspection/${cfg.cls}/${filename}`;

      // Slight natural variation
      const varDx = cfg.dx + (c > 0 ? (c % 2 === 0 ? 0.4 : -0.4) : 0);
      const varDy = cfg.dy + (c > 0 ? (c % 2 === 1 ? 0.4 : -0.4) : 0);
      const varRot = cfg.rot + (c > 0 ? (c % 2 === 0 ? 0.3 : -0.3) : 0);

      if (ctx) {
        drawGoldenPattern(ctx, varDx, varDy, varRot, cfg.defect);
      }
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const url = URL.createObjectURL(blob);

      files.push({
        path: relPath,
        blob,
        url,
      });

      metadata.push({
        image_id: `WAFER-INSP-${idxStr}`,
        filename,
        filepath: relPath,
        reference_id: refFilename,
        class: cfg.cls,
        shift_x_pixels: String(varDx),
        shift_y_pixels: String(varDy),
        rotation_angle_degrees: String(varRot),
        dx_expected_nm: String(varDx * 8.4),
        dy_expected_nm: String(varDy * 8.4),
        rotation_expected_deg: String(varRot),
      });
    }
  }

  // Add 2 unrelated images to verify the filter correctly skips them
  if (ctx) {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Unrelated', 45, 85);
  }
  const unrelBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  files.push({
    path: 'unrelated/photo_cat.jpg',
    blob: unrelBlob,
    url: URL.createObjectURL(unrelBlob),
  });
  metadata.push({
    image_id: 'UNRELATED-001',
    filename: 'photo_cat.jpg',
    filepath: 'unrelated/photo_cat.jpg',
    reference_id: refFilename,
    class: 'unrelated',
  });

  return { files, metadata };
}
