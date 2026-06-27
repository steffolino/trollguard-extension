import type { RemoteAnalyzer } from '../core/remote';
import type { AnalysisLabelResult } from '../core/labels';
import type { CommentLabel } from '../core/labels';

const ENDPOINT = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';
const MIN_SCORE = 0.6;

// Maps Perspective attributes to our label taxonomy
const ATTR_TO_LABEL: Record<string, CommentLabel> = {
  TOXICITY: 'toxicity',
  SEVERE_TOXICITY: 'toxicity',
  IDENTITY_ATTACK: 'dehumanization',
  INSULT: 'insult',
  THREAT: 'toxicity',
};

const REQUESTED_ATTRIBUTES: Record<string, Record<string, never>> = Object.fromEntries(
  Object.keys(ATTR_TO_LABEL).map((k) => [k, {}]),
);

interface AttributeScore {
  summaryScore: { value: number };
}

interface PerspectiveResponse {
  attributeScores: Record<string, AttributeScore>;
}

export class PerspectiveAnalyzer implements RemoteAnalyzer {
  readonly id = 'perspective';
  readonly name = 'Perspective API';

  constructor(private readonly apiKey: string) {}

  async analyze(text: string): Promise<AnalysisLabelResult[]> {
    const url = `${ENDPOINT}?key=${encodeURIComponent(this.apiKey)}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        languages: ['de', 'en'],
        requestedAttributes: REQUESTED_ATTRIBUTES,
      }),
    });

    if (!resp.ok) {
      throw new Error(`Perspective API ${resp.status}: ${resp.statusText}`);
    }

    const data = (await resp.json()) as PerspectiveResponse;

    // Keep the highest score per label (multiple attrs can map to same label)
    const best = new Map<CommentLabel, AnalysisLabelResult>();

    for (const [attr, label] of Object.entries(ATTR_TO_LABEL)) {
      const score = data.attributeScores[attr]?.summaryScore.value ?? 0;
      if (score < MIN_SCORE) continue;

      const prev = best.get(label);
      if (!prev || score > prev.confidence) {
        best.set(label, {
          label,
          confidence: Math.round(score * 100) / 100,
          rationale: `Perspective API flagged ${attr} at ${Math.round(score * 100)}% probability`,
          evidence: [],
        });
      }
    }

    return [...best.values()];
  }
}
