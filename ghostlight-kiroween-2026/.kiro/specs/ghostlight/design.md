# Design and technical contract

## Visual direction
An editorial restoration workshop: near-black olive shell, warm parchment preview, chartreuse accent, mint completion signals, restrained orange severity labels. Original code-drawn ghost mark, line-art lantern, clear geometric typography with system font fallbacks. No stock photography or third-party brands in demo content. A dark sidebar provides workspace identity. The main area contains intro, summary counters, issue list, rendered page and repair inspector. At small widths the panels stack.

## Files and ownership
- dist/index.html, dist/styles.css, dist/app.js: Codex initial shell and integration.
- dist/audit.js, dist/color.js and tests/: Kiro implementation requested from this specification. Codex will review, repair integration and verify end to end.
- dist/vendor/purify.min.js and license: official DOMPurify package.
- scripts/serve.mjs: static local preview only; never accepts uploads.
- docs/kiro-usage.md: actual contribution log, no fabricated provenance.

## Engine contract (must match app.js)
Export auditDocument(doc) and repairIssue(doc, issue, value) and serializeDocument(doc) from dist/audit.js. auditDocument returns {issues, manualWarnings, checksRun:8}. Issues: {key, nodeId, kind, severity, title, description, snippet, suggestion, details?}. kind is one of lang,title,alt,label,button-name,link-name,heading,contrast. severity is serious or moderate. Set a stable data-gl-id on the affected DOM element; IDs are scoped to the preview and unique. key is kind + ':' + nodeId. manualWarnings is an array of strings. Return serializable data, not DOM node objects.

repairIssue(doc, issue, value) resolves issue.nodeId with a safe attribute match. value is a string for all normal repairs; for image alt the special object {decorative:true} means alt=''. For heading use the recommended h1-h6 string from issue.suggestion; for contrast use the recommended #000000/#ffffff string; issue.details may hold ratio, threshold or currentLevel. For other fields issue.suggestion is the suggested input placeholder/default, not invented final meaningful text. Repair throws Error with a helpful message for invalid input, stale target or unsupported kind. Label repair creates a <label> before control and sets a unique id only if needed. Repeated repairs are idempotent.

serializeDocument(doc) returns a doctype + clean HTML copy without data-gl-id attributes. Preserve repaired semantics and styles. Parent app will add a safety CSP to each preview and export. serializeDocument must not reintroduce executable content.

Export contrastRatio(foreground, background), parseColor(cssColor), luminance(rgb) and recommendTextColor(background) from dist/color.js. Test WCAG numerical behaviour, alpha backgrounds/foreground handling as supported, unsupported colors returning null, and threshold edge cases. Audit tests should use a lightweight DOM test dev dependency only if useful, otherwise browser QA covers live computed styles. Do not add a browser-control framework. Do not create subagents.

## Rendering and state
Parent app sanitizes and loads iframe.srcdoc, waits for load, then calls auditDocument(frame.contentDocument). Parent can inspect same-origin sandbox DOM even when imported scripts are disabled. Computed styles are read from doc.defaultView. Avoid axe's cross-frame script injection since this sandbox deliberately forbids child scripts. Each import resets baseline; every repair stores a serialized prior snapshot for undo, updates currentHTML and reloads before re-audit. Keep baseline findings and baseline HTML for Compare. Do not conflate count of repaired original issues with count of current issues if one repair introduces a new problem.

## Honest limits
No arbitrary URL crawling, external styles/assets, scripts, app routing, full WCAG certification, PDF audit or AI runtime claims. Automated contrast should cover only solid resolvable conditions, and list skipped conditions for human review. Restored UI is a sanitized static document, not a functional replacement for a JavaScript web app.

