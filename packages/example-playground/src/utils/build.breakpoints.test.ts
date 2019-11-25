import { injectSnippets } from './build.helpers';
import { createMemoryFs } from '@file-services/memory';
import { Compiler } from '../compilers';
import { Loader } from './examples.index';
import { build, addBreakpoint, removeBreakpoint } from './build';
import { expect } from 'chai';
// tslint:disable: no-unused-expression

const compiler: Compiler = {
    compile: async (source, _path) => {
        return source;
    },
    label: 'copier'
};
const mockFs = createMemoryFs({
    '/main.js': `let val=false;
            export const wasInjected=val;`,
    '/func.js': `export const exported=() => {
        /* */
    };`

});
const load: Loader = async path => mockFs.readFileSync(path, 'utf8');

describe('addBreakpoint', () => {
    it('should recompile the file with the added breakpoint', async () => {
        const withoutBP = await build(compiler, load, '/func');
        const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
        const exportWithoutBreakpoint = (await withoutBP.module).exported;
        const exportWithBreakpoint = (await withBP.module).exported;

        expect(exportWithoutBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {/* */}`);
        expect(exportWithBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {debugger;/* */}`);
    });
    it('should keep previously added breakpoints', async () => {
        const withoutBP = await build(compiler, load, '/func');
        const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
        const with2BP = await addBreakpoint(withBP, '/func.js', 3);
        const exportWithBreakpoint = (await with2BP.module).exported;

        expect(exportWithBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {debugger;/* */debugger;}`);
    });
});

describe('removeBreakpoint', () => {
    it('should remove added debugger statements', async () => {
        const original = await build(compiler, load, '/func');
        const withBP = await addBreakpoint(original, '/func.js', 2);
        const withoutBP = await removeBreakpoint(withBP, '/func.js', 2);
        const exportWithBreakpoint = (await withBP.module).exported;
        const exportWithoutBreakpoint = (await withoutBP.module).exported;

        expect(exportWithBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {debugger;/* */}`);
        expect(exportWithoutBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {/* */}`);
    });
    it('should keep previously added breakpoints', async () => {
        const withoutBP = await build(compiler, load, '/func');
        const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
        const with2BP = await addBreakpoint(withBP, '/func.js', 3);
        const withOneBPRemoved = await removeBreakpoint(with2BP, '/func.js', 2);
        const exportWithBreakpoint = (await withOneBPRemoved.module).exported;

        expect(exportWithBreakpoint.toString().replace(/\n\s*/g, ''))
            .to.equal(`() => {/* */debugger;}`);
    });
});

describe('build with code injections', () => {
    it('should run the injected code', async () => {
        const res = await build(compiler, load, '/main', { '/main.js': { 2: `val=true;` } });
        const mod = await res.module;
        expect(mod.wasInjected).to.be.true;
    });
    it('should not include injected snippets on the compiled fs', async () => {
        const res = await build(compiler, load, '/main', { '/main.js': { 2: `val=true;` } });
        expect(res.compiled).to.eql(`let val=false;
            export const wasInjected=val;`);
    });
});

describe('injectSnippets', () => {
    it('should inject snippets into code', () => {
        const code = `1
        2
        3
        4`.replace(/\n\s+/g, '\n');
        expect(injectSnippets(code, { 2: '1.5', 3: '2.5' })).to.eql(`1
        1.5
        2
        2.5
        3
        4`.replace(/\n\s+/g, '\n'));
    });
});