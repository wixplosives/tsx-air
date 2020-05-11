import { basicPatterns, functions, conditional } from '../../../test.helpers';
import { analyze, jsxToStringTemplate, CompDefinition, evalAst, jsxAttributeReplacer, asAst } from '@tsx-air/compiler-utils';
import { jsxComponentReplacer, jsxTextExpressionReplacer, generateToString } from './to.string';
import ts from 'typescript';
import { chaiPlugin } from '@tsx-air/testing';
import { expect, use } from 'chai';
import { TSXAir, store } from '@tsx-air/framework';
use(chaiPlugin);

describe('generateToString', () => {
    const toStringOf = (compDef: CompDefinition, root = 0, context = {}) => evalAst(generateToString(compDef.jsxRoots[root], compDef), { TSXAir, store, ...context });
    it('generates a toString method based on the used props and state', () => {
        const comps = basicPatterns();

        expect(toStringOf(comps.Static)(), 'Static').to.equal('<div></div>');
        expect(toStringOf(comps.PropsOnly)({ a: 'a', b: 'b', unused: '!' }), 'PropsOnly')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --></div>`);
        expect(toStringOf(comps.StateOnly)(undefined, { store1: { a: 1, b: 2 } }), 'StateOnly')
            .to.equal(`<div><!-- store1.a -->1<!-- --><!-- store1.b -->2<!-- --></div>`);
        expect(toStringOf(comps.ProsAndState)({ a: 'a', b: 'b' }, { store2: { a: 1, b: 2 } }), 'ProsAndState')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --><!-- store2.a -->1<!-- --><!-- store2.b -->2<!-- --></div>`);
        expect(toStringOf(comps.DynamicAttributes)({ a: 1 }), 'DynamicAttributes')
            .to.equal(`<div dir="ltr" lang="1"><span></span></div>`);
        expect(toStringOf(comps.DynamicAttributesSelfClosing)({ a: 2 }), 'DynamicAttributesSelfClosing')
            .to.equal(`<div dir="ltr" lang="2"></div>`);
        expect(toStringOf(comps.WithVolatile, 0, { WithVolatile: {
            prototype: {$preRender: () => ({d:'mock'})}
        } })({ p: 2 }), 'WithVolatile')
            .to.equal(`<div><!-- d -->mock<!-- --></div>`);
    });

    it(`uses nested components' toString`, () => {
        const { NestedStateless } = basicPatterns();
        const nested = toStringOf(NestedStateless);

        expect(nested.toString()).
            // @ts-ignore
            // tslint:disable: quotemark
            to.be.eqlCode((pr => `<div>${PropsOnly.factory.toString({
                "a": pr.a,
                "b": pr.a,
                "unused": 3
            })}</div>`).toString());
    });

    it(`removes event listeners`, () => {
        const { EventListener } = basicPatterns();
        const withEvent = toStringOf(EventListener);

        expect(withEvent.toString()).
            to.be.eqlCode('()=>`<div></div>`');
    });

    it(`handles function calls by using the prototyped version`, () => {
        const { WithVolatileFunction } = functions();
        const withFunctionCalls = toStringOf(WithVolatileFunction);

        expect(withFunctionCalls.toString()).
            to.be.eqlCode(`(props, $s) => {
                const $v =  TSXAir.runtime.toStringPreRender(WithVolatileFunction, props, $s);
                return \`<div><!-- someFunc('const') -->\${WithVolatileFunction.prototype._someFunc(props, $s, $v, 'const')}<!-- --></div>\`;
            };`);
    });

    describe(`JSX expressions which contain JSX`, () => {
        it('handles expressions which evaluate as JSX', () => {
            const { Const } = conditional();
            expect(toStringOf(Const)(), 'Const').to.equal(`<div><div></div></div>`);
        })
    })

    describe('helpers', () => {
        describe('component node replacer', () => {
            it('should replace jsx nodes with upper case into calls to the component to string', () => {
                const ast = asAst(`const Comp=TSXAir((props)=>{
                    return <div id={props.id}><Comp name="gaga" title={props.title}></Comp></div>
                })`, true);
                const info = analyze(
                    // @ts-ignore
                    ast.declarationList.declarations[0].initializer
                ).tsxAir as CompDefinition;
                const jsxRootInfo = info.jsxRoots[0];
                const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxComponentReplacer]);
                expect(templateAst).to.have.astLike(`\`<div id={props.id}>\${Comp.factory.toString({ name: "gaga", title: props.title })}</div>\``);
            });
        });

        describe('jsx text expression replacer', () => {
            it('should replace jsx text expressions and leave other jsx expressions unchanged', () => {
                const ast = asAst(`const Comp=TSXAir((props)=>{
                    return <div id={props.shouldNotBeChanged}>{props.shouldChange}</div>
                })`, true);

                const info = analyze(
                    // @ts-ignore
                    ast.declarationList.declarations[0].initializer
                ).tsxAir as CompDefinition;
                const jsxRootInfo = info.jsxRoots[0];

                const executed = [] as string[];
                const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxTextExpressionReplacer(info, executed)]);
                expect(templateAst).to.have.astLike('`<div id={props.shouldNotBeChanged}><!-- props.shouldChange -->${props.shouldChange}<!-- --></div>`');
                expect(executed).to.eql([]);
            });

            it('should handle quotes', () => {
                const ast = asAst(`const Comp = TSXAir((props)=>{
                        return <div id={\`"gaga"\`}>{props.title}</div>
                    })`, true);

                const info = analyze(
                    // @ts-ignore
                    ast.declarationList.declarations[0].initializer
                ).tsxAir as CompDefinition;
                const jsxRootInfo = info.jsxRoots[0];

                const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
                expect(templateAst).to.have.astLike('`<div id="${`"gaga"`}">{props.title}</div>`');
            });
        });
    });
});