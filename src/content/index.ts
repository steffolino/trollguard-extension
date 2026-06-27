import { analyzeComment } from '../core/analysis';
import type { CommentSummary, ContentResponse } from '../shared/messages';
import type { CommentCandidate } from '../core/comment';
import type { PlatformPlugin } from '../core/platform';
import { GenericPlatform } from '../platforms/generic';
import { MdrPlatform } from '../platforms/mdr';
import { YoutubePlatform } from '../platforms/youtube';
import { renderButton, renderResult } from './overlay';

const PLATFORMS: PlatformPlugin[] = [
  new MdrPlatform(),
  new YoutubePlatform(),
  new GenericPlatform(),
];

const commentRegistry = new Map<string, CommentCandidate>();
const resultCache = new Map<string, CommentSummary>();

function getActivePlatform(): PlatformPlugin {
  const url = new URL(window.location.href);
  return PLATFORMS.find((p) => p.matches(url)) ?? new GenericPlatform();
}

function attachButton(comment: CommentCandidate): void {
  commentRegistry.set(comment.id, comment);
  if (comment.element.querySelector('.tg-check-btn')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'tg-wrapper';
  wrapper.setAttribute('data-tg-id', comment.id);

  const btn = renderButton(() => {
    btn.disabled = true;
    btn.textContent = 'Analyzing…';

    analyzeComment(comment)
      .then((result) => {
        renderResult(result, wrapper);
        btn.textContent = 'Re-analyze';
        btn.disabled = false;
      })
      .catch((err: unknown) => {
        console.error('[TrollGuard] Analysis failed:', err);
        btn.textContent = 'Check with TrollGuard';
        btn.disabled = false;
      });
  });

  wrapper.appendChild(btn);
  comment.element.insertAdjacentElement('afterend', wrapper);
}

function scan(): void {
  const platform = getActivePlatform();
  const comments = platform.findComments();
  for (const comment of comments) {
    attachButton(comment);
    if (!resultCache.has(comment.id)) {
      void analyzeComment(comment).then((result) => {
        resultCache.set(comment.id, {
          id: comment.id,
          text: comment.text.slice(0, 150),
          author: comment.author,
          result,
        });
      });
    }
  }
  if (comments.length > 0) {
    console.log(
      `[TrollGuard] ${platform.id}: ${comments.length} visible, ${resultCache.size} cached`,
    );
  }
}

async function scanAndAnalyze(): Promise<CommentSummary[]> {
  const platform = getActivePlatform();
  const comments = platform.findComments();
  comments.forEach(attachButton);

  const uncached = comments.filter((c) => !resultCache.has(c.id));
  await Promise.all(
    uncached.map(async (comment) => {
      const result = await analyzeComment(comment);
      resultCache.set(comment.id, {
        id: comment.id,
        text: comment.text.slice(0, 150),
        author: comment.author,
        result,
      });
    }),
  );

  return [...resultCache.values()];
}

function scrollToComment(commentId: string): void {
  const comment = commentRegistry.get(commentId);
  if (!comment) return;
  comment.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const el = comment.element;
  const prevOutline = el.style.outline;
  el.style.outline = '2px solid #3b82f6';
  setTimeout(() => {
    el.style.outline = prevOutline;
  }, 2000);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message === null || typeof message !== 'object') return undefined;
  const msg = message as Record<string, unknown>;

  if (msg['type'] === 'SCAN_REQUEST') {
    scanAndAnalyze()
      .then((results) => {
        sendResponse({ type: 'SCAN_RESULTS', results } satisfies ContentResponse);
      })
      .catch(() => {
        sendResponse({ type: 'SCAN_RESULTS', results: [] } satisfies ContentResponse);
      });
    return true;
  }

  if (msg['type'] === 'SCROLL_TO_COMMENT' && typeof msg['commentId'] === 'string') {
    scrollToComment(msg['commentId']);
    return undefined;
  }

  return undefined;
});

function observeShadowRoots(onMutation: () => void): void {
  // Shadow DOM mutations (e.g. MDR/Engagently lazy-loading comments) are invisible
  // to a document.body MutationObserver — attach a separate observer to each shadow root.
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el.shadowRoot) {
      const obs = new MutationObserver(onMutation);
      obs.observe(el.shadowRoot, { childList: true, subtree: true });
    }
  });
}

function init(): void {
  scan();

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const onMutation = (): void => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scan, 400);
  };

  new MutationObserver(onMutation).observe(document.body, {
    childList: true,
    subtree: true,
  });

  observeShadowRoots(onMutation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
