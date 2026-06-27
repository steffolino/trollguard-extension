import { analyzeComment } from '../core/analysis';
import type { CommentCandidate } from '../core/comment';
import type { PlatformPlugin } from '../core/platform';
import { GenericPlatform } from '../platforms/generic';
import { MdrPlatform } from '../platforms/mdr';
import { YoutubePlatform } from '../platforms/youtube';
import { renderButton, renderResult } from './overlay';

const PLATFORMS: PlatformPlugin[] = [
  new MdrPlatform(),
  new YoutubePlatform(),
  new GenericPlatform(), // fallback — always matches
];

function getActivePlatform(): PlatformPlugin {
  const url = new URL(window.location.href);
  return PLATFORMS.find((p) => p.matches(url)) ?? new GenericPlatform();
}

function attachButton(comment: CommentCandidate): void {
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
  comments.forEach(attachButton);
}

function init(): void {
  scan();

  // Re-scan when the DOM updates (handles lazy-loaded comments)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(scan, 400);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
