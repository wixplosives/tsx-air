import { parseValue } from '../../astUtils/parser';
import { jsxToStringTemplate, jsxAttributeReplacer, jsxTextExpressionReplacer, jsxComponentReplacer, jsxAttributeNameReplacer } from './to-string-generator';
import ts from 'typescript';
import { expect } from 'chai';
import { analyze } from '../../analyzers';
import { CompDefinition } from '../../analyzers/types';
import { printAST } from '../../dev-utils/print-ast';
import { cloneDeep } from './ast-generators';
import { expectEqualIgnoreWhiteSpace } from '../../dev-utils/expect-equal-ingnore-whitespace';

describe('jsxToStringTemplate', () => {
    it('should return a the string of a jsx node if no replacers exist', () => {
        const ast = parseValue(`<div>gaga</div>`);
        const res = printAST(jsxToStringTemplate(ast as ts.JsxElement, []));
        expect(res).to.equal('`<div>gaga</div>`');
    });
    it('should replace to template string expressions according to visitors', () => {
        const ast = parseValue(`<div id={window.location}>gaga</div>`);
        const templateAst = jsxToStringTemplate(ast as ts.JsxElement, [{
            shouldReplace(node): node is ts.JsxExpression {
                return ts.isJsxExpression(node);
            },
            transform(node) {
                const a = node as ts.JsxExpression;
                return {
                    prefix: '"',
                    expression: a.expression ? cloneDeep(a.expression) : ts.createTrue(),
                    suffix: '"'
                };
            }

        }]);
        const res = printAST(templateAst);
        expect(res).to.equal('`<div id="${window.location}">gaga</div>`');
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
        const res = printAST(templateAst);
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
        const res = printAST(templateAst);
        expect(res).to.equal('`<div class="gaga"></div>`');
    });
    it('should not replace attribute names for components', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <Comp className="gaga"></Comp>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeNameReplacer]);
        const res = printAST(templateAst);
        expect(res).to.equal('`<Comp className="gaga"></Comp>`');
    });
});
describe('jsx text expression replacer', () => {
    it('should replace jsx text expressions and leave other jsx expressions unchanged', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.shouldNotBeChanged}>{props.shouldChange}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxTextExpressionReplacer]);
        const res = printAST(templateAst);
        expect(res).to.equal('`<div id={props.shouldNotBeChanged}><!-- props.shouldChange -->${props.shouldChange}<!-- props.shouldChange --></div>`');
    });

    it('should handle quates', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={\`"gaga"\`}>{props.title}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
        const res = printAST(templateAst);
        expect(res).to.equal('`<div id="${`"gaga"`}">{props.title}</div>`');
    });
});
(global as any).printAST = printAST;
describe('component node replacer', () => {
    it('should replace jsx nodes with upper case into calls to the component to string', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.id}><Comp name="gaga" title={props.title}></Comp></div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];
        const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxComponentReplacer]);
        const res = printAST(templateAst);
        expectEqualIgnoreWhiteSpace(res, `\`<div id={props.id}>\${Comp.factory.toString({ name: "gaga", title: props.title })}</div>\``);

    });
});