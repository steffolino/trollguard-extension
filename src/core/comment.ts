export interface CommentCandidate {
  id: string;
  text: string;
  author?: string;
  element: HTMLElement;
  sourceUrl: string;
}
