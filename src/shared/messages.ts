import type { AnalysisResult } from '../core/analysis';

export interface CommentSummary {
  id: string;
  text: string;
  author?: string;
  result: AnalysisResult;
}

export type ContentMessage =
  | { type: 'SCAN_REQUEST' }
  | { type: 'SCROLL_TO_COMMENT'; commentId: string };

export type ContentResponse =
  | { type: 'SCAN_RESULTS'; results: CommentSummary[] }
  | { type: 'SCROLL_ACK' };
