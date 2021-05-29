import { compile } from '../compile';
import { transformerCompilers } from '@tsx-air/compilers';
import { kebabCase } from 'lodash';

const files: string[] = [];
let compiler = 'ast';
let out = 'src.js';
let error;
let log = false;

const parsArgs = () => {
    for (let i = 2; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case '-c':
            case '--compiler':
                compiler = process.argv[++i];
                break;
            case '-o':
            case '--outDir':
                out = process.argv[++i];
                break;
            case '-l':
            case '--log':
                log = true;
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
const cmp = transformerCompilers.find(c => kebabCase(c.label).startsWith(compiler));
if (files.length && cmp && out && !error) {
    compile(files, cmp, out, log);
} else {
    if (error) {
        console.log(error, '\n');
    }
    if (!cmp) {
        console.log(`Missing compiler ${compiler}`);
    }
    console.log(`Usage: tsx SOURCE... [-co]
    -c --compiler ${transformerCompilers.map(c => kebabCase(c.label)).join('|')}
    -o --outDir DEST
    -l --log log compilation graph to db
    `);
}
