import type { PlatformPlugin } from '../core/platform';
import type { CommentCandidate } from '../core/comment';

const COMMENT_CLASS_PATTERNS = [
  /\bcomment\b/i,
  /\brepl(?:y|ies)\b/i,
  /\bdiscussion\b/i,
  /\buser-?content\b/i,
  /\buserComment\b/i,
  /\bfeedback\b/i,
  /\bpost-?body\b/i,
];

const IGNORED_TAGS = new Set<string>([
  'HEADER',
  'NAV',
  'FOOTER',
  'ASIDE',
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
]);

const MIN_TEXT_LEN = 20;
const MAX_TEXT_LEN = 3000;

function djb2Hash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function isInsideIgnoredTag(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    if (IGNORED_TAGS.has(node.tagName)) return true;
    node = node.parentElement;
  }
  return false;
}

function matchesCommentPattern(el: HTMLElement): boolean {
  const combined = `${el.className} ${el.id} ${el.getAttribute('role') ?? ''}`;
  return COMMENT_CLASS_PATTERNS.some((p) => p.test(combined));
}

export class GenericPlatform implements PlatformPlugin {
  readonly id = 'generic';

  matches(_url: URL): boolean {
    return true;
  }

  findComments(): CommentCandidate[] {
    const seen = new Set<string>();
    const results: CommentCandidate[] = [];
    let index = 0;

    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (isInsideIgnoredTag(el)) return;
      if (!matchesCommentPattern(el)) return;

      const text = el.innerText?.trim() ?? '';
      if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) return;

      const hash = djb2Hash(text);
      if (seen.has(hash)) return;
      seen.add(hash);

      results.push({
        id: `generic-${hash}-${index++}`,
        text,
        element: el,
        sourceUrl: window.location.href,
      });
    });

    return results;
  }
}
