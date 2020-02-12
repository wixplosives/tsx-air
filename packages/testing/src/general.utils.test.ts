import { trimCode } from './general.utils';
import { expect } from 'chai';

describe('general.utils', () => {
    describe('trimCode', () => {
        it('should parse objects', () => {
            expect(trimCode(`{}`)).to.equal(`{}`);
            expect(trimCode(`{a:1}`)).to.equal(`{\n  "a": 1\n}`);
        });
        it('should compare functions', () => {
            expect(trimCode(`() => { const a=0; }`))
                .to.equal(`() => {\n  const a = 0;\n};`);
        });
        it('should compare valid snippets', () => {
            expect(trimCode(`const a=1`)).to.equal(`const a = 1;`);
            expect(trimCode(`if (a===b) {console.log("ok")}`))
                .to.equal(`if (a === b) {\n  console.log('ok');\n}`);
        });
    });
});