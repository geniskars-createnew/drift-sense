export interface WaferSample {
  id: string;
  name: string;
  type: 'Logic 3nm' | 'NAND 3D 232-Layer' | 'EUV Photomask' | 'DRAM FO-WLP' | 'Power SiC Wafer';
  dieSizeMicrons: number;
  fovSizeMicrons: number;
  resolution: string;
  referenceImage: string;
  driftedImage?: string;
  defaultDriftX: number; // in nm
  defaultDriftY: number; // in nm
  defaultRotation: number; // in degrees
  noiseLevel: number;
}

export interface DriftPredictionResult {
  sampleId: string;
  timestamp: string;
  predictedDx: number; // in nm
  predictedDy: number; // in nm
  predictedRotation: number; // in degrees
  actualDx: number;
  actualDy: number;
  actualRotation: number;
  errorDistanceNm: number; // Euclidean residual error
  confidenceScore: number; // 0 - 100%
  inferenceTimeMs: number;
  status: 'RECOVERED' | 'WARNING' | 'FAILED';
  alignmentQualityScore: number; // 0 - 100
  heatmapData?: number[][];
}

export interface AlgorithmComparison {
  name: string;
  category: 'Classical' | 'Feature-Based' | 'Deep Learning';
  accuracyNm: number;
  maxDriftRangeMicrons: number;
  inferenceTimeMs: number;
  robustnessLowContrast: number; // 1-10
  robustnessNoise: number; // 1-10
  thermalExpansionTolerance: string;
  computeCost: 'Low' | 'Medium' | 'High' | 'GPU-Accelerated';
}

export interface ModelMetrics {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  maeNm: number;
  rmseNm: number;
  accuracyPct: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  modelType: 'DriftNet-v2 (ResNet-Transformer)' | 'DriftNet-Lite (Mobile)' | 'Hybrid Classical-AI';
  stagePrecisionNm: number;
  apiUrl: string;
  enableHeatmapOverlay: boolean;
  autoCorrectStage: boolean;
  fovMicrons: number;
  notificationsEnabled: boolean;
}
