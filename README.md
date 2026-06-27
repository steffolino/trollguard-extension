# TrollGuard

A Chrome- and Firefox-compatible browser extension that detects visible comments on web pages and analyzes them **locally** using a rule-based engine. Results are displayed as a compact overlay next to each comment.

> **All analysis is local. No data leaves your browser. No user tracking. No automatic posting.**

---

## Purpose

TrollGuard helps users identify potentially problematic language in online comment sections — including toxic language, dehumanizing framing, conspiracy narratives, and antisemitism — using simple pattern-matching rules that run entirely in the browser. Results are framed as **suggestions**, not authoritative judgments.

---

## Safety Boundaries

- **No external network requests.** The extension never calls an API or sends comment text anywhere.
- **No automatic actions.** TrollGuard never posts, flags, or reports anything on behalf of the user.
- **No modification of original content.** Comment text is never altered.
- **No user profiling.** No browsing history, identity data, or behavioral data is collected or stored.
- **Results are suggestions.** The rule-based engine has false positives and false negatives. A human must evaluate every result.

---

## Architecture

```
src/
├── core/
│   ├── comment.ts      — CommentCandidate interface
│   ├── analysis.ts     — analyzeComment() and rule engine
│   ├── labels.ts       — CommentLabel type and descriptions
│   └── platform.ts     — PlatformPlugin interface
├── platforms/
│   ├── generic.ts      — Fallback adapter (class/id/role pattern matching)
│   ├── mdr.ts          — MDR.de adapter
│   └── youtube.ts      — YouTube adapter (visible DOM only, no API)
├── content/
│   ├── index.ts        — Content script entry: platform selection, scan, button injection
│   └── overlay.ts      — DOM rendering for buttons and result panels
├── background/
│   └── index.ts        — Minimal MV3 service worker (message routing)
├── popup/
│   ├── index.html      — Popup UI
│   └── index.ts        — Popup logic (tab info, scan trigger)
└── shared/
    └── browser.ts      — Re-exports webextension-polyfill

public/icons/           — SVG icons (replace with PNG for production)
manifest.chrome.json    — Chrome MV3 manifest
manifest.firefox.json   — Firefox MV3 manifest
vite.config.ts          — Multi-entry build (content, background, popup)
```

The content script selects the best platform adapter for the current URL, finds visible comments, and injects a **"Check with TrollGuard"** button next to each one. Clicking the button runs `analyzeComment()` synchronously (wrapped in a Promise) and renders a result panel inline.

---

## Install

```bash
pnpm install
```

---

## Build

```bash
# Chrome
pnpm build:chrome

# Firefox
pnpm build:firefox

# Watch mode (Chrome)
pnpm dev
```

Outputs go to `dist/`. Each build copies the correct manifest as `dist/manifest.json`.

---

## Load in Chrome (Developer Mode)

1. Run `pnpm build:chrome`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle, top right)
4. Click **Load unpacked**
5. Select the `dist/` folder
6. Navigate to any page with comments and click the TrollGuard icon

---

## Load in Firefox (Temporary Add-on)

1. Run `pnpm build:firefox`
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...**
4. Select `dist/manifest.json`
5. Navigate to any page with comments

> Temporary add-ons are removed when Firefox restarts. For persistent installation, a signed extension is required.

---

## Lint & Format

```bash
pnpm lint
pnpm format
```

---

## Current Limitations

- **Rule-based only.** The MVP uses regex patterns. Accuracy is limited and context-blind.
- **English and German patterns only.** Other languages are not covered.
- **No DOM change awareness on SPAs.** A MutationObserver re-scans on DOM mutations, but deep SPA navigation may miss new comments.
- **YouTube DOM is fragile.** YouTube's comment section loads lazily and changes frequently; the adapter may need selector updates.
- **MDR.de selectors are guesses.** MDR's comment system is third-party; selectors need verification against the live site.
- **SVG icons.** Chrome requires PNG icons for stable rendering in some contexts. Replace `public/icons/*.svg` with PNG equivalents for production.
- **No persistence.** Analysis results are not saved between page loads.

---

## Next Steps

| Area | Description |
|------|-------------|
| Real platform adapters | Verified selectors for MDR.de, YouTube, Reddit, and others |
| Optional backend | Off-device analysis endpoint (opt-in, privacy-preserving) |
| ML/LLM analysis | Replace rule engine with a local ONNX model or optional API call |
| Evidence retrieval | Link claims to fact-check sources |
| Human-in-the-loop response drafting | Draft suggested responses for the user to review and optionally post |
| Persistent results | Store analysis results in `browser.storage.local` |
| Settings page | Allow users to configure label thresholds and enabled rules |
