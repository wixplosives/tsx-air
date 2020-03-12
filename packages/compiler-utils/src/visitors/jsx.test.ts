import { asCode } from './../dev-utils/print-ast';
import { find } from '../ast-utils/scanner';
import { expect } from 'chai';
import { FileAstLoader } from '../ast-utils/scanner';
import nodeFs from '@file-services/node';
import { findJsxRoot, getTextBlockChildren } from './jsx';

const samplePath = require.resolve('../../fixtures/jsx/text.tsx');
describe('jsx visitors', () => {
    describe('findTextBlockChildren', () => {
        const fs = nodeFs;
        const scanner = new FileAstLoader(fs, samplePath);
        const {ast} = scanner.getAst(samplePath);

        it('should find jsx text blocks, expression included', () => {
            const jsx = find(ast, findJsxRoot);
            const texts = getTextBlockChildren(jsx, { stop: () => void (0), ignoreChildren: () => void (0), report: () => void (0) });
            expect(texts).to.have.length(2);
            const dynamicText = texts![0].map(i => asCode(i).trim()).join('^^^');
            const staticText = texts![1].map(i => asCode(i).trim()).join('^^^');
            expect(dynamicText).to.equal('this is a text:^^^{props.text}^^^!!!');
            expect(staticText).to.equal('this is a static text');
        });
    });
});