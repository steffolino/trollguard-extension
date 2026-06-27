import type { PlatformPlugin } from '../core/platform';
import type { CommentCandidate } from '../core/comment';

// Selectors for YouTube's comment DOM (no API calls, visible DOM only)
const YT_TEXT_SELECTORS = [
  'ytd-comment-thread-renderer #content-text',
  'ytd-comment-renderer #content-text',
  'yt-formatted-string#content-text',
];

const YT_AUTHOR_SELECTOR = '#author-text';
const YT_THREAD_SELECTOR = 'ytd-comment-thread-renderer, ytd-comment-renderer';

const MIN_TEXT_LEN = 20;
const MAX_TEXT_LEN = 3000;

function djb2Hash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function resolveAuthor(contentEl: HTMLElement): string | undefined {
  const thread = contentEl.closest(YT_THREAD_SELECTOR);
  if (!thread) return undefined;
  const authorEl = thread.querySelector<HTMLElement>(YT_AUTHOR_SELECTOR);
  return authorEl?.innerText?.trim() || undefined;
}

export class YoutubePlatform implements PlatformPlugin {
  readonly id = 'youtube';

  matches(url: URL): boolean {
    return (
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'youtube.com' ||
      url.hostname === 'youtu.be'
    );
  }

  findComments(): CommentCandidate[] {
    const seen = new Set<string>();
    const results: CommentCandidate[] = [];
    let index = 0;

    for (const selector of YT_TEXT_SELECTORS) {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const text = el.innerText?.trim() ?? '';
        if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) return;

        const hash = djb2Hash(text);
        if (seen.has(hash)) return;
        seen.add(hash);

        results.push({
          id: `youtube-${hash}-${index++}`,
          text,
          author: resolveAuthor(el),
          element: el,
          sourceUrl: window.location.href,
        });
      });
    }

    return results;
  }
}
