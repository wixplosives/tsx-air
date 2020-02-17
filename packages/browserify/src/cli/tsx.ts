import { compile } from '../compile';
import { compilers } from 'packages/playground/src/compilers';
import { kebabCase } from 'lodash';

const files: string[] = [];
let compiler = 'ast';
let out = 'src.js';
let error;

// tslint:disable: no-console
const parsArgs = () => {
    console.log(process.argv.slice(2));
    for (let i = 2; i < process.argv.length; i++) {
        console.log(process.argv[i]);

        switch (process.argv[i]) {
            case '-c':
            case '--compiler':
                compiler = process.argv[++i];
                break;
            case '-o':
            case '--outDir':
                out = process.argv[++i];
                break;
            default:
                if (process.argv[i].startsWith('-')) {
                    error = ('Invalid option: ${process.argv[i]}');
                    return;
                }
                files.push(process.argv[i]);
        }
    }
};

parsArgs();
const cmp = compilers.find(c => kebabCase(c.label).startsWith(compiler));
if (files.length && cmp && out && !error) {
    compile(files, cmp, out);
} else {
    if (error) {
        console.log(error, '\n');
    }
    if (!cmp) {
        console.log(`Missing compiler ${compiler}`);
    }
    console.log(`Usage: tsx SOURCE... [-co]
    -c --compiler ${compilers.map(c => kebabCase(c.label)).join('|')}
    -o --outDir DEST`);
}
