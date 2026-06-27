import browser from 'webextension-polyfill';
import type { CommentSummary, ContentResponse } from '../shared/messages';

const LABEL_COLOR: Record<string, string> = {
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
};

async function getCurrentTab(): Promise<browser.Tabs.Tab | undefined> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function scrollToComment(tabId: number, commentId: string): void {
  void browser.tabs.sendMessage(tabId, { type: 'SCROLL_TO_COMMENT', commentId });
}

function renderResults(results: CommentSummary[], tabId: number): void {
  const container = document.getElementById('results')!;
  const countEl = document.getElementById('comment-count')!;

  const flagged = results.filter((r) =>
    r.result.labels.some((l) => l.label !== 'not_problematic'),
  );

  if (results.length === 0) {
    countEl.textContent = '';
    container.innerHTML =
      '<div class="empty">No comments detected yet.<br>Scroll the page so comments appear, then click Scan again.</div>';
    return;
  }

  countEl.textContent = `${results.length} comment${results.length !== 1 ? 's' : ''} · ${flagged.length} flagged`;

  if (flagged.length === 0) {
    container.innerHTML =
      '<div class="empty">No potentially problematic content detected.<br><br>' +
      '<span style="color:#334155">Scroll the page to load more comments, then click Scan again.</span></div>';
    return;
  }

  container.innerHTML = '';

  for (const summary of flagged) {
    const labels = summary.result.labels.filter((l) => l.label !== 'not_problematic');

    const item = document.createElement('div');
    item.className = 'result-item';

    const header = document.createElement('div');
    header.className = 'result-header';

    const authorEl = document.createElement('span');
    authorEl.className = 'result-author';
    authorEl.textContent = summary.author ?? 'Anonymous';

    const gotoBtn = document.createElement('button');
    gotoBtn.className = 'goto-btn';
    gotoBtn.textContent = '↗ Go to';
    gotoBtn.addEventListener('click', () => {
      scrollToComment(tabId, summary.id);
      window.close();
    });

    header.appendChild(authorEl);
    header.appendChild(gotoBtn);
    item.appendChild(header);

    const textEl = document.createElement('div');
    textEl.className = 'result-text';
    const excerpt = summary.text.length > 110 ? summary.text.slice(0, 110) + '…' : summary.text;
    textEl.textContent = excerpt;
    item.appendChild(textEl);

    const labelsEl = document.createElement('div');
    labelsEl.className = 'result-labels';

    for (const lr of labels) {
      const color = LABEL_COLOR[lr.label] ?? '#64748b';
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44`;
      badge.textContent = `${lr.label.replace(/_/g, ' ')} ${Math.round(lr.confidence * 100)}%`;
      labelsEl.appendChild(badge);
    }

    item.appendChild(labelsEl);
    container.appendChild(item);
  }
}

async function runScan(): Promise<void> {
  const scanBtn = document.getElementById('scan-btn') as HTMLButtonElement;
  const container = document.getElementById('results')!;
  const countEl = document.getElementById('comment-count')!;

  const tab = await getCurrentTab();
  if (!tab?.id) {
    countEl.textContent = '';
    container.innerHTML = '<div class="empty">No active tab found.</div>';
    return;
  }

  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning…';
  container.innerHTML = '<div class="loading">Analyzing comments…</div>';

  try {
    const response = (await browser.tabs.sendMessage(tab.id, {
      type: 'SCAN_REQUEST',
    })) as ContentResponse;

    if (response.type === 'SCAN_RESULTS') {
      renderResults(response.results, tab.id);
    }
  } catch {
    countEl.textContent = '';
    container.innerHTML =
      '<div class="empty">Could not reach the page.<br>Reload the page and try again.</div>';
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan again';
  }
}

async function init(): Promise<void> {
  const statusDot = document.getElementById('status-dot')!;
  const statusText = document.getElementById('status-text')!;

  try {
    const tab = await getCurrentTab();
    statusText.textContent = tab?.url ? new URL(tab.url).hostname : 'Unknown';
    statusDot.style.background = '#22c55e';
  } catch {
    statusDot.style.background = '#ef4444';
    statusText.textContent = 'Error';
  }

  document.getElementById('scan-btn')!.addEventListener('click', () => void runScan());
  void runScan();
}

void init();
