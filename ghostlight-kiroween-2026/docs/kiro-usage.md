# Kiro usage — evidence log

This file records actual work, not planned features.

## Preparation
Codex helped review the official Kiroween requirements, scope Ghostlight, and prepare the .kiro requirements, design, tasks and steering documents. The participant selected the concept. Codex prepared the initial UI shell and hosting configuration.

## Kiro implementation
On November 2, 2026, the participant signed in to the official Kiro CLI 2.37.1 with Google. Kiro read the requirements, design and tasks files, then generated dist/color.js, dist/audit.js, tests/color.test.js and an initial audit test file. The session used Kiro's default model selection; no model choice is claimed. Kiro ran the initial tests and started correcting failures, then the service returned a throttling error before a completed test pass. The private execution log is retained locally in work/kiro-implementation.log and excluded from source publication.

Codex then reviewed the generated code and browser behaviour. Corrections included compositing alpha text/background layers, reporting gradients and ancestor opacity for human review, excluding hidden descendants from names, input button values and image-button names, meaningful versus explicitly decorative image repair, SVG ARIA naming, wrapping labels and duplicate IDs, and single-doctype serialization with preserved SVG namespaces. The initial synthetic DOM shim tests were replaced with tests using Happy DOM. One incorrect gray-background expected value in the Kiro-authored color tests was corrected based on the actual contrast calculation. The resulting tests and end-to-end demo flow pass.

Kiro's actual contribution was the initial substantive audit/repair implementation and color utilities/test suite. Codex supplied product planning, UI, sanitizer integration, source/export workflow, verification and the reviewed corrections. This distinction is intentional and should remain in the submission write-up.

## Other Kiro features
No use of custom agents, hooks, MCP or property-based testing has been claimed. Add such claims only with actual evidence.

