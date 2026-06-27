# TrollGuard

A Chrome- and Firefox-compatible browser extension that detects visible comments on web pages and analyzes them for potentially problematic content. Analysis runs locally using a rule-based engine; an optional remote API (Perspective API or any compatible provider) can be enabled per-user for deeper coverage.

> **No automatic posting. No user profiling. No modification of original content. Results are suggestions, not judgments.**

---

## Purpose

TrollGuard helps users identify potentially problematic language in online comment sections — toxic language, dehumanizing framing, dismissive rhetoric, conspiracy narratives, antisemitism, and more — directly in the browser. It is designed for researchers, journalists, and civil society organizations who monitor online discourse.

---

## Safety Boundaries

- **No automatic actions.** TrollGuard never posts, flags, or reports anything on behalf of the user.
- **No modification of original content.** Comment text is never altered.
- **No user profiling.** No browsing history, identity data, or behavioral data is collected or stored.
- **Remote analysis is opt-in.** By default everything runs locally. If a remote provider is enabled, the user is informed and comment text is sent to that provider's API. No other data is sent.
- **Results are suggestions.** Both the rule engine and remote APIs have false positives and false negatives. A human must evaluate every result.

---

## Architecture

```
src/
├── core/
│   ├── comment.ts        — CommentCandidate interface
│   ├── analysis.ts       — analyzeComment() (local rules) + analyzeCommentFull() (local + remote merge)
│   ├── labels.ts         — CommentLabel type, AnalysisResult types, label descriptions
│   ├── platform.ts       — PlatformPlugin interface
│   └── remote.ts         — RemoteAnalyzer interface (provider-agnostic)
├── analyzers/
│   └── perspective.ts    — Google Perspective API implementation of RemoteAnalyzer
├── platforms/
│   ├── generic.ts        — Fallback adapter (class/id/role heuristics)
│   ├── mdr.ts            — MDR.de adapter (pierces Engagently Shadow DOM)
│   └── youtube.ts        — YouTube adapter (visible DOM only, no API)
├── content/
│   ├── index.ts          — Content script: platform selection, scan, button injection,
│   │                        result cache, shadow DOM observation, message handling
│   └── overlay.ts        — DOM rendering for buttons and inline result panels
├── background/
│   └── index.ts          — Minimal MV3 service worker
├── popup/
│   ├── index.html        — Popup UI (results list + settings panel)
│   └── index.ts          — Popup logic: results, Go-to links, settings management
└── shared/
    ├── browser.ts        — Re-exports webextension-polyfill
    ├── messages.ts       — ContentMessage / ContentResponse types (shared between content + popup)
    └── settings.ts       — TrollGuardSettings type + chrome.storage.sync helpers

public/icons/             — SVG icons (replace with PNG for production)
manifest.chrome.json      — Chrome MV3 manifest
manifest.firefox.json     — Firefox MV3 manifest
vite.config.ts            — Multi-entry build (content, background, popup)
```

### Analysis flow

```
Page load
  └─ content script selects platform adapter (MDR / YouTube / Generic)
  └─ findComments() — queries DOM (or shadow root) for visible comments
  └─ attachButton() — injects "Check with TrollGuard" button per comment
  └─ analyzeCommentFull() — runs in background, caches result
        ├─ analyzeComment()       local regex rule engine (always)
        └─ RemoteAnalyzer.analyze() optional, if configured
              └─ merges results: remote upgrades confidence / adds labels

Popup open
  └─ sends SCAN_REQUEST to content script
  └─ content script returns full result cache (all comments analyzed so far)
  └─ popup renders flagged comments with author, excerpt, labels, confidence
  └─ "↗ Go to" scrolls page to comment and highlights it (blue outline, 2s)

MutationObserver (document.body + shadow roots)
  └─ fires on DOM changes (lazy-loaded comments, SPA navigation)
  └─ debounced 400 ms → scan() → analyzeCommentFull() → cache grows
```

### Label taxonomy

| Label | Description |
|---|---|
| `not_problematic` | No harmful patterns detected |
| `toxicity` | Abusive or highly offensive language |
| `insult` | Direct personal attacks |
| `dehumanization` | Language stripping people of humanity |
| `racism` | Racial stereotyping or discriminatory generalizations |
| `antisemitism` | Antisemitic tropes, scapegoats, coded terminology |
| `conspiracy_narrative` | Unsubstantiated conspiracy framing |
| `false_or_unverified_claim` | Claims presented as fact without evidence |
| `right_extremist_narrative` | Far-right extremist terminology |
| `dismissive_framing` | Delegitimising critics via contemptuous language (Schlauberger, mobbingartig…) |
| `coordinated_pattern` | Signs of coordinated or inauthentic behavior (rule stubs, not yet active) |

