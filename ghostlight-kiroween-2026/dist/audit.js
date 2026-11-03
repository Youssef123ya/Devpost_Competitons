/**
 * dist/audit.js — Accessibility audit and repair engine for Ghostlight
 *
 * Exported API (matched by design.md):
 *   auditDocument(doc)              → {issues, manualWarnings, checksRun:8}
 *   repairIssue(doc, issue, value)  → void  (throws on invalid input)
 *   serializeDocument(doc)          → string (doctype + clean HTML)
 *
 * Audit categories (kind values):
 *   lang, title, alt, label, button-name, link-name, heading, contrast
 *
 * Limitations:
 *  - Runs against the rendered same-origin iframe document via
 *    doc.defaultView.getComputedStyle. No scripts are injected.
 *  - Contrast checks resolve supported solid-color layers; complex rendering
 *    is reported for manual review.
 *  - aria-labelledby resolution is single-level (no recursive labelling).
 *  - display:none, visibility:hidden, aria-hidden="true", and inert
 *    elements are skipped for all checks.
 *  - CSS clip/absolute-position based visual hiding is not detected.
 */

import { parseColor, contrastRatio, recommendTextColor } from './color.js';

// ---------------------------------------------------------------------------
// Node ID management
// ---------------------------------------------------------------------------

let _idCounter = 0;

/**
 * Assign a stable data-gl-id to an element if it doesn't have one already.
 * @param {Element} el
 * @returns {string}
 */
function _assignId(el) {
  if (!el.hasAttribute('data-gl-id')) {
    _idCounter++;
    el.setAttribute('data-gl-id', `gl-${_idCounter}`);
  }
  return el.getAttribute('data-gl-id');
}

// ---------------------------------------------------------------------------
// Visibility helpers
// ---------------------------------------------------------------------------

/**
 * Return true if the element (or an ancestor) is hidden from the
 * accessibility tree or not rendered.
 * We rely on getComputedStyle from the document's own view.
 * @param {Element} el
 * @param {Document} doc
 * @returns {boolean}
 */
