import { expect } from 'chai';
import { transformerCompilers } from '.';

describe('compilers', () => {
    it('each compiler should have a unique name', () => {
        const usedNames: Set<string> = new Set();
        for (const { name} of transformerCompilers) {
            expect(usedNames, `${name} is not unique`).not.to.include(name);
            usedNames.add(name);
            expect(name.trim()).not.to.eql('');
        }
    });
});