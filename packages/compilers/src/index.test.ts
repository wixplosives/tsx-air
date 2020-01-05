import { expect } from 'chai';
import { transformerCompilers } from '.';
import { shouldCompileExamples } from '@tsx-air/testing';
import { shouldBeCompiled } from '@tsx-air/examples';

describe('compilers', () => {
    it('each compiler should have a unique name', () => {
        const usedNames: Set<string> = new Set();
        for (const { label } of transformerCompilers) {
            expect(usedNames, `${label} is not unique`).not.to.include(label);
            usedNames.add(label);
            expect(label.trim()).not.to.eql('');
        }
    });

    for (const compiler of transformerCompilers) {
        shouldCompileExamples(compiler, shouldBeCompiled);
    }
});