import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/vendor',{recursive:true});
await copyFile('node_modules/dompurify/dist/purify.min.js','dist/vendor/purify.min.js');
await copyFile('node_modules/dompurify/LICENSE','dist/vendor/DOMPurify-LICENSE.txt');
console.log('Vendored DOMPurify and its license.');

