# Ghostlight requirements

## Audience and outcome
A developer or designer with a small self-contained HTML page can identify common barriers, make guided repairs, verify the change, and take the repaired file away. Target a complete two-minute demo rather than a generic chatbot.

## Acceptance criteria
1. On first open, load an original Midnight Museum demo with deliberate, reproducible issues. No claim of an already-completed audit before the preview document is loaded.
2. Allow pasting or importing an HTML file up to 500 KB. Reject an empty input and oversize files with visible messages. Explain that scripts and remote assets are excluded in this self-contained workshop.
3. Sanitize input using local DOMPurify. Render in sandbox='allow-same-origin' without allow-scripts. Insert CSP default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none'. Never execute imported script or send uploaded content to any server.
4. Audit eight focused categories: page language; page title; image text alternatives; form-control labels; button accessible names; link accessible names; heading-level skips; readable text contrast on supported solid backgrounds. Run against the rendered preview DOM and computed styles. Ignore nonrendered, aria-hidden, inert and hidden content where appropriate. Do not label automated checks as comprehensive accessibility.
5. Valid alt='' is not a missing-alt finding. Labels may come from a nonempty label, aria-label, or valid aria-labelledby. Placeholder alone is not a label. Accessible names should support nested image alternatives and SVG title where feasible. Do not flag form controls such as type=hidden, submit with a usable value, or decorated hidden icons falsely.
6. Contrast uses WCAG relative luminance, 4.5:1 for normal text, 3:1 for large text at >=24 CSS px or >=18.667 CSS px with weight>=700. For gradients, images, unsupported colors, opacity or other unresolvable backgrounds, do not invent a ratio: report manual contrast review. Handle solid ancestor backgrounds and alpha colors correctly where supported. Large headings with sufficient large-text contrast pass.
7. The user chooses a finding to see why it matters, its element excerpt, and a repair form. Require user-authored alt/label/name/title text. Allow explicit decorative image and language input. Offer changing a skipped heading level and improving foreground contrast with computed black/white recommendation. Never apply every repair silently.
8. After applying a repair, rerun checks, announce the result, update counts from actual findings, retain baseline for comparison, and support undo. Issue identity must be stable across re-audits; repeated repair operations must not create duplicate labels or IDs.
9. Provide Inspect, Compare (before/after), and Source views. Export repaired HTML and a JSON report including original and current findings, repair log, manual-review completion and limitations. Strip internal data-gl-id attributes from exports. No score or compliance certificate.
10. Human-review checklist covers keyboard journey, screen-reader meaning, meaningful alt/labels and zoom/reflow. Completing it never erases automated failures. Resetting demo clears prior repairs and review state; importing a new file resets the baseline.
11. Responsive layout works at desktop and 390 px width. All app actions work by keyboard, errors/status are announced, focus remains useful, and reduced-motion is respected.
12. Keep .kiro at repo root, include MIT license for original code and DOMPurify's license alongside its vendored distribution, setup instructions, known limits, and truthful Kiro usage evidence.

