const {compile} = require('svelte/compiler');
const { readFileSync } = require('fs');
const raw = readFileSync('./src/App.svelte', {encoding:'utf8'} );
const compiled = compile( raw, {
    dev: true,
    // generate: 'ssr',
    hydratable: true
} );
console.log(compiled.js.code);