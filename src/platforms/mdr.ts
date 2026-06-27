import type { PlatformPlugin } from '../core/platform';
import type { CommentCandidate } from '../core/comment';

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

    // MDR uses Engagently (<egy-discussion>) with an open Shadow DOM.
    // Standard querySelectorAll cannot pierce shadow roots — access shadowRoot directly.
    const widgets = document.querySelectorAll<HTMLElement>('egy-discussion');

    for (const widget of widgets) {
      const shadow = widget.shadowRoot;
      if (!shadow) continue;

      const textSpans = shadow.querySelectorAll<HTMLElement>(
        'span[part="commentary__content-text"]',
      );

      for (const span of textSpans) {
        const text = span.innerText?.trim() ?? '';
        if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) continue;

        const hash = djb2Hash(text);
        if (seen.has(hash)) continue;
        seen.add(hash);

        // Anchor to the wrapping commentary div so the button lands after the whole comment block
        const commentaryEl =
          span.closest<HTMLElement>('div[data-testid^="commentary-"]') ?? span;

        const authorEl = commentaryEl.querySelector<HTMLElement>(
          'a[part="commentary-author__name"]',
        );
        const author = authorEl?.innerText?.trim() || undefined;

        results.push({
          id: `mdr-${hash}-${index++}`,
          text,
          author,
          element: commentaryEl,
          sourceUrl: window.location.href,
        });
      }
    }

    if (results.length === 0) {
      console.log('[TrollGuard] No comments detected on this page.');
    }

    return results;
  }
}
