import { expect } from "chai";
import { transformerCompilers } from ".";
import { testRuntimeApi } from "@tsx-air/framework/src/runtime/runtime.test.suite";
import { browserifyFiles } from "@tsx-air/testing/src";
import { packagePath } from "@tsx-air/utils/packages";
// @ts-ignore
import {Parent, Child} from '../tmp/src.js/runtime.fixture.js'

describe.only('compilers', () => {
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
                // await browserifyFiles(
                //     packagePath('@tsx-air/framework', 'fixures'),
                //     packagePath('@tsx-air/compilers', 'tmp'),
                //     compiler, 'runtime.fixture.tsx', 'out.js'
                // );

                // const t = (await import('../tmp/src.js/runtime.fixture.js')) as any;
                // Parent = t.Parent;
                // Child = t.Child;
            });
            testRuntimeApi(Parent, Child);
        });
    }
});