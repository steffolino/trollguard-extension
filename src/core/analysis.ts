import type { CommentCandidate } from './comment';
import type { CommentLabel } from './labels';

export interface AnalysisLabelResult {
  label: CommentLabel;
  confidence: number;
  rationale: string;
  evidence: string[];
}

export interface AnalysisResult {
  commentId: string;
  labels: AnalysisLabelResult[];
  suggestedResponse?: string;
}

interface Rule {
  label: CommentLabel;
  patterns: RegExp[];
  rationale: string;
  confidenceBase: number;
}

const RULES: Rule[] = [
  {
    label: 'toxicity',
    patterns: [
      /\b(idiot|moron|stupid(?:\s+\w+)?|dumb(?:ass)?|retard(?:ed)?|loser|scum(?:bag)?|piece\s+of\s+shit|go\s+to\s+hell|kill\s+yourself|kys|worthless\s+\w+)\b/i,
      /\b(Vollidiot|Depp|Dummkopf|Trottel|Arschloch|Wichser|Versager|Drecksbag)\b/i,
    ],
    rationale:
      'Matches vocabulary patterns commonly used in abusive or highly offensive commentary',
    confidenceBase: 0.72,
  },
  {
    label: 'insult',
    patterns: [
      /\byou(?:'re|\s+are)\s+(?:a\s+)?(?:complete\s+|total\s+|utter\s+)?(?:fool|coward|liar|hypocrite|clown|fraud|failure|waste\s+of\s+space)\b/i,
      /\b(?:pathetic|disgusting|despicable|vile)\s+(?:people|person|individuals?|creatures?|beings?)\b/i,
      /\bwhat\s+a\s+(?:pathetic|disgusting|sad)\s+(?:excuse\s+for\s+a\s+)?(?:human|person|man|woman)\b/i,
    ],
    rationale: 'Matches direct personal attack patterns directed at individuals or groups',
    confidenceBase: 0.65,
  },
  {
    label: 'dehumanization',
    patterns: [
      /\b(?:rats?|cockroach(?:es)?|vermin|parasites?|subhuman|pests?|insects?|locust|plague|infestation|cancer|virus)\s+(?:of|in|on|from|are|to|that\s+(?:infest|plague|destroy))\b/i,
      /\b(?:these\s+)?(?:people|they|them|those)\s+(?:are\s+)?(?:not\s+even\s+)?(?:human|real\s+people|worthy\s+of|deserving\s+of)\b/i,
      /\b(?:Schmarotzer|Parasiten|Ungeziefer|Untermenschen|Ratten|Kakerlaken)\b/i,
    ],
    rationale:
      'Matches language patterns that reduce groups of people to non-human or degraded categories',
    confidenceBase: 0.82,
  },
  {
    label: 'racism',
    patterns: [
      /\b(?:all|those|these|typical)\s+\w+s?\s+(?:are\s+)?(?:always|never|only|just)\s+(?:criminals?|lazy|stupid|violent|dangerous|thieves?|savages?)\b/i,
      /\b(?:go\s+back\s+to|belong\s+in|should\s+stay\s+in)\s+(?:your\s+)?(?:country|continent|homeland|where\s+you\s+came\s+from|Africa|the\s+jungle)\b/i,
      /\b(?:race\s+(?:of\s+)?)?(?:savages?|primitives?|barbarians?)\s+(?:who|that)\b/i,
    ],
    rationale:
      'Matches patterns indicating racial stereotyping, collective blame, or discriminatory generalizations',
    confidenceBase: 0.70,
  },
  {
    label: 'antisemitism',
    patterns: [
      /\b(?:jews?|jewish\s+people)\s+(?:control|own|run|dominate|manipulate|are\s+behind|destroyed?)\b/i,
      /\b(?:rothschild|soros)\s+(?:controls?|owns?|funds?|manipulates?|orchestrates?|pays?)\b/i,
      /\b(?:zionist\s+(?:occupation|conspiracy|agenda|control|plot)|ZOG|world\s+(?:jewish\s+)?(?:government|conspiracy))\b/i,
      /\b(?:Juden\s+(?:kontrollie|beherrsch|zerstör|sind\s+schuld))\b/i,
    ],
    rationale:
      'Matches known antisemitic tropes including control narratives, named scapegoats, and coded terminology',
    confidenceBase: 0.82,
  },
  {
    label: 'conspiracy_narrative',
    patterns: [
      /\b(?:wake\s+up|open\s+your\s+eyes),?\s+(?:sheeple|sheep|people|folks)\b/i,
      /\b(?:new\s+world\s+order|NWO|deep\s+state|shadow\s+(?:government|elite)|secret\s+(?:elite|cabal|society|group)\s+(?:is|are|that|which))\b/i,
      /\b(?:plandemic|scamdemic|false\s+flag|crisis\s+actor(?:s)?|it\s+was\s+staged|staged\s+event)\b/i,
      /\b(?:they\s+don't\s+want\s+you\s+to\s+know|the\s+(?:truth\s+)?(?:media|government|elite)\s+(?:hides?|suppresses?|covers?\s+up|won't\s+tell))\b/i,
      /\b(?:chemtrails?|5G\s+(?:causes?|spreads?|is\s+behind)|microchips?\s+in\s+(?:the\s+)?vaccine|depopulation\s+agenda|population\s+control\s+agenda)\b/i,
      /\b(?:Lügenpresse|Volksverräter|Systemmedien|Systemparteien|Globalisten|Gleichschaltung)\b/i,
    ],
    rationale:
      'Matches vocabulary and framing patterns associated with common conspiracy narratives',
    confidenceBase: 0.73,
  },
  {
    label: 'false_or_unverified_claim',
    patterns: [
      /\beveryone\s+(?:already\s+)?knows?\s+(?:that\s+)?(?:this|it|they)\b/i,
      /\bit(?:'s|\s+is)\s+(?:a\s+)?(?:proven|scientific|well-established|undeniable)\s+fact\s+that\b/i,
      /\b(?:100%|completely|absolutely|without\s+(?:a\s+)?(?:doubt|question))\s+(?:true|proven?|confirmed?|certain|real)\b/i,
      /\b(?:mainstream\s+)?(?:media|science|the\s+experts?|doctors?)\s+(?:lie|lies|are\s+lying|won't\s+tell\s+you|hide\s+this)\b/i,
      /\bstudies?\s+(?:prove|show|confirm|demonstrate)\s+(?:that\s+)?(?:vaccines?|immigrants?|(?:a\s+)\w+)\b/i,
    ],
    rationale:
      'Matches patterns that assert unverified claims as established fact or dismiss expert consensus without evidence',
    confidenceBase: 0.55,
  },
  {
    label: 'right_extremist_narrative',
    patterns: [
      /\b(?:great\s+replacement|replacement\s+theory|white\s+genocide|demographic\s+(?:replacement|warfare))\b/i,
      /\b(?:ethnostate|white\s+(?:nation|homeland|power)|pure\s+(?:race|blood)|race\s+(?:traitor|mixing\s+(?:is|destroys)))\b/i,
      /\b(?:Umvolkung|Bevölkerungsaustausch|Überfremdung|Rasseverrat|Blut\s+und\s+Boden)\b/i,
    ],
    rationale:
      'Matches terminology associated with far-right extremist narratives (placeholder ruleset — expand with domain expertise)',
    confidenceBase: 0.80,
  },
];

const HIGH_SEVERITY_LABELS: CommentLabel[] = [
  'dehumanization',
  'antisemitism',
  'right_extremist_narrative',
];

function extractEvidence(text: string, patterns: RegExp[]): string[] {
  const evidence: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) {
      const phrase = match[0].trim();
      if (!evidence.includes(phrase)) {
        evidence.push(phrase);
      }
    }
  }
  return evidence;
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function computeConfidence(base: number, matchCount: number): number {
  return Math.min(base + (matchCount - 1) * 0.05, 0.95);
}

export async function analyzeComment(comment: CommentCandidate): Promise<AnalysisResult> {
  const { text, id: commentId } = comment;
  const matchedLabels: AnalysisLabelResult[] = [];

  for (const rule of RULES) {
    if (!matchesAny(text, rule.patterns)) continue;

    const evidence = extractEvidence(text, rule.patterns);
    matchedLabels.push({
      label: rule.label,
      confidence: computeConfidence(rule.confidenceBase, evidence.length),
      rationale: rule.rationale,
      evidence,
    });
  }

  if (matchedLabels.length === 0) {
    return {
      commentId,
      labels: [
        {
          label: 'not_problematic',
          confidence: 0.8,
          rationale:
            'No patterns matching known problematic content categories were detected by the local ruleset',
          evidence: [],
        },
      ],
    };
  }

  const isHighSeverity = matchedLabels.some((l) => HIGH_SEVERITY_LABELS.includes(l.label));
  const suggestedResponse = isHighSeverity
    ? 'Consider reporting this comment to the platform moderators using the platform\'s built-in reporting tool.'
    : undefined;

  return { commentId, labels: matchedLabels, suggestedResponse };
}
