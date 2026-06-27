import type { AnalysisResult } from '../core/analysis';
import type { CommentLabel } from '../core/labels';
import { LABEL_DESCRIPTIONS } from '../core/labels';

const LABEL_COLOR: Record<CommentLabel, string> = {
  not_problematic: '#22c55e',
  toxicity: '#ef4444',
  insult: '#f97316',
  dehumanization: '#dc2626',
  racism: '#dc2626',
  antisemitism: '#dc2626',
  conspiracy_narrative: '#a855f7',
  false_or_unverified_claim: '#f59e0b',
  right_extremist_narrative: '#dc2626',
  coordinated_pattern: '#6366f1',
  dismissive_framing: '#f97316',
};

const BASE_STYLES = {
  btn: [
    'display:inline-flex',
    'align-items:center',
    'margin:4px 0',
    'padding:3px 10px',
    'font-size:11px',
    'font-family:system-ui,sans-serif',
    'color:#fff',
    'background:#3b82f6',
    'border:none',
    'border-radius:4px',
    'cursor:pointer',
    'opacity:0.85',
    'transition:opacity 0.15s',
    'line-height:1.6',
  ].join(';'),
  panel: [
    'margin:6px 0',
    'padding:10px 12px',
    'background:#1e293b',
    'border:1px solid #334155',
    'border-radius:6px',
    'font-family:system-ui,sans-serif',
    'font-size:12px',
    'color:#e2e8f0',
    'max-width:540px',
    'box-sizing:border-box',
    'text-align:left',
  ].join(';'),
};

export function renderButton(onAnalyze: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = 'Check with TrollGuard';
  btn.className = 'tg-check-btn';
  btn.style.cssText = BASE_STYLES.btn;

  btn.addEventListener('mouseenter', () => {
    btn.style.opacity = '1';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.opacity = '0.85';
  });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onAnalyze();
  });

  return btn;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.style.cssText = css;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderResult(result: AnalysisResult, container: HTMLElement): void {
  container.querySelector('.tg-result')?.remove();

  const panel = el('div', BASE_STYLES.panel);
  panel.className = 'tg-result';

  const header = el(
    'div',
    'font-weight:600;font-size:10px;color:#94a3b8;margin-bottom:8px;letter-spacing:0.06em;text-transform:uppercase',
    'TrollGuard Analysis — Suggestions only',
  );
  panel.appendChild(header);

  for (const lr of result.labels) {
    const color = LABEL_COLOR[lr.label] ?? '#64748b';
    const pct = Math.round(lr.confidence * 100);

    const row = el('div', 'margin-bottom:8px');

    const topLine = el('div', 'display:flex;align-items:center;gap:6px;flex-wrap:wrap');

    const badge = el(
      'span',
      [
        `background:${color}22`,
        `color:${color}`,
        `border:1px solid ${color}55`,
        'border-radius:3px',
        'padding:1px 6px',
        'font-size:10px',
        'font-weight:700',
        'letter-spacing:0.03em',
      ].join(';'),
      lr.label.replace(/_/g, ' '),
    );

    const conf = el(
      'span',
      'color:#94a3b8;font-size:10px',
      `${pct}% confidence`,
    );

    topLine.appendChild(badge);
    topLine.appendChild(conf);
    row.appendChild(topLine);

    const desc = el(
      'div',
      'color:#cbd5e1;margin-top:3px',
      LABEL_DESCRIPTIONS[lr.label],
    );
    row.appendChild(desc);

    const rationale = el(
      'div',
      'color:#94a3b8;font-size:11px;margin-top:2px;font-style:italic',
      lr.rationale,
    );
    row.appendChild(rationale);

    if (lr.evidence.length > 0) {
      const evidenceText = lr.evidence.map((e) => `"${e}"`).join(', ');
      const evidence = el(
        'div',
        'margin-top:3px;font-size:10px;color:#64748b',
        `Matched: ${evidenceText}`,
      );
      row.appendChild(evidence);
    }

    panel.appendChild(row);
  }

  if (result.suggestedResponse) {
    const suggestion = el(
      'div',
      [
        'margin-top:8px',
        'padding:6px 8px',
        'background:#1e3a5f',
        'border-radius:4px',
        'color:#93c5fd',
        'font-size:11px',
      ].join(';'),
      `Suggestion: ${result.suggestedResponse}`,
    );
    panel.appendChild(suggestion);
  }

  const footer = el(
    'div',
    'margin-top:8px;font-size:10px;color:#475569;font-style:italic',
    'Analysis is entirely local and rule-based. Results are suggestions, not authoritative judgments.',
  );
  panel.appendChild(footer);

  container.appendChild(panel);
}
