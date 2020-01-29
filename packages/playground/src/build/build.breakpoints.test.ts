import { breakpoints } from '../../fixtures';
import { injectSnippets } from './build.helpers';
import { build } from './build';
import { expect } from 'chai';
import { trimCode, createMockpiler } from '@tsx-air/testing';
import { BuiltCode } from './types';
import { addBreakpoint, removeBreakpoint } from './rebuild';
import { DebuggableLoader, jsLoaderFromPath } from './test.utils';
// tslint:disable: no-unused-expression

describe('breakpoints', () => {
    let loader: DebuggableLoader;
    const trivialCompiler = createMockpiler();
    const exportedCode = async (b: BuiltCode) =>
        trimCode((await b.module).exported.toString());

    beforeEach(() => {
        loader = jsLoaderFromPath(breakpoints, false);
    });

    describe('addBreakpoint', () => {
        it('should recompile the file with the added breakpoint', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);

            expect(await exportedCode(withoutBP)).to.eqlCode(`() => { 
                /* */ 
            }`);
            expect(await exportedCode(withBP)).to.be.eqlCode(`() => { 
                debugger; 
                /* */ 
            }`);
        });

        it('should keep previously added breakpoints', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
            const with2BP = await addBreakpoint(withBP, '/func.js', 3);

            expect(await exportedCode(with2BP)).to.eqlCode(`() => { 
                debugger; 
                /* */ 
                debugger;
            }`);
        });
    });

    describe('removeBreakpoint', () => {
        it('should remove added debugger statements', async () => {
            const original = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(original, '/func.js', 2);
            const withoutBP = await removeBreakpoint(withBP, '/func.js', 2);

            expect(await exportedCode(withBP)).to.eqlCode(`() => { debugger; 
                /* */ 
            }`);
            expect(await exportedCode(withoutBP)).to.eqlCode(`() => { 
                /* */
            }`);
        });

        it('should keep previously added breakpoints', async () => {
            const withoutBP = await build(trivialCompiler, loader, '/func');
            const withBP = await addBreakpoint(withoutBP, '/func.js', 2);
            const with2BP = await addBreakpoint(withBP, '/func.js', 3);
            const withOneBPRemoved = await removeBreakpoint(with2BP, '/func.js', 2);

            expect(await exportedCode(withOneBPRemoved)).to.eqlCode(`() => { 
                /* */ 
                debugger; }`);
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
            expect(res.compiled).to.be.eqlCode(
                `let val = false;
            export const wasInjected = val;`);
        });
    });

    describe('injectSnippets', () => {
        it('should inject snippets into code', () => {
            const code = `1
            2
            3
            4`;
            expect(injectSnippets(code, { 2: '1.5', 3: '2.5' })).to.be.eqlCode(
                `1
                1.5
                2
                2.5
                3
                4`);
        });
    });
});