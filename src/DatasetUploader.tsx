import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Upload, FileSpreadsheet, CheckCircle2, PlayCircle, FolderUp, Database, Sparkles } from 'lucide-react';
import { parseCsvText } from './localization/selfTest';

export interface LoadedDatasetFile {
  path: string;
  blob: Blob;
  url: string;
}

export interface LoadedDataset {
  files: LoadedDatasetFile[];
  metadata: Record<string, string>[] | null;
}

interface DatasetUploaderProps {
  onLoaded?: (dataset: LoadedDataset) => void;
  onTriggerSelfTest?: (dataset: LoadedDataset) => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onLoaded, onTriggerSelfTest }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [metadataRowCount, setMetadataRowCount] = useState(0);
  const [status, setStatus] = useState<string>('Ready to import custom wafer dataset');
  const [currentDataset, setCurrentDataset] = useState<LoadedDataset | null>(null);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus(`Extracting archive ${file.name}...`);

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((f) => !f.dir);

      const files: LoadedDatasetFile[] = [];
      let parsedMeta: Record<string, string>[] = [];

      for (const entry of entries) {
        const lower = entry.name.toLowerCase();
        const blob = await entry.async('blob');

        if (lower.endsWith('.csv')) {
          const csvText = await blob.text();
          parsedMeta = parseCsvText(csvText);
        }

        const url = URL.createObjectURL(blob);
        files.push({
          path: entry.name,
          blob,
          url,
        });
      }

      const ds: LoadedDataset = {
        files,
        metadata: parsedMeta.length > 0 ? parsedMeta : null,
      };

      setCurrentDataset(ds);
      setLoadedCount(files.length);
      setMetadataRowCount(parsedMeta.length);
      setStatus(`Imported ${files.length} files (${parsedMeta.length} metadata entries found).`);

      if (onLoaded) onLoaded(ds);
    } catch (err) {
      console.error('Error extracting dataset zip:', err);
      setStatus('Failed to parse ZIP archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    setStatus(`Loading ${fileList.length} files...`);

    try {
      const files: LoadedDatasetFile[] = [];
      let parsedMeta: Record<string, string>[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const path = f.webkitRelativePath || f.name;
        const lower = path.toLowerCase();

        if (lower.endsWith('.csv')) {
          const csvText = await f.text();
          parsedMeta = parseCsvText(csvText);
        }

        const url = URL.createObjectURL(f);
        files.push({
          path,
          blob: f,
          url,
        });
      }

      const ds: LoadedDataset = {
        files,
        metadata: parsedMeta.length > 0 ? parsedMeta : null,
      };

      setCurrentDataset(ds);
      setLoadedCount(files.length);
      setMetadataRowCount(parsedMeta.length);
      setStatus(`Imported folder with ${files.length} files (${parsedMeta.length} metadata rows).`);

      if (onLoaded) onLoaded(ds);
    } catch (err) {
      console.error('Error importing folder:', err);
      setStatus('Failed to read folder files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 mb-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white">CUSTOM LABELED DATASET UPLOADER</h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Upload a ZIP archive or folder containing inspection/reference images and <code className="text-cyan-300">metadata.csv</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={zipInputRef}
            onChange={handleZipUpload}
            accept=".zip"
            className="hidden"
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => zipInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Upload ZIP (.zip)
          </button>

          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <FolderUp className="w-3.5 h-3.5 text-cyan-400" />
            Select Directory
          </button>

          {currentDataset && onTriggerSelfTest && (
            <button
              type="button"
              onClick={() => onTriggerSelfTest(currentDataset)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Run Self-Test on Dataset
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px]">
        <div>
          Status: <span className="text-cyan-300 font-bold">{status}</span>
        </div>
        {loadedCount > 0 && (
          <div className="flex items-center gap-3">
            <span>Images: <strong className="text-white">{loadedCount}</strong></span>
            <span>Metadata Rows: <strong className="text-emerald-400">{metadataRowCount}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetUploader;

