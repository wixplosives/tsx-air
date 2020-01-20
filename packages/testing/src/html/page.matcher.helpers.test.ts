import { HTMLMatcher } from './page.matcher.types';
import { expect } from 'chai';
import { buildFullQuery, withAncestors } from './page.matcher.helpers';

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
                name:'Root',
                children: [{
                    children: [{ 
                        name: 'Grandchild',
                    }, {}],
                    descendants: [{ name:'Decedent', children:[{}] }, {}]
                },
                {name:'Named child'}],
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
        });
    });
});