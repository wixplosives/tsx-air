import { expect } from 'chai';
import { compilers } from '.';


describe('compilers', () => {
    it('each compiler should have a unique name', () => {
        expect(compilers.length).to.be.greaterThan(0);
        const nameSet: Set<string> = new Set();
        for (const compiler of compilers) {
            nameSet.add(compiler.name);
            expect(compiler.name.length).to.be.greaterThan(0);
        }
        expect(nameSet.size, 'compiler names are not unique').to.equal(compilers.length);
    });
});