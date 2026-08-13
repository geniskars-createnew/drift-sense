import React from 'react';

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
  onLoaded?: (dataset: LoadedDataset | any) => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onLoaded }) => {
  return (
    <div className="p-4 mb-6 rounded-xl bg-slate-900/60 border border-slate-800">
      <p className="text-sm font-medium text-slate-300">Dataset Uploader Component</p>
    </div>
  );
};

export default DatasetUploader;
