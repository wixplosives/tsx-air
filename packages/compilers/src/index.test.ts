import { expect } from "chai";
import { transformerCompilers } from ".";
import { testRuntimeApi } from "@tsx-air/framework/src/runtime/runtime.test.suite";
import { packagePath } from "@tsx-air/utils/packages";
import { readFileSync } from "fs";
import ts from "typescript";
import { compilerOptions } from "@tsx-air/compiler-utils";
import { Script } from "vm";
import * as fr from '@tsx-air/framework'
import { browserifyFiles } from "@tsx-air/testing";
import { Runtime } from "@tsx-air/framework/src/runtime/runtime";
import { Displayable, TSXAir, render, Component } from "@tsx-air/framework";
import { JSDOM } from "jsdom";

xdescribe('compilers', () => {
    it('each compiler should have a unique name', () => {
        const usedNames: Set<string> = new Set();
        for (const { label } of transformerCompilers) {
            expect(usedNames, `${label} is not unique`).not.to.include(label);
            usedNames.add(label);
            expect(label.trim()).not.to.eql('');
        }
    });

    for (const compiler of transformerCompilers) {
        describe(`${compiler.label}`, () => {
            let Parent: any, Child: any;
            before(async () => {
                await browserifyFiles(
                    packagePath('@tsx-air/framework', 'fixtures'),
                    packagePath('@tsx-air/compilers', 'tmp'),
                    compiler,
                    'runtime.fixture.tsx',
                    'out.js',
                )
                const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'src.js', 'runtime.fixture.jsx'), { encoding: 'utf8' });
                // const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'out.js'), { encoding: 'utf8' });
                // const out = src;
                // const src = readFileSync(packagePath('@tsx-air/framework', 'fixtures', 'runtime.fixture.tsx'), { encoding: 'utf8' });
                // console.log(src);
                const out = ts.transpileModule(src, {
                    compilerOptions: {
                        ...compilerOptions,
                        module: ts.ModuleKind.CommonJS
                    },
                    transformers: compiler.transformers,
                    fileName: 'compiled.mjs'
                }).outputText;
                console.log(out);
                const script = new Script(out);
                try {
                    const exports = {};
                    const require = () => fr;
                    const t = script.runInNewContext({ exports, require }, { filename: 'compiled.mjs', });
                    // console.log(t)
                    Parent = exports.Parent;
                    Child = exports.Child;
                } catch (e) {
                    console.log(e);
                }
            });
            testRuntimeApi(() => [Parent, Child]);
        });
    }
});

describe.only(`state`, () => {
    let Comp: typeof Component;
    let runtime: Runtime;
    let onNextFrame: FrameRequestCallback[] = [];
    const domOf = <T extends Displayable>(c: T) => (c.getDomRoot() as HTMLElement).outerHTML.replace(/>\s{2,}</g, '><');

    beforeEach(() => {
        onNextFrame = [];
        const { window } = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        runtime = new Runtime(window, (fn: FrameRequestCallback) => (onNextFrame.push(fn), onNextFrame.length));
        TSXAir.runtime = runtime;
    });

    before(async () => {
        const example = '03.thumb';
        // const example = '01.stateless-parent-child';
        await browserifyFiles(
            packagePath('@tsx-air/examples', 'src', 'examples', example),
            packagePath('@tsx-air/compilers', 'tmp'),
            transformerCompilers[0],
            'suite.boilerplate.ts',
            'out.js',
        )
        const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'src.js', 'index.source.jsx'), { encoding: 'utf8' });
        // const src = readFileSync(packagePath('@tsx-air/compilers', 'tmp', 'out.js'), { encoding: 'utf8' });
        // const out = src;
        // const src = readFileSync(packagePath('@tsx-air/framework', 'fixtures', 'runtime.fixture.tsx'), { encoding: 'utf8' });
        // console.log(src);
        const out = ts.transpileModule(src, {
            compilerOptions: {
                ...compilerOptions,
                module: ts.ModuleKind.CommonJS
            },
            transformers: transformerCompilers[0].transformers,
            fileName: 'compiled.mjs'
        }).outputText;
        const script = new Script(out);
        try {
            const exports = {};
            const require = () => fr;
            const t = script.runInNewContext({ exports, require }, { filename: 'compiled.mjs', });

            // Comp = exports.ParentComp;
            Comp = exports.Thumb;
            console.log(Comp)
        } catch (e) {
            console.log(e);
        }
    });
    it(`should `, () => {
        // const instance = render(Comp, { name: 'bla.jpg' })
        const instance = render(Comp, { url: 'bla.jpg' })
        console.log(domOf(instance.$instance));
    });
})