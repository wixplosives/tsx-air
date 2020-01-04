import { HTMLMatcher } from './page.matcher.types';
import { expect } from 'chai';
import { buildFullQuery, expectCount, withAncestors, expectText } from './page.matcher.helpers';
describe('page.matcher.helpers', () => {
    describe('buildFullQuery', () => {
        it('should handle parents and ancestors', () => {
            const matcher: HTMLMatcher = withAncestors({
                cssQuery: '.Root',
                children: [{
                    cssQuery: '.Child',
                    children: [{ cssQuery: '.Grandchild' }],
                    decedents: [{ cssQuery: '.DecedentOfChild' }]
                }],
                decedents: [{
                    cssQuery: '.Decedent',
                    children: [{ cssQuery: '.ChildOfDecedent' }],
                    decedents: [{ cssQuery: '.DecedentOfDecedent' }]
                }]
            });
            expect(buildFullQuery(matcher)).to.equal('.Root');
            // @ts-ignore
            expect(buildFullQuery(matcher.children[0]))
                .to.equal('.Root > .Child');
            // @ts-ignore
            expect(buildFullQuery(matcher.children[0].children[0]))
                .to.equal('.Root > .Child > .Grandchild');
            // @ts-ignore
            expect(buildFullQuery(matcher.children[0].decedents[0]))
                .to.equal('.Root > .Child .DecedentOfChild');
            // @ts-ignore
            expect(buildFullQuery(matcher.decedents[0]))
                .to.equal('.Root .Decedent');
            // @ts-ignore
            expect(buildFullQuery(matcher.decedents[0].children[0]))
                .to.equal('.Root .Decedent > .ChildOfDecedent');
            // @ts-ignore
            expect(buildFullQuery(matcher.decedents[0].decedents[0]))
                .to.equal('.Root .Decedent .DecedentOfDecedent');
        });
    });

    describe('expectCount', () => {
        it('should assert range', () => {
            expect(() => {
                expectCount(4, { above: 0 }, 'above only');
                expectCount(4, { below: 42 }, 'below only');
                expectCount(4, { above: 2, below: 5 }, 'within');
            }).not.to.throw();
            expect(() => expectCount('x', { above: 0 }, 'X')).to.throw(`X: expected 'x' to be a number`);
            expect(() => expectCount(4, { above: 5 }, 'Above')).to.throw(`Above: expected 4 to be above 5`);
            expect(() => expectCount(4, { below: 0 }, 'Below')).to.throw(`Below: expected 4 to be below 0`);
            expect(() => expectCount(4, {}, 'Invalid')).to.throw(`Invalid: range must be a number or have above/below: expected {} to be a number`);
        });
        it('should assert numeric value', () => {
            expect(() => expectCount(4, 4)).not.to.throw();
            expect(() => expectCount('x', 4)).to.throw();
            expect(() => expectCount(5, 4)).to.throw();
        });
    });

    describe('expectText', () => {
        it('simple text equality', () => {
            expectText('simple', 'simple');
            expect(() => expectText('simple', 'hard', 'Always')).to.throw(`Always: expected 'simple' to equal 'hard'`);
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
});