---
inclusion: always
---
# Ghostlight

Ghostlight is a browser-local accessibility repair workshop for makers of small HTML pages. It belongs to the Kiroween 2026 Costume Contest category. A spooky visual metaphor identifies barriers as ghosts, and repairing them restores access. Accessibility takes priority over decoration.

Use plain HTML, CSS and browser JavaScript modules in dist/. No server-side user processing, API keys, user accounts, paid services or external network requests for uploaded content. DOMPurify is vendored. No framework or build step is needed. Use Node's built-in test runner for pure functions, with browser QA for document behaviour.

Never claim WCAG certification or comprehensive accessibility. State the exact focused checks supported and distinguish automated findings from human review. Never invent alternative text, form-label meaning, or user intent: ask the user to supply meaningful text. Empty image alt is valid only after the user explicitly chooses decorative.

Preview user HTML in a sandboxed iframe without script permission, under a restrictive CSP. Sanitize before rendering. Block remote asset loading, scripts, nested frames, events, forms submitting, and navigation. Export the sanitized repaired HTML with its safety restrictions explained.

Use keyboard-accessible controls, visible focus, polite announcements, reduced-motion support, and readable contrast in Ghostlight itself. Preserve real before/after counts, provide undo, avoid fake scores, and provide reproducible demo content.

Kiro contribution records must be factual. Codex prepared the initial scope and shell. Record actual Kiro code work and checks separately. Do not claim hooks, agents, MCP, or property-based testing were used unless they really were.

