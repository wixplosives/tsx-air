import { parseValue } from '../../astUtils/parser';
import { jsxToStringTemplate, jsxAttributeReplacer,  jsxAttributeNameReplacer } from './to-string-generator';
import ts from 'typescript';
import { expect } from 'chai';
import { analyze } from '../../analyzers';
import { CompDefinition } from '../../analyzers/types';
import { printAst } from '../../dev-utils/print-ast';
import { cloneDeep } from './ast-generators';

describe('jsxToStringTemplate', () => {
    it('should return a the string of a jsx node if no replacers exist', () => {
        const ast = parseValue(`<div>gaga</div>`);
        const res = printAst(jsxToStringTemplate(ast as ts.JsxElement, []));
        expect(res).to.equal('`<div>gaga</div>`');
    });
    it('should replace to template string expressions according to visitors', () => {
        const ast = parseValue(`<div id={window.location}>gaga</div>`);
        const templateAst = jsxToStringTemplate(ast as ts.JsxElement, [
            node => ts.isJsxExpression(node) &&
            {
                prefix: '"',
                expression: node.expression ? cloneDeep(node.expression) : ts.createTrue(),
                suffix: '"'
            }
        ]);
        expect(templateAst).to.have.astLike('`<div id="${window.location}">gaga</div>`');
    });
});


describe('replace attribute expression', () => {
    it('should replace jsx attributes and leave other jsx expressions alone', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.shouldBeReplaced}>{props.shouldNotBeReplaced}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
        const res = printAst(templateAst);
        expect(res).to.equal('`<div id="${props.shouldBeReplaced}">{props.shouldNotBeReplaced}</div>`');
    });
});

describe('replace attribute name', () => {
    it('should replace jsx attribute names in native elements', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div className="gaga"></div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeNameReplacer]);
        const res = printAst(templateAst);
        expect(res).to.equal('`<div class="gaga"></div>`');
    });
    it('should not replace attribute names for components', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <Comp className="gaga"></Comp>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeNameReplacer]);
        const res = printAst(templateAst);
        expect(res).to.equal('`<Comp className="gaga"></Comp>`');
    });
});
