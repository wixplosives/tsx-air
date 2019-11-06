import * as ts from 'typescript';
import { parseValue } from '../../astUtils/parser';
import { expect } from 'chai';
import { jsxToStringTemplate, cloneDeep } from './ast-generators';

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
            isApplicable(node) {
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