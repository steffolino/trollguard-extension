import type { AnalysisLabelResult } from './labels';

export interface RemoteAnalyzer {
  readonly id: string;
  readonly name: string;
  analyze(text: string): Promise<AnalysisLabelResult[]>;
}