### Adding a remote provider

1. Implement `RemoteAnalyzer` in `src/analyzers/your-provider.ts`:
   ```ts
   export class MyAnalyzer implements RemoteAnalyzer {
     readonly id = 'my-provider';
     readonly name = 'My Provider';
     async analyze(text: string): Promise<AnalysisLabelResult[]> { … }
   }
   ```
2. Add `<option value="my-provider">My Provider</option>` in `src/popup/index.html`
3. Map the provider id to your class in `src/content/index.ts` (`refreshRemoteAnalyzer`)
4. If the provider needs a host permission, add it to both manifests under `host_permissions`

---

## Install

> **Note:** The project uses `pnpm`. If pnpm 11 fails (requires Node 22+), `npm` works as a drop-in.

```bash
npm install
# or: pnpm install  (requires Node 22+)
```

---

## Build

```bash
# Chrome / Edge
npm run build:chrome

# Firefox
npm run build:firefox

# Watch mode (Chrome) — rebuilds on file save
npm run dev
```

Outputs go to `dist/`. Each build copies the correct manifest as `dist/manifest.json`.

After every rebuild, go to `chrome://extensions` and click the **↺ reload** icon on the TrollGuard card, then reload the target page.

---

## Load in Chrome (Developer Mode)

1. Run `npm run build:chrome`
2. Open `chrome://extensions`
3. Enable **Developer mode** (toggle, top right)
4. Click **Load unpacked** → select the `dist/` folder
5. Navigate to a page with comments and open the TrollGuard popup

---

## Load in Firefox (Temporary Add-on)

1. Run `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…** → select `dist/manifest.json`

> Temporary add-ons are removed on Firefox restart. A signed extension is needed for persistence.

---

## Lint & Format

```bash
npm run lint
npm run format
```

---

## Configuring Perspective API (optional)

The Perspective API provides deeper toxicity and identity-attack detection, especially useful for German-language content where the local rules have limited coverage.

### Get an API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
2. Enable the **Perspective Comment Analyzer API**
3. Create an API key under **APIs & Services → Credentials**

### Enable in TrollGuard

1. Open the TrollGuard popup
2. Click the **⚙** icon (top right of the popup header)
3. Select **Perspective API** and paste your key
4. Click **Save**

The footer changes to confirm data is being sent to Google. To revert to local-only, set the provider back to **Local rules only**.

**What is sent:** only the text of each comment, the detected language (`de`/`en`), and the requested attribute list. No page URL, user identity, or other data is included.

---

## Current Limitations

- **Rule-based engine is context-blind.** Regex cannot understand what policy a comment defends, detect DARVO (victim-perpetrator reversal) framing, or follow a debate across multiple comments.
- **German coverage is partial.** Some patterns are German-aware; others are English-only. Perspective API improves German coverage significantly.
- **Shadow DOM platforms require explicit support.** Only MDR (Engagently) is handled. Other comment widgets using Shadow DOM (e.g. Disqus in shadow mode) need their own adapters.
- **YouTube comments load lazily.** Scroll down on a video page to load comments before scanning. The MutationObserver picks them up automatically.
- **No cross-comment author analysis.** The extension cannot yet detect that a single author is posting multiple coordinated comments in the same thread.
- **SVG icons.** Some Chrome contexts prefer PNG. Replace `public/icons/*.svg` with 16×16, 48×48, and 128×128 PNG files for production.
- **No result persistence.** The analysis cache is in-memory and resets on page reload.

---

## Next Steps

| Area | Description |
|---|---|
| Article context for remote analysis | Pass page title and article summary to the remote API so it can evaluate comments in context (e.g. knowing the article is about a discriminatory access policy) |
| LLM-based analysis | Replace or supplement remote API with a structured LLM prompt that understands framing, implication, and DARVO patterns |
| Cross-comment author tracking | Group comments by author within a thread; flag users posting coordinated narratives (`coordinated_pattern` label) |
| More platform adapters | Verified adapters for Reddit, X/Twitter, Facebook, Spiegel Online, Zeit Online |
| Persistent result cache | Store results in `browser.storage.local` so they survive page reload |
| Label threshold settings | Let users configure minimum confidence thresholds per label |
| Evidence retrieval | Link flagged claims to fact-check sources (e.g. via Claim Review API) |
| Human-in-the-loop response drafting | Draft suggested counter-speech responses for the user to review and optionally post |
