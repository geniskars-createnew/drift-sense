import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Database,
  Upload,
  FolderPlus,
  FileArchive,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Search,
  Filter,
  Layers,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import {
  ReferenceDatasetSummary,
  ReferenceImageRecord,
  getStoredDatasetSummary,
  saveDatasetSummary,
  saveReferenceImagesBatch,
  getReferenceImagesSample,
  clearStoredDataset,
  seedSyntheticReferenceDataset,
  extractFeatureVector,
  generateThumbnailDataUrl,
  validateWaferDomain,
} from '../../utils/datasetStorage';

interface Props {
  onDatasetChanged?: (summary: ReferenceDatasetSummary | null) => void;
}

export const ReferenceDatasetManager: React.FC<Props> = ({ onDatasetChanged }) => {
  const [summary, setSummary] = useState<ReferenceDatasetSummary | null>(null);
  const [sampleImages, setSampleImages] = useState<ReferenceImageRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  const zipInputRef = useRef<HTMLInputElement>(null);
  const multiImagesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Load dataset from IndexedDB on component mount
  const refreshDataset = async () => {
    const sum = await getStoredDatasetSummary();
    setSummary(sum);
    if (sum && sum.status === 'READY') {
      const samples = await getReferenceImagesSample(36);
      setSampleImages(samples);
    } else {
      setSampleImages([]);
    }
    if (onDatasetChanged) {
      onDatasetChanged(sum);
    }
  };

  useEffect(() => {
    refreshDataset();
  }, []);

  // Process uploaded ZIP File
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessingProgress(5);
    setStatusMessage(`Opening ZIP archive: ${file.name}...`);

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((f) => !f.dir);
      const totalEntries = entries.length;

      let validCount = 0;
      let invalidCount = 0;
      let refCount = 0;
      let defectCount = 0;

      const records: ReferenceImageRecord[] = [];
      let processed = 0;

      for (const entry of entries) {
        processed++;
        const pct = Math.round((processed / totalEntries) * 85);
        setProcessingProgress(pct);
        setStatusMessage(`Processing entry ${processed}/${totalEntries}: ${entry.name.split('/').pop()}`);

        const lower = entry.name.toLowerCase();
        const isSupportedImage =
          lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');

        if (!isSupportedImage) {
          invalidCount++;
          continue;
        }

        validCount++;

        // Extract folder structure
        const parts = entry.name.split('/');
        const fileName = parts.pop() || entry.name;
        const sourceFolder = parts.length > 0 ? parts[parts.length - 1] : 'root';

        // Folder/path label classification logic
        const lowerPath = entry.name.toLowerCase();
        let cls = 'UNKNOWN / UNLABELED';
        let isRef = true;
        let isDef = false;

        if (lowerPath.includes('stable') || lowerPath.includes('reference') || lowerPath.includes('golden')) {
          cls = 'STABLE';
          isRef = true;
          isDef = false;
        } else if (lowerPath.includes('defect') || lowerPath.includes('scratch') || lowerPath.includes('bridge') || lowerPath.includes('void')) {
          cls = 'DEFECT';
          isRef = false;
          isDef = true;
        } else if (lowerPath.includes('left_shift')) {
          cls = 'LEFT_SHIFT';
          isRef = false;
          isDef = false;
        } else if (lowerPath.includes('right_shift')) {
          cls = 'RIGHT_SHIFT';
          isRef = false;
          isDef = false;
        } else if (lowerPath.includes('left_rotation')) {
          cls = 'LEFT_ROTATION';
          isRef = false;
          isDef = false;
        } else if (lowerPath.includes('right_rotation')) {
          cls = 'RIGHT_ROTATION';
          isRef = false;
          isDef = false;
        } else if (sourceFolder && sourceFolder !== 'root') {
          cls = sourceFolder.toUpperCase();
        }

        if (isRef) refCount++;
        if (isDef) defectCount++;

        // Convert blob to Image object for dimensions & thumbnail
        const blob = await entry.async('blob');
        const blobUrl = URL.createObjectURL(blob);

        const imgObj = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = blobUrl;
        });

        const width = imgObj.width || 1024;
        const height = imgObj.height || 1024;
        const thumbUrl = generateThumbnailDataUrl(imgObj, 80);
        const featVec = extractFeatureVector(imgObj);

        records.push({
          image_id: `REF-IMG-${String(validCount).padStart(4, '0')}`,
          filename: fileName,
          source_dataset: file.name,
          source_folder: sourceFolder,
          image_width: width,
          image_height: height,
          image_format: fileName.split('.').pop()?.toUpperCase() || 'PNG',
          class: cls,
          is_reference: isRef,
          is_defect: isDef,
          is_original: true,
          thumbnailUrl: thumbUrl,
          featureVector: featVec,
          sizeBytes: blob.size,
        });
      }

      setProcessingProgress(90);
      setStatusMessage('Saving records to persistent IndexedDB storage...');

      const newSummary: ReferenceDatasetSummary = {
        datasetName: file.name,
        totalImages: totalEntries,
        validImages: validCount,
        invalidImages: invalidCount,
        referenceImages: refCount || validCount,
        defectImages: defectCount,
        totalSizeBytes: file.size,
        status: 'READY',
        updatedAt: new Date().toISOString(),
      };

      await saveDatasetSummary(newSummary);
      await saveReferenceImagesBatch(records);

      setProcessingProgress(100);
      setStatusMessage('Dataset ready!');
      await refreshDataset();
    } catch (err) {
      console.error('Error processing dataset ZIP:', err);
      setStatusMessage('Failed to extract ZIP. Please verify file integrity.');
    } finally {
      setIsProcessing(false);
      if (zipInputRef.current) zipInputRef.current.value = '';
    }
  };

  // Process Multiple File or Folder Selection
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(5);
    const datasetName = fileList[0].webkitRelativePath
      ? fileList[0].webkitRelativePath.split('/')[0] + ' (Folder)'
      : `${fileList.length} Selected Image Files`;

    setStatusMessage(`Processing ${fileList.length} image files...`);

    try {
      const records: ReferenceImageRecord[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let refCount = 0;
      let defectCount = 0;
      let totalSize = 0;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        totalSize += file.size;

        const lower = file.name.toLowerCase();
        const isSupportedImage =
          lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');

        if (!isSupportedImage) {
          invalidCount++;
          continue;
        }

        validCount++;
        const pct = Math.round(((i + 1) / fileList.length) * 85);
        setProcessingProgress(pct);

        const pathParts = (file.webkitRelativePath || file.name).split('/');
        const sourceFolder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'root';
        const lowerPath = (file.webkitRelativePath || file.name).toLowerCase();

        let cls = 'UNKNOWN / UNLABELED';
        let isRef = true;
        let isDef = false;

        if (lowerPath.includes('stable') || lowerPath.includes('reference') || lowerPath.includes('golden')) {
          cls = 'STABLE';
          isRef = true;
        } else if (lowerPath.includes('defect') || lowerPath.includes('scratch') || lowerPath.includes('bridge')) {
          cls = 'DEFECT';
          isRef = false;
          isDef = true;
        } else if (lowerPath.includes('left_shift')) {
          cls = 'LEFT_SHIFT';
          isRef = false;
        } else if (lowerPath.includes('right_shift')) {
          cls = 'RIGHT_SHIFT';
          isRef = false;
        } else if (sourceFolder && sourceFolder !== 'root') {
          cls = sourceFolder.toUpperCase();
        }

        if (isRef) refCount++;
        if (isDef) defectCount++;

        const blobUrl = URL.createObjectURL(file);
        const imgObj = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = blobUrl;
        });

        const width = imgObj.width || 1024;
        const height = imgObj.height || 1024;
        const thumbUrl = generateThumbnailDataUrl(imgObj, 80);
        const featVec = extractFeatureVector(imgObj);

        records.push({
          image_id: `REF-IMG-${String(validCount).padStart(4, '0')}`,
          filename: file.name,
          source_dataset: datasetName,
          source_folder: sourceFolder,
          image_width: width,
          image_height: height,
          image_format: file.name.split('.').pop()?.toUpperCase() || 'PNG',
          class: cls,
          is_reference: isRef,
          is_defect: isDef,
          is_original: true,
          thumbnailUrl: thumbUrl,
          featureVector: featVec,
          sizeBytes: file.size,
        });
      }

      setProcessingProgress(90);
      setStatusMessage('Saving images to persistent IndexedDB storage...');

      const newSummary: ReferenceDatasetSummary = {
        datasetName,
        totalImages: fileList.length,
        validImages: validCount,
        invalidImages: invalidCount,
        referenceImages: refCount || validCount,
        defectImages: defectCount,
        totalSizeBytes: totalSize,
        status: 'READY',
        updatedAt: new Date().toISOString(),
      };

      await saveDatasetSummary(newSummary);
      await saveReferenceImagesBatch(records);

      setProcessingProgress(100);
      setStatusMessage('Dataset ready!');
      await refreshDataset();
    } catch (err) {
      console.error('Error processing image files:', err);
      setStatusMessage('Failed to process image files.');
    } finally {
      setIsProcessing(false);
      if (multiImagesInputRef.current) multiImagesInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  // Seed 1,638 simulated benchmark dataset
  const handleSeedBenchmark = async () => {
    setIsProcessing(true);
    setProcessingProgress(10);
    setStatusMessage('Generating 1,638 reference wafer image records...');

    try {
      const sum = await seedSyntheticReferenceDataset();
      setProcessingProgress(100);
      setStatusMessage('1,638 Reference dataset ready!');
      await refreshDataset();
    } catch (e) {
      console.error('Error seeding synthetic benchmark:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear dataset from IndexedDB
  const handleClearDataset = async () => {
    if (window.confirm('Are you sure you want to clear the persistent reference dataset?')) {
      await clearStoredDataset();
      await refreshDataset();
    }
  };

  // Filter sample images in grid
  const filteredSamples = sampleImages.filter((img) => {
    if (selectedClassFilter !== 'all' && img.class !== selectedClassFilter) return false;
    if (
      searchTerm &&
      !img.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !img.image_id.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const formatMB = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <GlassCard glow glowColor="cyan" className="space-y-6 p-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">REFERENCE DATASET</h2>
            {summary && summary.status === 'READY' && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                READY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload your complete wafer reference dataset (800–2,000 images) for automated reference matching across all future single-image inspections.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {summary && summary.status === 'READY' ? (
            <>
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3 py-2 rounded-xl border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Replace Dataset
              </button>

              <button
                type="button"
                onClick={handleClearDataset}
                disabled={isProcessing}
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-mono px-3 py-2 rounded-xl border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                Clear Dataset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSeedBenchmark}
              disabled={isProcessing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-cyan-500/20 transition-all font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Benchmark (1,638 Images)
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        onChange={handleZipUpload}
        className="hidden"
      />
      <input
        ref={multiImagesInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        onChange={handleFilesUpload}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        // @ts-ignore
        directory="true"
        onChange={handleFilesUpload}
        className="hidden"
      />

      {/* UPLOAD METHOD CARDS */}
      {!summary || summary.status !== 'READY' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            disabled={isProcessing}
            className="p-5 rounded-xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-900 text-left transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <FileArchive className="w-7 h-7 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">RECOMMENDED</span>
            </div>
            <div className="font-bold text-sm text-slate-200">Upload Dataset ZIP</div>
            <p className="text-xs text-slate-400">
              Upload a single compressed .zip file containing all 800–2,000 wafer/die image folders.
            </p>
          </button>

          <button
            type="button"
            onClick={() => multiImagesInputRef.current?.click()}
            disabled={isProcessing}
            className="p-5 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/60 hover:bg-slate-900 text-left transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <ImageIcon className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-bold text-sm text-slate-200">Select Multiple Images</div>
            <p className="text-xs text-slate-400">
              Select hundreds of PNG, JPG, or WEBP wafer images directly from your file manager.
            </p>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isProcessing}
            className="p-5 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900 text-left transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <FolderPlus className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-bold text-sm text-slate-200">Select Entire Folder</div>
            <p className="text-xs text-slate-400">
              Select an entire folder containing subfolders of stable &amp; defect wafer runs.
            </p>
          </button>
        </div>
      ) : null}

      {/* PROCESSING PROGRESS BAR */}
      {isProcessing && (
        <div className="p-4 bg-slate-900/90 border border-cyan-500/40 rounded-xl space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              {statusMessage}
            </span>
            <span className="text-white font-bold">{processingProgress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 h-full transition-all duration-150"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* DATASET STATUS METRICS DISPLAY */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 col-span-2">
            <div className="text-[10px] text-slate-400">DATASET NAME</div>
            <div className="text-slate-200 font-bold truncate mt-1 text-xs" title={summary?.datasetName || 'None'}>
              {summary ? summary.datasetName : 'No Dataset Loaded'}
            </div>
            <div className="text-[10px] text-cyan-400 mt-0.5">
              {summary ? `Size: ${formatMB(summary.totalSizeBytes)}` : '0 MB'}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">TOTAL IMAGES</div>
            <div className="text-base font-bold text-white mt-1">
              {summary ? summary.totalImages.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Scanned</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
            <div className="text-[10px] text-slate-400">VALID IMAGES</div>
            <div className="text-base font-bold text-emerald-400 mt-1">
              {summary ? summary.validImages.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Parsed</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30">
            <div className="text-[10px] text-slate-400">INVALID / SKIPPED</div>
            <div className="text-base font-bold text-amber-400 mt-1">
              {summary ? summary.invalidImages : '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Non-image</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30">
            <div className="text-[10px] text-slate-400">REFERENCE IMAGES</div>
            <div className="text-base font-bold text-cyan-400 mt-1">
              {summary ? summary.referenceImages.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Golden baseline</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-red-500/30">
            <div className="text-[10px] text-slate-400">DEFECT IMAGES</div>
            <div className="text-base font-bold text-red-400 mt-1">
              {summary ? summary.defectImages.toLocaleString() : '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Flagged</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">STATUS</div>
            <div
              className={`text-xs font-bold mt-1 ${
                summary?.status === 'READY' ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {summary ? summary.status : 'NOT LOADED'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">IndexedDB</div>
          </div>
        </div>

        {/* READY BANNER */}
        {summary && summary.status === 'READY' && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-xs text-slate-200">
              <span className="font-bold text-emerald-300">Reference Dataset Ready: </span>
              <strong>{summary.validImages.toLocaleString()} images</strong> available for automatic reference matching on single-image inspection uploads.
            </div>
          </div>
        )}
      </div>

      {/* REFERENCE DATASET SAMPLE PREVIEW GRID */}
      {summary && sampleImages.length > 0 && (
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-white">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>REFERENCE DATASET SAMPLE PREVIEW</span>
              <span className="text-[10px] text-slate-400 font-normal">({sampleImages.length} Samples Shown)</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 w-36"
                />
              </div>

              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Classes</option>
                <option value="STABLE">STABLE</option>
                <option value="DEFECT">DEFECT</option>
                <option value="LEFT_SHIFT">LEFT_SHIFT</option>
                <option value="RIGHT_SHIFT">RIGHT_SHIFT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
            {filteredSamples.map((img) => (
              <div
                key={img.image_id}
                className="group relative bg-slate-950 rounded-lg border border-slate-800 p-1.5 hover:border-cyan-400/80 transition-all flex flex-col items-center"
              >
                <div className="w-full aspect-square bg-slate-900 rounded overflow-hidden flex items-center justify-center relative">
                  {img.thumbnailUrl ? (
                    <img src={img.thumbnailUrl} alt={img.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[9px] text-slate-600">NO IMAGE</div>
                  )}

                  {/* Badge */}
                  <span
                    className={`absolute top-1 right-1 text-[8px] font-mono px-1 rounded font-bold ${
                      img.class === 'STABLE'
                        ? 'bg-emerald-500/80 text-slate-950'
                        : img.class === 'DEFECT'
                        ? 'bg-red-500/80 text-white'
                        : 'bg-amber-500/80 text-slate-950'
                    }`}
                  >
                    {img.class}
                  </span>
                </div>

                <div className="w-full mt-1.5 text-[9px] font-mono text-slate-400 truncate text-center" title={img.filename}>
                  {img.filename}
                </div>
                <div className="text-[8px] font-mono text-cyan-400">{img.image_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