function _isHidden(el, doc) {
  const view = doc.defaultView;
  if (!view) return false;
  let node = el;
  while (node) {
    if (node.nodeType !== 1) { node = node.parentElement; continue; }
    // aria-hidden="true"
    if (node.getAttribute('aria-hidden') === 'true') return true;
    // inert attribute
    if (node.hasAttribute('inert')) return true;
    const cs = view.getComputedStyle(node);
    if (cs.display === 'none') return true;
    if (node === el && ['hidden','collapse'].includes(cs.visibility)) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Return true if element is hidden from the accessibility tree via
 * aria-hidden="true" or inert on self or ancestor (but NOT just
 * display:none, which still matters for some checks such as alt).
 */
function _isAriaHidden(el) {
  let node = el;
  while (node && node.nodeType === 1) {
    if (node.getAttribute('aria-hidden') === 'true') return true;
    if (node.hasAttribute('inert')) return true;
    node = node.parentElement;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Accessible name helpers
// ---------------------------------------------------------------------------

/**
 * Get the accessible name for an element using the subset we support:
 * aria-label > aria-labelledby > content text (for buttons/links).
 * Returns '' if none found.
 * @param {Element} el
 * @param {Document} doc
 * @returns {string}
 */
function _accessibleName(el, doc) {
  // aria-labelledby (single-level resolution)
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby && labelledby.trim()) {
    const ids = labelledby.trim().split(/\s+/);
    const parts = ids.map(id => {
      const ref = doc.getElementById(id);
      return ref ? _textContent(ref, true) : '';
    });
    const name = parts.join(' ').trim();
    if (name) return name;
  }

  // aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  // title attribute
  const title = el.getAttribute('title');
  if (title && title.trim()) return title.trim();

  return '';
}

/**
 * Recursively extract text content from an element, including:
 * - img alt text (for nested images in buttons/links)
 * - SVG <title> text
 * @param {Element} el
 * @returns {string}
 */
function _textContent(el, includeHidden = false) {
  let text = '';
  for (const child of el.childNodes) {
    if (child.nodeType === 3) {
      // Text node
      text += child.textContent;
    } else if (child.nodeType === 1) {
      if (!includeHidden && _isHidden(child, child.ownerDocument)) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === 'img') {
        const alt = child.getAttribute('alt');
        if (alt !== null) {
          // alt="" is valid decorative (contributes nothing)
          text += alt;
        }
        // img without alt attribute — contributes nothing to text content
      } else if (tag === 'svg') {
        // Look for <title> child of svg
        const svgTitle = child.querySelector('title');
        if (svgTitle) text += svgTitle.textContent;
        // aria-label on svg
        const svgLabel = child.getAttribute('aria-label');
        if (svgLabel) text += svgLabel;
      } else if (tag === 'script' || tag === 'style') {
        // skip
      } else {
        text += _textContent(child, includeHidden);
      }
    }
  }
  return text;
}

/**
 * Get a short HTML snippet showing the opening tag of an element.
 * @param {Element} el
 * @returns {string}
 */
function _snippet(el) {
  const outer = el.outerHTML || '';
  // Return opening tag + up to 120 chars
  const firstClose = outer.indexOf('>');
  if (firstClose === -1) return outer.slice(0, 120);
  let tag = outer.slice(0, firstClose + 1);
  if (tag.length > 120) tag = tag.slice(0, 117) + '…>';
  return tag;
}

// ---------------------------------------------------------------------------
// Contrast helpers
// ---------------------------------------------------------------------------

/**
 * Large text threshold per WCAG 2.1:
 * ≥24px normal weight, or ≥18.667px at weight ≥700.
 * @param {CSSStyleDeclaration} cs
 * @returns {boolean}
 */
function _isLargeText(cs) {
  const size = parseFloat(cs.fontSize) || 0;
  const weight = parseInt(cs.fontWeight, 10) || 400;
  if (size >= 24) return true;
  if (size >= 18.667 && weight >= 700) return true;
  return false;
}

/**
 * Attempt to resolve the effective background color for contrast checking.
 * Returns {color: string, resolved: boolean, reason?: string}.
 * @param {Element} el
 * @param {Document} doc
 * @returns {{color:string|null, resolved:boolean, reason?:string}}
 */
function _resolveBackground(el, doc) {
  const view = doc.defaultView;
  if (!view) return {resolved:false,reason:'no rendered document view'};
  // Opacity and filters affect descendants even when a closer background is opaque.
  for (let node=el;node;node=node.parentElement) {
    const cs=view.getComputedStyle(node);
    if ((cs.opacity && Number(cs.opacity)<1) ||
        (cs.filter && cs.filter!=='none') ||
        (cs.mixBlendMode && cs.mixBlendMode!=='normal'))
      return {resolved:false,reason:'ancestor opacity, filter or blending'};
  }
  const layers=[];
  let opaque=false;
  for (let node=el;node;node=node.parentElement) {
    const cs=view.getComputedStyle(node);
    if (cs.backgroundImage && !['none','initial','unset'].includes(cs.backgroundImage))
      return {resolved:false,reason:'gradient or image background'};
    const color=parseColor(cs.backgroundColor || 'transparent');
    if (!color) return {resolved:false,reason:'unsupported background color'};
    layers.push(color);
    if (color.a===1) {opaque=true;break;}
  }
  if (!opaque && /dark/.test(view.getComputedStyle(doc.documentElement).colorScheme || ''))
    return {resolved:false,reason:'unknown dark canvas background'};
  let base={r:255,g:255,b:255};
  for(const layer of layers.reverse())
    base={r:layer.r*layer.a+base.r*(1-layer.a),g:layer.g*layer.a+base.g*(1-layer.a),b:layer.b*layer.a+base.b*(1-layer.a)};
  return {resolved:true,color:`rgb(${base.r},${base.g},${base.b})`};
}

// ---------------------------------------------------------------------------
// auditDocument — main entry point
// ---------------------------------------------------------------------------

/**
 * Audit a rendered document for eight accessibility categories.
 * @param {Document} doc - The iframe's contentDocument (same-origin).
 * @returns {{issues: Issue[], manualWarnings: string[], checksRun: 8}}
 */
export function auditDocument(doc) {
  // Reset counter only when no gl-ids exist yet (fresh audit on new document).
  const existingIds = doc.querySelectorAll('[data-gl-id]');
  if (existingIds.length === 0) {
    _idCounter = 0;
  }

  const issues = [];
  const manualWarnings = [];

  _checkLang(doc, issues);
  _checkTitle(doc, issues);
  _checkAlt(doc, issues, manualWarnings);
  _checkLabels(doc, issues);
  _checkButtonNames(doc, issues);
  _checkLinkNames(doc, issues);
  _checkHeadings(doc, issues);
  _checkContrast(doc, issues, manualWarnings);

  return { issues, manualWarnings, checksRun: 8 };
}

// ---------------------------------------------------------------------------
// Check 1: Page language
// ---------------------------------------------------------------------------
function _checkLang(doc, issues) {
  const html = doc.documentElement;
  const lang = html.getAttribute('lang');
  if (!lang || !lang.trim()) {
    const nodeId = _assignId(html);
    issues.push({
      key: `lang:${nodeId}`,
      nodeId,
      kind: 'lang',
      severity: 'serious',
      title: 'Page language not set',
      description:
        'The <html> element is missing a lang attribute. Screen readers use ' +
        'the page language to choose the correct speech rules and pronunciations.',
      snippet: _snippet(html),
      suggestion: 'en',
    });
  }
}

// ---------------------------------------------------------------------------
// Check 2: Page title
// ---------------------------------------------------------------------------
function _checkTitle(doc, issues) {
  const titleEl = doc.querySelector('title');
  const titleText = titleEl ? titleEl.textContent.trim() : '';
  if (!titleText) {
    // Assign ID to <head> as a proxy (title may not exist)
    const head = doc.head || doc.documentElement;
    const nodeId = _assignId(head);
    issues.push({
      key: `title:${nodeId}`,
      nodeId,
      kind: 'title',
      severity: 'serious',
      title: 'Page title is missing or empty',
      description:
        'Every page needs a descriptive <title>. It is the first thing ' +
        'announced by screen readers and appears in browser tabs and history.',
      snippet: titleEl ? _snippet(titleEl) : '<title> (missing)</title>',
      suggestion: '',
    });
  }
}

// ---------------------------------------------------------------------------
// Check 3: Image alternatives
// ---------------------------------------------------------------------------
function _checkAlt(doc, issues, manualWarnings) {
  const images = doc.querySelectorAll('img');
  for (const img of images) {
    if (_isHidden(img, doc)) continue;

    const alt = img.getAttribute('alt');

    if (alt === null) {
      // No alt attribute at all — missing
      const nodeId = _assignId(img);
      issues.push({
        key: `alt:${nodeId}`,
        nodeId,
        kind: 'alt',
        severity: 'serious',
        title: 'Image is missing an alt attribute',
        description:
          'Images must have an alt attribute. Use alt="" for decorative images ' +
          'or provide meaningful alternative text that conveys the same information.',
        snippet: _snippet(img),
        suggestion: '',
      });
    }
    // alt="" is valid decorative — no issue raised (per requirements §5).
    // Non-empty alt is user-supplied meaningful text — no issue raised.
  }

  // SVG images without accessible name
  const svgs = doc.querySelectorAll('svg');
  for (const svg of svgs) {
    if (_isHidden(svg, doc)) continue;
    // Skip purely decorative svg marked aria-hidden
    if (svg.getAttribute('aria-hidden') === 'true') continue;
    // Role="img" SVGs need an accessible name
    if (svg.getAttribute('role') === 'img') {
      const name = _accessibleName(svg, doc);
      const svgTitle = svg.querySelector('title');
      const hasName = name || (svgTitle && svgTitle.textContent.trim());
      if (!hasName) {
        const nodeId = _assignId(svg);
        issues.push({
          key: `alt:${nodeId}`,
          nodeId,
          kind: 'alt',
          severity: 'serious',
          title: 'SVG image is missing an accessible name',
          description:
            'This SVG has role="img" but no accessible name. ' +
            'Add aria-label or a <title> child element.',
          snippet: _snippet(svg),
          suggestion: '',
        });
      }
    }
  }

  manualWarnings.push(
    'Images with non-empty alt text: automated tools cannot judge whether ' +
    'the description is meaningful. Review each image\'s alternative text.'
  );
}

// ---------------------------------------------------------------------------
// Check 4: Form-control labels
// ---------------------------------------------------------------------------
function _checkLabels(doc, issues) {
  // Labellable inputs (exclude hidden, submit, button, reset, image)
  const UNLABELLABLE = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
  const controls = doc.querySelectorAll('input, select, textarea');

  for (const ctrl of controls) {
    if (_isHidden(ctrl, doc)) continue;

    const type = (ctrl.getAttribute('type') || 'text').toLowerCase();
    if (ctrl.tagName.toLowerCase() === 'input' && UNLABELLABLE.has(type)) continue;

    // Check accessible name
    const name = _accessibleName(ctrl, doc);
    if (name) continue;

    // Check for <label> element associated via for= or wrapping
    const id = ctrl.id;
    let labelFound = false;
    if (id) {
      labelFound = Array.from(doc.querySelectorAll('label')).some(label => label.htmlFor === id && _textContent(label).trim());
    }
    if (!labelFound) {
      // Check if wrapped in a <label>
      let ancestor = ctrl.parentElement;
      while (ancestor) {
        if (ancestor.tagName.toLowerCase() === 'label') {
          if (_textContent(ancestor).replace(_textContent(ctrl), '').trim()) {
            labelFound = true;
          }
          break;
        }
        ancestor = ancestor.parentElement;
      }
    }

    // Check placeholder — placeholder alone is NOT a label
    if (!labelFound) {
      const nodeId = _assignId(ctrl);
      const hasPlaceholder = ctrl.hasAttribute('placeholder');
      issues.push({
        key: `label:${nodeId}`,
        nodeId,
        kind: 'label',
        severity: 'serious',
        title: `Form control has no label${hasPlaceholder ? ' (placeholder is not a label)' : ''}`,
        description:
          'This form control has no programmatic label. ' +
          'Screen readers will not identify its purpose. ' +
          (hasPlaceholder
            ? 'The placeholder attribute is not a substitute for a label — ' +
              'it disappears on input and is not reliably announced. '
            : '') +
          'Add a <label> element, aria-label, or aria-labelledby.',
        snippet: _snippet(ctrl),
        suggestion: '',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Check 5: Button accessible names
// ---------------------------------------------------------------------------
function _checkButtonNames(doc, issues) {
  const buttons = doc.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], input[type="image"]');

  for (const btn of buttons) {
    if (_isHidden(btn, doc)) continue;
    if (_isAriaHidden(btn)) continue;

    const tag = btn.tagName.toLowerCase();
    const type = (btn.getAttribute('type') || '').toLowerCase();

    // input[type=submit] with no value has default browser-supplied "Submit"
    // which is not a failure per requirements §5 ("submit with a usable value")
    if (tag === 'input' && (type === 'submit' || type === 'reset')) {
      const value = btn.getAttribute('value');
      // value="" is empty; no value = browser default (acceptable)
      if (value === null || value.trim()) continue;
      // value="" explicitly cleared — flag it
    }

    const name = _accessibleName(btn, doc);
    const textName = _textContent(btn).trim();
    const hasName = name || textName || (tag === 'input' && type === 'button' ? btn.value.trim() : '') || (tag === 'input' && type === 'image' ? (btn.getAttribute('alt') || '').trim() : '');

    if (!hasName) {
      const nodeId = _assignId(btn);
      issues.push({
        key: `button-name:${nodeId}`,
        nodeId,
        kind: 'button-name',
        severity: 'serious',
        title: 'Button has no accessible name',
        description:
          'This button has no visible text, aria-label, or other accessible ' +
          'name. Screen reader users will not know what it does.',
        snippet: _snippet(btn),
        suggestion: '',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Check 6: Link accessible names
// ---------------------------------------------------------------------------
function _checkLinkNames(doc, issues) {
  const links = doc.querySelectorAll('a[href], [role="link"]');

  for (const link of links) {
    if (_isHidden(link, doc)) continue;
    if (_isAriaHidden(link)) continue;

    const name = _accessibleName(link, doc);
    const textName = _textContent(link).trim();
    const hasName = name || textName;

    if (!hasName) {
      const nodeId = _assignId(link);
      issues.push({
        key: `link-name:${nodeId}`,
        nodeId,
        kind: 'link-name',
        severity: 'serious',
        title: 'Link has no accessible name',
        description:
          'This link has no visible text, aria-label, or other accessible ' +
          'name. Screen reader users will not know its destination or purpose.',
        snippet: _snippet(link),
        suggestion: '',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7: Heading level skips
// ---------------------------------------------------------------------------
function _checkHeadings(doc, issues) {
  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    .filter(h => !_isHidden(h, doc));

  if (headings.length === 0) return;

  let prevLevel = 0;

  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      const nodeId = _assignId(h);
      // Suggest the next valid level
      const suggested = `h${prevLevel + 1}`;
      issues.push({
        key: `heading:${nodeId}`,
        nodeId,
        kind: 'heading',
        severity: 'moderate',
        title: `Heading level skipped (h${prevLevel} → h${level})`,
        description:
          `This heading jumps from level ${prevLevel} to level ${level}, ` +
          'skipping a level. Heading levels should form a logical hierarchy ' +
          'without skipping steps, so screen reader users can navigate predictably.',
        snippet: _snippet(h),
        suggestion: suggested,
        details: { currentLevel: `h${level}`, previousLevel: `h${prevLevel}` },
      });
    }
    prevLevel = level;
  }
}

// ---------------------------------------------------------------------------
// Check 8: Text contrast
// ---------------------------------------------------------------------------
function _checkContrast(doc, issues, manualWarnings) {
  const view = doc.defaultView;
  if (!view) {
    manualWarnings.push('Contrast check skipped: no document view available.');
    return;
  }

  const skippedReasons = new Set();

  // We use TreeWalker to visit text-containing elements
  const walker = doc.createTreeWalker(doc.body || doc.documentElement, 1 /* SHOW_ELEMENT */);

  const checked = new Set();

  let node = walker.currentNode;
  while (node) {
    const el = /** @type {Element} */ (node);
    node = walker.nextNode();

    if (_isHidden(el, doc)) continue;

    const tag = el.tagName.toLowerCase();
    if (el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      if (tag === 'text') skippedReasons.add('SVG text fill requires manual contrast review.');
      continue;
    }
    if (['script','style','noscript','template'].includes(tag)) continue;

    // Skip if element has no direct text content
    let hasDirectText = false;
    for (const child of el.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim()) {
        hasDirectText = true;
        break;
      }
    }
    if (!hasDirectText) continue;

    // Avoid auditing the same element twice
    if (checked.has(el)) continue;
    checked.add(el);

    const cs = view.getComputedStyle(el);
    const fgColor = cs.color;

    if (!fgColor) continue;

    // Parse foreground
    const fgParsed = parseColor(fgColor);
    if (!fgParsed) {
      skippedReasons.add(`Unsupported foreground color format: ${fgColor}`);
      continue;
    }

    // Detect opacity on element (CSS opacity, not alpha)
    const opacity = parseFloat(cs.opacity);
    if (!isNaN(opacity) && opacity < 1) {
      skippedReasons.add(
        'Element with CSS opacity < 1: contrast cannot be reliably resolved ' +
        '(affected text requires manual review).'
      );
      continue;
    }

    // Resolve background
    const bgResult = _resolveBackground(el, doc);
    if (!bgResult.resolved) {
      skippedReasons.add(
        bgResult.reason
          ? `Background not resolvable (${bgResult.reason}): manual contrast review needed.`
          : 'Background not resolvable: manual contrast review needed.'
      );
      continue;
    }

    const bgColor = bgResult.color;
    const bgParsed = parseColor(bgColor);
    if (!bgParsed) {
      skippedReasons.add(`Unsupported background color format: ${bgColor}`);
      continue;
    }

    // Compute luminance values
    const ratio = contrastRatio(fgColor, bgColor);
    if (ratio === null) { skippedReasons.add('Unsupported color composition: manual review needed.'); continue; }

    const isLarge = _isLargeText(cs);
    const threshold = isLarge ? 3.0 : 4.5;

    if (ratio < threshold) {
      const nodeId = _assignId(el);
      const recommend = recommendTextColor(bgColor);
      issues.push({
        key: `contrast:${nodeId}`,
        nodeId,
        kind: 'contrast',
        severity: 'serious',
        title: `Insufficient text contrast (${ratio.toFixed(2)}:1, need ${threshold}:1)`,
        description:
          `The contrast ratio between the text color and background is ` +
          `${ratio.toFixed(2)}:1, below the WCAG 2.1 minimum of ${threshold}:1 ` +
          `for ${isLarge ? 'large' : 'normal'} text. ` +
          `Improving contrast makes text readable for people with low vision.`,
        snippet: _snippet(el),
        suggestion: recommend,
        details: {
          ratio: parseFloat(ratio.toFixed(2)),
          threshold,
          currentFg: fgColor,
          currentBg: bgColor,
          isLargeText: isLarge,
        },
      });
    }
  }

  if (skippedReasons.size > 0) {
    for (const reason of skippedReasons) {
      manualWarnings.push(`Contrast check limitation: ${reason}`);
    }
  }

  manualWarnings.push(
    'Contrast check covers solid, resolvable backgrounds only. ' +
    'Gradient, image, pattern, or complex multi-layer backgrounds require manual review. ' +
    'Also review form-control values, placeholders, generated content and non-text contrast manually.'
  );
}

// ---------------------------------------------------------------------------
// repairIssue(doc, issue, value) — apply one user-directed repair
// ---------------------------------------------------------------------------

/**
 * @param {Document} doc
 * @param {{key:string, nodeId:string, kind:string, suggestion?:string, details?:object}} issue
 * @param {string|{decorative:true}} value
 */
export function repairIssue(doc, issue, value) {
  if (!issue || !issue.kind || !issue.nodeId) {
    throw new Error('repairIssue: issue object is missing required fields (kind, nodeId).');
  }

  const { kind, nodeId } = issue;

  // Locate the node
  const el = Array.from(doc.querySelectorAll('[data-gl-id]')).find(node => node.getAttribute('data-gl-id') === nodeId);
  if (!el) {
    throw new Error(
      `repairIssue: element with data-gl-id="${nodeId}" not found. ` +
      'The document may have been reloaded. Re-run the audit before repairing.'
    );
  }

  switch (kind) {
    case 'lang': {
      const langValue = typeof value === 'string' ? value.trim() : '';
      if (!langValue) {
        throw new Error(
          'repairIssue: lang value must be a non-empty BCP 47 language tag (e.g. "en", "fr", "es").'
        );
      }
      try { Intl.getCanonicalLocales(langValue); } catch { throw new Error('Enter a valid language tag, such as en, ar or en-GB.'); }
      el.setAttribute('lang', langValue);
      break;
    }

    case 'title': {
      const titleText = typeof value === 'string' ? value.trim() : '';
      if (!titleText) {
        throw new Error('repairIssue: title value must be a non-empty string describing the page.');
      }
      // el is <head> or <html> depending on what was assigned
      let titleEl = doc.querySelector('title');
      if (!titleEl) {
        titleEl = doc.createElement('title');
        const head = doc.head || doc.querySelector('head') || doc.documentElement;
        head.insertBefore(titleEl, head.firstChild);
      }
      titleEl.textContent = titleText;
      break;
    }

    case 'alt': {
      const svg = el.tagName.toLowerCase() === 'svg';
      if (typeof value === 'object' && value !== null && value.decorative === true) {
        if (svg) el.setAttribute('aria-hidden', 'true');
        else el.setAttribute('alt', '');
      } else {
        const altText = typeof value === 'string' ? value.trim() : '';
        if (!altText) throw new Error('Describe the image, or explicitly mark it as purely decorative.');
        el.setAttribute(svg ? 'aria-label' : 'alt', altText);
      }
      break;
    }

    case 'label': {
      const labelText = typeof value === 'string' ? value.trim() : '';
      if (!labelText) {
        throw new Error('repairIssue: label value must be a non-empty string describing the control\'s purpose.');
      }
      // If the control already has an id, use it; otherwise generate one.
      let controlId = el.id;
      if (!controlId || Array.from(doc.querySelectorAll('[id]')).filter(node=>node.id===controlId).length > 1) {
        controlId = _generateUniqueId(doc, 'gl-ctrl');
        el.id = controlId;
      }
      // Check if a label for this id already exists (idempotent repair)
      const existingLabel = Array.from(doc.querySelectorAll('label')).find(label=>label.htmlFor===controlId) || el.closest('label');
      if (existingLabel) {
        if (existingLabel.contains(el)) {
          const textNode=Array.from(existingLabel.childNodes).find(node=>node.nodeType===3);
          if(textNode) textNode.textContent=labelText+' ';
          else existingLabel.insertBefore(doc.createTextNode(labelText+' '),existingLabel.firstChild);
        } else existingLabel.textContent = labelText;
      } else {
        const label = doc.createElement('label');
        label.setAttribute('for', controlId);
        label.textContent = labelText;
        el.parentNode.insertBefore(label, el);
      }
      break;
    }

    case 'button-name': {
      const nameText = typeof value === 'string' ? value.trim() : '';
      if (!nameText) {
        throw new Error('repairIssue: button name must be a non-empty string describing the button\'s action.');
      }
      // Prefer aria-label for icon buttons (keeps visual appearance unchanged)
      el.setAttribute('aria-label', nameText);
      break;
    }

    case 'link-name': {
      const nameText = typeof value === 'string' ? value.trim() : '';
      if (!nameText) {
        throw new Error('repairIssue: link name must be a non-empty string describing the link\'s destination or purpose.');
      }
      el.setAttribute('aria-label', nameText);
      break;
    }

    case 'heading': {
      const suggested = issue.suggestion || '';
      const headingValue = typeof value === 'string' ? value.trim().toLowerCase() : '';
      // Accept the suggested heading level only
      if (!/^h[1-6]$/.test(headingValue)) {
        throw new Error(
          `repairIssue: heading value must be h1–h6 (e.g. "${suggested || 'h2'}"). ` +
          `Received: "${headingValue}".`
        );
      }
      // Change the tag: create new element, copy attributes/children
      const newTag = headingValue;
      const newEl = doc.createElement(newTag);
      // Copy attributes
      for (const attr of Array.from(el.attributes)) {
        newEl.setAttribute(attr.name, attr.value);
      }
      // Move children
      while (el.firstChild) {
        newEl.appendChild(el.firstChild);
      }
      el.parentNode.replaceChild(newEl, el);
      // Update the data-gl-id on the new element so nodeId remains valid
      newEl.setAttribute('data-gl-id', nodeId);
      break;
    }

    case 'contrast': {
      const colorValue = typeof value === 'string' ? value.trim() : '';
      if (!['#000000','#ffffff'].includes(colorValue.toLowerCase())) {
        throw new Error(
          `repairIssue: contrast value must be a CSS hex color (e.g. "#000000" or "#ffffff"). ` +
          `Received: "${colorValue}".`
        );
      }
      const color = colorValue || issue.suggestion || '#000000';
      el.style.setProperty('color', color, 'important');
      break;
    }

    default:
      throw new Error(
        `repairIssue: unsupported issue kind "${kind}". ` +
        'Supported kinds: lang, title, alt, label, button-name, link-name, heading, contrast.'
      );
  }
}

// ---------------------------------------------------------------------------
// serializeDocument(doc) — export clean HTML without data-gl-id attributes
// ---------------------------------------------------------------------------

/**
 * Returns a doctype + full HTML string with all data-gl-id attributes removed.
 * Does not execute any scripts (works on the static DOM tree).
 * @param {Document} doc
 * @returns {string}
 */
export function serializeDocument(doc) {
  // Clone so we don't mutate the live document
  const clone = doc.cloneNode(true);

  // Strip all data-gl-id attributes from the clone
  const withIds = clone.querySelectorAll('[data-gl-id]');
  for (const el of withIds) {
    el.removeAttribute('data-gl-id');
  }

  // Build doctype string
  let doctype = '';
  if (doc.doctype) {
    const dt = doc.doctype;
    doctype = `<!doctype ${dt.name}`;
    if (dt.publicId) doctype += ` public "${dt.publicId}"`;
    if (dt.systemId) doctype += ` "${dt.systemId}"`;
    doctype += '>';
  } else {
    doctype = '<!doctype html>';
  }

  // Serialize the cloned document
  return `${doctype}\n${clone.documentElement.outerHTML}`;
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/**
 * Generate an ID that doesn't already exist in the document.
 * Avoids creating invalid selectors from user content.
 * @param {Document} doc
 * @param {string} prefix
 * @returns {string}
 */
function _generateUniqueId(doc, prefix) {
  let i = 1;
  // Use numeric suffix only — safe CSS identifier
  while (doc.getElementById(`${prefix}-${i}`)) {
    i++;
  }
  return `${prefix}-${i}`;
}
