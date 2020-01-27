import { HTMLMatcher, isHTMLMatcher } from './page.matcher.types';
import { expect } from 'chai';
import { buildFullQuery, withAncestors, handleDescendants, Checker } from './page.matcher.helpers';
import { ElementHandle } from 'puppeteer';

describe('page.matcher.helpers', () => {
    describe('buildFullQuery', () => {
        it('should handle parents and ancestors', () => {
            const matcher: HTMLMatcher = withAncestors({
                cssQuery: '.Root',
                children: [{
                    cssQuery: '.Child',
                    children: [{ cssQuery: '.Grandchild' }],
                    descendants: [{ cssQuery: '.DecedentOfChild' }]
                }],
                descendants: [{
                    cssQuery: '.Decedent',
                    children: [{ cssQuery: '.ChildOfDecedent' }],
                    descendants: [{ cssQuery: '.DecedentOfDecedent' }]
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
            expect(buildFullQuery(matcher.children[0].descendants[0]))
                .to.equal('.Root > .Child .DecedentOfChild');
            // @ts-ignore
            expect(buildFullQuery(matcher.descendants[0]))
                .to.equal('.Root .Decedent');
            // @ts-ignore
            expect(buildFullQuery(matcher.descendants[0].children[0]))
                .to.equal('.Root .Decedent > .ChildOfDecedent');
            // @ts-ignore
            expect(buildFullQuery(matcher.descendants[0].descendants[0]))
                .to.equal('.Root .Decedent .DecedentOfDecedent');
        });
    });

    describe('withAncestors', () => {
        it('should pass on the parent name unless a new one is given', () => {
            const matcher: HTMLMatcher = withAncestors({
                name: 'Root',
                children: [{
                    children: [{
                        name: 'Grandchild',
                    }, {}],
                    descendants: [{ name: 'Decedent', children: [{}] }, {}]
                },
                { name: 'Named child' }],
                descendants: [{}]
            });
            expect(matcher.name).to.equal('Root');
            // @ts-ignore
            expect(matcher.descendants[0].name).to.equal('a descendant of Root');
            // @ts-ignore
            expect(matcher.children[0].name).to.equal('a child of Root');
            // @ts-ignore
            expect(matcher.children[1].name).to.equal('Named child');
            // @ts-ignore
            expect(matcher.children[0].children[0].name).to.equal('Grandchild');
            // @ts-ignore
            expect(matcher.children[0].descendants[0].name).to.equal('Decedent');

            expect(withAncestors({}).name).to.equal('matcher root');
            expect(withAncestors({ name: 'Override' }).name).to.equal('Override');
        });
    });


    describe('handleDescendants', () => {
        let checks: Array<{ query: string, checkMatcher: HTMLMatcher, assertion: (found: ElementHandle[]) => void }> = [];
        let htmlChecks: HTMLMatcher[] = [];

        const checkSpy: Checker = (...args: any[]) => {
            if (isHTMLMatcher(args[0])) {
                htmlChecks.push(args[0]);
            } else {
                const [query, checkMatcher, assertion] = args;
                checks.push({ query, checkMatcher, assertion });
            }
        };

        beforeEach(() => {
            checks = [];
            htmlChecks = [];
        });

        it('should do nothing if children/descendants matcher is not defined', () => {
            handleDescendants({ descendants: [3] }, 'children', '', checkSpy);
            handleDescendants({ children: [4] }, 'descendants', '', checkSpy);
            expect(checks).to.have.length(0);
            expect(htmlChecks).to.have.length(0);
        });

        it('allows children/descendants count matches', () => {
            handleDescendants({ name: 'checked matcher', children: [3, { above: 1 }] }, 'children', 'scope', checkSpy);
            handleDescendants({ name: 'checked matcher', descendants: [{ below: 4 }] }, 'descendants', 'scope', checkSpy);
            const [exact, above, below] = checks;
            const mismatch = [] as ElementHandle[];
            const mismatch2 = [{}, {}, {}, {}] as ElementHandle[];
            const match = [{}, {}, {}] as ElementHandle[];

            expect(checks).to.have.length(3);
            expect(htmlChecks).to.have.length(0);
            expect(() => exact.assertion(mismatch)).to.throw('children of checked matcher count: expected 0 to equal 3');
            expect(exact.checkMatcher).to.eql({ cssQuery: 'scope>*', name: 'children of checked matcher count' });
            expect(exact.query).to.eql('scope>*');

            expect(() => above.assertion(mismatch)).to.throw('children of checked matcher count: expected 0 to be above 1');
            expect(above.checkMatcher).to.eql({ cssQuery: 'scope>*', name: 'children of checked matcher count' });
            expect(above.query).to.eql('scope>*');

            expect(() => below.assertion(mismatch2)).to.throw('descendants of checked matcher count: expected 4 to be below 4');
            expect(below.checkMatcher).to.eql({ cssQuery: 'scope *', name: 'descendants of checked matcher count' });
            expect(below.query).to.eql('scope *');

            [exact, above, below].forEach(checked => {
                expect(() => checked.assertion(match)).not.to.throw();
            });
        });

        it('allow children/descendants html match', () => {
            handleDescendants({ children: [{ name: 'child html matcher' }] }, 'children', 'scope', checkSpy);
            expect(checks).to.have.length(0);
            expect(htmlChecks).to.have.length(1);
            expect(htmlChecks[0]).to.deep.include({
                name: 'child html matcher'
            });
        });
    });
});