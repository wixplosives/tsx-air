import { injectSnippets } from './build.helpers';
import { build, addBreakpoint, removeBreakpoint } from './build';
import { expect } from 'chai';
import { DebuggableLoader, jsLoaderFrom, trivialCompiler, trimCode } from './test.utils';
import { BuiltCode } from './types';
// tslint:disable: no-unused-expression

describe('breakpoints', () => {
    let loader: DebuggableLoader;
    const exportedCode = async (b: BuiltCode) =>
        trimCode((await b.module).exported.toString(), true);

    beforeEach(() => {
        loader = jsLoaderFrom({
            'main.js':
                `let val=false;
                export const wasInjected=val;`,
            'func.js': `export const exported=() => {
                    /* */
                };`
        });
    });

    describe('addBreakpoint', () => {
        it('should recompile the file with the added breakpoint', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);

            expect(await exportedCode(withoutBP)).to.equal(`() => { /* */ }`);
            expect(await exportedCode(withBP)).to.equal(`() => { debugger; /* */ }`);
        });

        it('should keep previously added breakpoints', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
            const with2BP = await addBreakpoint(withBP, '/func.js', 3);

            expect(await exportedCode(with2BP)).to.equal(`() => { debugger; /* */ debugger; }`);
        });
    });

    describe('removeBreakpoint', () => {
        it('should remove added debugger statements', async () => {
            const original = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(original, '/func.js', 2);
            const withoutBP = await removeBreakpoint(withBP, '/func.js', 2);

            expect(await exportedCode(withBP)).to.equal(`() => { debugger; /* */ }`);
            expect(await exportedCode(withoutBP)).to.equal(`() => { /* */ }`);
        });

        it('should keep previously added breakpoints', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
            const with2BP = await addBreakpoint(withBP, '/func.js', 3);
            const withOneBPRemoved = await removeBreakpoint(with2BP, '/func.js', 2);

            expect(await exportedCode(withOneBPRemoved)).to.equal(`() => { /* */ debugger; }`);
        });
    });

    describe('build with code injections', () => {
        it('should run the injected code', async () => {
            const res = await build(trivialCompiler, loader, '/main', { '/main.js': { 2: `val=true;` } });
            const mod = await res.module;
            expect(mod.wasInjected).to.be.true;
        });

        it('should not include injected snippets on the compiled fs', async () => {
            const res = await build(trivialCompiler, loader, '/main', { '/main.js': { 2: `val=true;` } });
            await res.module;
            expect(res.compiled).to.eql(trimCode(
                `let val=false;
            export const wasInjected=val;`));
        });
    });

    describe('injectSnippets', () => {
        it('should inject snippets into code', () => {
            const code = trimCode(`1
            2
            3
            4`);
            expect(injectSnippets(code, { 2: '1.5', 3: '2.5' })).to.eql(
                trimCode(`1
                1.5
                2
                2.5
                3
                4`));
        });
    });
});