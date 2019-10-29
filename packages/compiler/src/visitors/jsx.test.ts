import {Node} from 'typescript';
import { find } from './../astUtils/scanner';
import { expect } from 'chai';
import { FileAstLoader } from '../astUtils/scanner';
import nodeFs from '@file-services/node';
import { findJsxRoot, getTextBlockChildren } from './jsx';

describe('jsx visitors', () => {
    describe('findTextBlockChildren', () => {
        const samplePath = require.resolve('../../test/resources/jsx/text.tsx');
      
        const fs = nodeFs;
        const scanner = new FileAstLoader(fs, samplePath);
        const {ast} = scanner.getAst(samplePath);

        it('should find jsx text blocks, expression included', () => {
            const jsx = find(ast, findJsxRoot);
            const texts = getTextBlockChildren(jsx, { stop: () => void (0), ignoreChildren: () => void (0), report: () => void (0) });
            expect(texts).to.have.length(2);
            const dynamicText = texts![0].map((i: Node) => i.getText().trim()).join('^^^');
            const staticText = texts![0].map((i: Node) => i.getText().trim()).join('^^^');
            expect(dynamicText).to.equal('this is a text:^^^{props.text}^^^!!!');
            expect(staticText).to.equal('this is a static text');
        });
    });
});