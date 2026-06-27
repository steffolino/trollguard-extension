import type { PlatformPlugin } from '../core/platform';
import type { CommentCandidate } from '../core/comment';

const MDR_SELECTORS = [
  '.comment__text',
  '.comment-body',
  '.comment__body',
  '[class*="Comment__text"]',
  '[class*="comment__content"]',
  '.article-comments__item',
  '.comments-list__item',
  '[data-testid*="comment"]',
  '.user-comment',
  '.comment',
];

const MIN_TEXT_LEN = 20;
const MAX_TEXT_LEN = 3000;

function djb2Hash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export class MdrPlatform implements PlatformPlugin {
  readonly id = 'mdr';

  matches(url: URL): boolean {
    return url.hostname === 'www.mdr.de' || url.hostname === 'mdr.de';
  }

  findComments(): CommentCandidate[] {
    const seen = new Set<string>();
    const results: CommentCandidate[] = [];
    let index = 0;

    for (const selector of MDR_SELECTORS) {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const text = el.innerText?.trim() ?? '';
        if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) return;

        const hash = djb2Hash(text);
        if (seen.has(hash)) return;
        seen.add(hash);

        results.push({
          id: `mdr-${hash}-${index++}`,
          text,
          element: el,
          sourceUrl: window.location.href,
        });
      });
    }

    if (results.length === 0) {
      console.log('[TrollGuard] No comments detected on this page.');
    }

    return results;
  }
}
