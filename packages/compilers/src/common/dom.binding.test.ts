import { CompDefinition, generateDomBindings } from '@tsx-air/compiler-utils';
import { analyzeFixtureComponents } from '../test.helpers';
import { expect } from 'chai';

describe('generateDomBindings', () => {
    let fixture: CompDefinition[];
    before(() => {
        fixture = analyzeFixtureComponents(`deep.dom.tsx`);
    });
    it('assigns a binding to dynamic DOM elements', () => {
        const binding = generateDomBindings(fixture[0]);
        expect(binding.size).to.equal(4);
        const root = fixture[0].jsxRoots[0].sourceAstNode;
        expect(binding.get(root)).to.eql({
            ctxName: 'elm0',
            domLocator: 'root',
            astNode: root
        });
        const rootText =fixture[0].jsxRoots[0].expressions[1].sourceAstNode;
        expect(binding.get(rootText)).to.eql({
            ctxName: 'exp1',
            domLocator: 'root.childNodes[1]',
            astNode: rootText
        });
        const spanText = fixture[0].jsxRoots[0].expressions[2].sourceAstNode;
        expect(binding.get(spanText)).to.eql({
            ctxName: 'exp2',
            domLocator: 'root.children[0].children[0].childNodes[2]',
            astNode: spanText
        });
        const lastDiv = fixture[0].jsxRoots[0].expressions[3].sourceAstNode.parent.parent.parent;
        expect(binding.get(lastDiv)).to.eql({
            ctxName: 'elm3',
            domLocator: 'root.children[1]',
            astNode: lastDiv
        });
    });
});