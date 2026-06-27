import type { CommentCandidate } from './comment';

export interface PlatformPlugin {
  id: string;
  matches(url: URL): boolean;
  findComments(): CommentCandidate[];
}
