export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ScoredSection {
  heading: string;
  content: string;
  targetBlock: string;
  confidence: number;
  level: ConfidenceLevel;
  /** Optional metadata propagated from parser. */
  metadata?: Record<string, unknown>;
}

export function classifyConfidence(score: number): ConfidenceLevel {
  if (score > 0.8) return ConfidenceLevel.HIGH;
  if (score >= 0.5) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}
