import * as ts from 'typescript';
import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { jsxToStringTemplate, cloneDeep, jsxAttributeReplacer, jsxTextExpressionReplacer, jsxComponentReplacer } from './ast-generators';
import { analyze } from '../../analyzers';
import { CompDefinition } from '../../analyzers/types';

const connectToString = (generator: (ctx: ts.TransformationContext) => ts.Node) => {

    const output = ts.transpileModule(`
    const a = {}
    `, {
        compilerOptions: {
            jsx: ts.JsxEmit.React,
            jsxFactory: 'TSXAir',
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
        },
        transformers: {
            before: [ctx => {
                function visitor<T extends ts.Node>(node: T): T {
                    if (ts.isObjectLiteralExpression(node)) {
                        return generator(ctx) as T;
                    }
                    return ts.visitEachChild(node, visitor, ctx);
                }
                return visitor;
            }]
        },
        fileName: 'temp.tsx'
    });
    return output.outputText;
};

describe('cloneDeep', () => {
    it('should return a clone of the tree ready to be reused and attached', () => {

        const ast = parseValue(`window.location`);
        expect(() => connectToString(() => ast)).to.throw();
        expect(connectToString(() => cloneDeep(ast))).to.include('const a = window.location');
    });
});

describe('jsxToStringTemplate', () => {
    it('should return a the string of a jsx node if no replacers exist', () => {
        const ast = parseValue(`<div>gaga</div>`);
        const res = connectToString(() => jsxToStringTemplate(ast as ts.JsxElement, []));
        expect(res).to.include('const a = `<div>gaga</div>`');
    });
    it('should replace to template string expressions according to visitors', () => {
        const ast = parseValue(`<div id={window.location}>gaga</div>`);
        const generator = () => jsxToStringTemplate(ast as ts.JsxElement, [{
            isApplicable(node): node is ts.JsxExpression {
                return ts.isJsxExpression(node);
            },
            getExpression(node) {
                const a = node as ts.JsxExpression;
                return {
                    prefix: '"',
                    expression: a.expression ? cloneDeep(a.expression) : ts.createTrue(),
                    suffix: '"'
                };
            }

        }]);
        const res = connectToString(generator);
        expect(res).to.include('const a = `<div id="${window.location}">gaga</div>`');
    });
});


describe('replace attribute expression', () => {
    it('should replace jsx attributes and leave other jsx expressions alone', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.id}>{props.title}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const generator = () => jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
        const res = connectToString(generator);
        expect(res).to.include('const a = `<div id="${props.id}">{props.title}</div>`');
    });
});

describe('jsx text expression replacer', () => {
    it('should replace jsx text expressions and leave other jsx expressions alone', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.id}>{props.title}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const generator = () => jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxTextExpressionReplacer]);
        const res = connectToString(generator);
        expect(res).to.include('const a = `<div id={props.id}><!-- props.title -->${props.title}<!-- props.title --></div>`');
    });

    it('should handle quates', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={\`"gaga"\`}>{props.title}</div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const generator = () => jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
        const res = connectToString(generator);
        expect(res).to.include('const a = `<div id="${"gaga"}">{props.title}</div>`');
    });
});
describe('component node replacer', () => {
    it('should replace jsx nodes with upper case into calls to the component to string', () => {
        const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.id}><Comp name="gaga" title={props.title}></Comp></div>
        })`);

        const info = analyze(ast).tsxAir as CompDefinition;
        const jsxRootInfo = info.jsxRoots[0];

        const generator = () => jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxComponentReplacer]);
        const res = connectToString(generator);
        expect(res).to.include(`const a = \`<div id={props.id}>\${Comp.toString({ name: "gaga", title: (props.title) })}</div>\``);
    });
});