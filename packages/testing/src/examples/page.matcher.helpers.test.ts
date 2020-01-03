import { HTMLMatcher } from './page.matcher.types';
import { expect } from 'chai';
import { buildFullQuery, expectCount, withAncestors } from './page.matcher.helpers';
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
            expect(() => expectCount('x', { above: 0 })).to.throw(/expected 'x' to be a number/);
            expect(() => expectCount(4, { above: 5 })).to.throw(/expected 4 to be above 5/);
            expect(() => expectCount(4, { below: 0 })).to.throw(/expected 4 to be below 0/);
            expect(() => expectCount(4, {})).to.throw(/invalid numeric range: must be  number, or have above or below properties/);
        });
        it('should assert numeric value', () => {
            expect(() => expectCount(4, 4)).not.to.throw();
            expect(() => expectCount('x', 4)).to.throw();
            expect(() => expectCount(5, 4)).to.throw();
        });
    });

    describe('expectText', () => {

    });
});