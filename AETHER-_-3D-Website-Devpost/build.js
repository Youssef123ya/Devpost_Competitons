/* =============================================================
   ÆTHER — build

   Inlines css/ and js/ into single self-contained files:

     dist/index.html    a complete page; drop it on any static
                        host and the site is live
     dist/artifact.html the same page as a body-only fragment,
                        for hosts that supply their own
                        <!doctype>/<head>/<body> wrapper

   Both pull three.js from cdnjs instead of vendor/, so each
   file stands entirely on its own.

     node build.js
   ============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js';
const SCRIPTS = ['utils', 'forms', 'shaders', 'post', 'audio', 'app'];

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const html = read('index.html');
const css = read('css/style.css');
const js = SCRIPTS.map((n) => {
  return '/* ---- js/' + n + '.js ---- */\n' + read('js/' + n + '.js');
}).join('\n\n');

/* the <body> contents of the source page, minus its script tags */
const body = html
  .slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  .replace(/^<body[^>]*>/, '')
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .trim();

/* index.html carries class="locked" on <body>; in the fragment build we
   cannot set it there, so hand it to the document at parse time. */
const LOCK = '<script>document.body.classList.add("locked");</script>';

/* pull the <title>, description, favicon and font link straight out of the
   source page, so the bundles never drift from it */
const pick = (re) => (html.match(re) || [''])[0];

const head = `${pick(/<title>[\s\S]*?<\/title>/)}
${pick(/<meta name="description"[^>]*>/)}
${pick(/<link rel="icon"[^>]*>/)}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${pick(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/)}
<style>
${css}
</style>`;

const tail = `<script src="${THREE_CDN}"></script>
<script>
${js}
</script>`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });

/* ---- 1. complete standalone page ---- */
const standalone = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body class="locked">
${body}
${tail}
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), standalone, 'utf8');

/* ---- 2. body-only fragment ---- */
const fragment = `${head}
${body}
${LOCK}
${tail}
`;
fs.writeFileSync(path.join(ROOT, 'dist/artifact.html'), fragment, 'utf8');

const kb = (s) => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1) + ' kB';
console.log('dist/index.html    ' + kb(standalone));
console.log('dist/artifact.html ' + kb(fragment));
