import { basicPatterns } from '../../../test.helpers';
import { parseValue, analyze, jsxToStringTemplate, CompDefinition, evalAst, jsxAttributeReplacer, printAst } from '@tsx-air/compiler-utils';
import { expect } from 'chai';
import { jsxComponentReplacer, jsxTextExpressionReplacer, generateToString } from './to.string';
import ts from 'typescript';
import { mapValues } from 'lodash';

describe('generateToString', () => {
    it('should generate at toString method based on the used props and state', () => {
        const comp = mapValues(basicPatterns(), compDef => evalAst(generateToString(compDef.jsxRoots[0], compDef)));

        expect(comp.Static(), 'Static').to.equal('<div></div>');
        expect(comp.PropsOnly({ a: 'a', b: 'b', unused: '!' }), 'PropsOnly')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --></div>`);
        expect(comp.StateOnly(undefined, { store1: { a: 1, b: 2 } }), 'StateOnly')
            .to.equal(`<div><!-- store1.a -->1<!-- --><!-- store1.b -->2<!-- --></div>`);
        expect(comp.ProsAndState({ a: 'a', b: 'b' }, { store2: { a: 1, b: 2 } }), 'ProsAndState')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --><!-- store2.a -->1<!-- --><!-- store2.b -->2<!-- --></div>`);
        expect(comp.DynamicAttributes({a:1}), 'DynamicAttributes')
            .to.equal(`<div dir="ltr" lang="1"><span></span></div>`);
        expect(comp.DynamicAttributesSelfClosing({ a: 2 }), 'DynamicAttributesSelfClosing')
            .to.equal(`<div dir="ltr" lang="2"></div>`);
    });

    it(`uses nested components' toString`, () => {
        const { NestedStateless } = basicPatterns();
        const nested = evalAst(generateToString(NestedStateless.jsxRoots[0], NestedStateless));

        expect(nested.toString()).
            // @ts-ignore
            // tslint:disable: quotemark
            to.be.eqlCode((pr => `<div>${PropsOnly.factory.toString({
                "a": pr.a,
                "b": pr.a,
                "unused": 3
            })}</div>`).toString());
    });

    it(`should removed event listeners`, () => {
        const { EventListener } = basicPatterns();
        const withEvent = evalAst(generateToString(EventListener.jsxRoots[0], EventListener));

        expect(withEvent.toString()).
            to.be.eqlCode('()=>`<div></div>`');
    });

    describe('helpers', () => {
        describe('component node replacer', () => {
            it('should replace jsx nodes with upper case into calls to the component to string', () => {
                const ast = parseValue(`TSXAir((props)=>{
            return <div id={props.id}><Comp name="gaga" title={props.title}></Comp></div>
        })`);

                const info = analyze(ast).tsxAir as CompDefinition;
                const jsxRootInfo = info.jsxRoots[0];
                const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxComponentReplacer]);
                expect(templateAst).to.have.astLike(`\`<div id={props.id}>\${Comp.factory.toString({ name: "gaga", title: props.title })}</div>\``);
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
                expect(templateAst).to.have.astLike('`<div id={props.shouldNotBeChanged}><!-- props.shouldChange -->${props.shouldChange}<!-- --></div>`');
            });

            it('should handle quotes', () => {
                const ast = parseValue(`TSXAir((props)=>{
                        return <div id={\`"gaga"\`}>{props.title}</div>
                    })`);

                const info = analyze(ast).tsxAir as CompDefinition;
                const jsxRootInfo = info.jsxRoots[0];

                const templateAst = jsxToStringTemplate(jsxRootInfo.sourceAstNode as ts.JsxElement, [jsxAttributeReplacer]);
                expect(templateAst).to.have.astLike('`<div id="${`"gaga"`}">{props.title}</div>`');
            });
        });
    });
});