import { expect } from 'chai';
import { expectText } from './expect.text';

describe('expectText', () => {
    it('simple text equality', () => {
        expectText('simple', 'simple');
        expect(() => expectText('simple', 'hard', 'Always')).to.throw(`Always: expected 'simple' to equal 'hard'`);
    });
    it('simple text equality with whitespace', () => {
        expectText(`
            simple`, 'simple');
    });
    it('should ignoreWhiteSpace when provided', () => {
        expectText('  whiteSpace', { equals: 'whiteSpace', ignoreWhiteSpace: true });
        expectText('  whiteSpace', { equals: 'whiteSpace', ignoreWhiteSpace: 'leading' });
        expectText('whiteSpace  ', { equals: 'whiteSpace', ignoreWhiteSpace: true });
        expectText('whiteSpace  ', { equals: 'whiteSpace', ignoreWhiteSpace: 'trailing' });
        expectText('   whiteSpace  ', { equals: 'whiteSpace', ignoreWhiteSpace: true });
        expect(() => expectText('  whiteSpace', { equals: 'whiteSpace', ignoreWhiteSpace: false }, 'Should not be ignored'))
            .to.throw(`Should not be ignored: expected '  whiteSpace' to equal 'whiteSpace'`);
        expect(() => expectText('whiteSpace', { equals: '  whiteSpace  ', ignoreWhiteSpace: 'leading' }, 'Should not be ignored'))
            .to.throw(`Should not be ignored: expected 'whiteSpace' to equal 'whiteSpace  '`);
        expect(() => expectText('whiteSpace', { equals: '  whiteSpace  ', ignoreWhiteSpace: 'trailing' }, 'Should not be ignored'))
            .to.throw(`Should not be ignored: expected 'whiteSpace' to equal '  whiteSpace'`);
    });
    it('should ignoreWhiteSpace when provided', () => {
        const text = `
ignore
    line


        breaks

`;
        expectText(text, { equals: 'ignore line breaks', ignoreLineBreaks: true, ignoreWhiteSpace: true });
        expectText(text, { equals: 'ignore     line         breaks', ignoreLineBreaks: true });
        expect(() => expectText(text, { equals: 'ignore line breaks', ignoreWhiteSpace: true }, 'Should not be ignored'))
            .to.throw('Should not be ignored');
    });

    it('allows match by "contains"', () => {
        expectText('1 2 3 4', { contains: '2' });
        expectText('1   2       3   4', { contains: '2 3', ignoreWhiteSpace: true });
        expect(() => expectText('1 2 3', { contains: '5' }, 'Should not contain'))
            .to.throw('Should not contain');
    });

    it('allows match by "doNotContain"', () => {
        expectText('1 2 3 4', { doesNotContain: '5' });
        expectText('1   2       3   4', { doesNotContain: '23', ignoreWhiteSpace: true });
        expect(() => expectText('1 2 3', { doesNotContain: '2' }, 'Should contain'))
            .to.throw('Should contain');
    });
});