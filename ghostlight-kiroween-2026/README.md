# Ghostlight

**Find the barriers. Bring them into the light.**

A local-first accessibility repair workshop built for **Kiroween 2026 — Costume Contest**. Import a self-contained HTML page, inspect focused findings, make a thoughtful repair, rerun the checks, compare before and after, then export the repaired static page and an honest JSON report.

[Open the public workshop](https://ghostlight-accessibility-studio.uuuuuuuqdffaq.chatgpt.site/) · [Public source](https://github.com/Youssef123ya/ghostlight-kiroween-2026)

The hosted workshop requires no login. Start with the supplied Midnight Museum demo or import your own small HTML page.

## Run locally

Node.js 20 or newer is sufficient to serve the already-vendored static app:

```sh
npm start
```

Open `http://127.0.0.1:4317`. No API key, database, account or paid service is needed at runtime. To install development dependencies and run tests:

```sh
npm ci
npm test
```

The deployment is the `dist/` directory. There is no build step. To update the vendored sanitizer after changing its pinned dependency, run `npm run vendor` and commit its license with the distribution.

## Demo journey

1. The original Midnight Museum page starts with seven deliberate findings.
2. Describe its image, choose the page language and title, label the email field, name the menu button, correct the heading hierarchy, and improve the low-contrast text.
3. Each repair reruns the audit. The count reaches zero for these focused checks after all seven repairs; this is not a claim that the page is fully accessible.
4. Undo restores the preceding document and finding count. Compare retains the original page.
5. Complete the human-review checks only after actually performing them. They never erase automated findings.
6. Export the sanitized repaired HTML or JSON report. Importing a new page or resetting the demo clears session changes; nothing is saved automatically.

## Focused checks and limits

The eight categories are page-language presence, page-title presence, image alternatives, control labels, button names, link names, heading-level skips, and text contrast on supported solid-color rendering. This is a focused workshop, **not a WCAG certification or a replacement for a full accessibility audit**.

Names and image descriptions require human judgment. The engine does not fully implement the Accessible Name Computation specification; it supports common labels, ARIA names, visible descendant text and nested image alternatives. It does not validate whether the page's chosen language matches its prose. Keyboard operation, screen-reader journeys, zoom/reflow, dynamic states, SVG text, generated content, input values/placeholders and non-text contrast need manual review. Complex backgrounds, filters, blending, opacity and unsupported color formats are reported as limitations rather than assigned invented contrast ratios. The DOM tests do not replace testing in a real browser or assistive technology.

## Privacy and isolation

- Imported content is processed in browser memory; Ghostlight has no upload endpoint, analytics, AI inference call or persistence API.
- DOMPurify sanitizes incoming HTML. Scripts, nested frames, event handlers, external stylesheets, remote image sources and active media are excluded.
- The preview has `sandbox="allow-same-origin"` **without** script permission. A restrictive CSP blocks remote resources and form submission. Parent listeners suppress navigation in both comparison frames.
- The repaired export remains sanitized static HTML and retains its safety CSP. It is not a replacement for a JavaScript application's full source.
- HTML input is limited to 500 KB. Reloading, resetting, or importing another document discards unsaved edits.

## Development and Kiro

The root `.kiro/` directory is intentionally versioned. It includes product steering, requirements, design and tasks used in an actual Kiro CLI implementation session. Kiro generated the initial audit/repair engine, color utilities and color tests. Codex built the UI/integration and reviewed and corrected observed edge cases. See [the factual usage log](docs/kiro-usage.md) and [the implementation prompt](docs/kiro-implementation-prompt.md). No hooks, custom agents, MCP or property-based testing are claimed.

## License

Original code and original demo artwork: MIT. Vendored DOMPurify retains its own dual-license notice at `dist/vendor/DOMPurify-LICENSE.txt`. Happy DOM is a development-only dependency. See [third-party notices](THIRD_PARTY.md).

