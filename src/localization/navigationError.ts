import { MatchResult } from './matcher';

export interface NavError {
  deltaX: number;
  deltaY: number;
  euclidean: number;
  withinTolerance: boolean;
}

export function computeNavigationError(
  predicted: { x: number; y: number },
  groundTruth: { x: number; y: number },
  tolerancepx: number = 5
): NavError {
  const deltaX = groundTruth.x - predicted.x;
  const deltaY = groundTruth.y - predicted.y;
  const euclidean = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const withinTolerance = euclidean < tolerancepx;

  return {
    deltaX: Math.round(deltaX * 100) / 100,
    deltaY: Math.round(deltaY * 100) / 100,
    euclidean: Math.round(euclidean * 100) / 100,
    withinTolerance,
  };
}

export function classifyDefect(
  matchResult: MatchResult,
  errorThreshold: number = 0.6
): { isDefect: boolean; reason: string } {
  // Convert 0-1 threshold to 0-100 if matchResult.confidence is 0-100 scale
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
