import { analyzeFixtureComponents } from '../../../test.helpers';
import { parseValue, analyze, jsxToStringTemplate, CompDefinition, evalAst, jsxAttributeReplacer, printAst } from '@tsx-air/compiler-utils';
import { expect } from 'chai';
import { jsxComponentReplacer, jsxTextExpressionReplacer, generateToString } from './to.string';
import ts from 'typescript';

describe('generateToString', () => {
    const analyzed = analyzeFixtureComponents(`minimal.components.tsx`);

    it('should generate at toString method based on the used props and state', () => {
        const [withNothing, withProps, withState, withBoth] =
            analyzed.slice(0,4).map(compDef => evalAst(generateToString(compDef.jsxRoots[0], compDef)));

        expect(withNothing(), 'static self closing element').to.equal('<div></div>');
        expect(withProps({ a: 'a', b: 'b', unused: '!' }), 'with props')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --></div>`);
        expect(withState(undefined, { store1: { a: 1, b: 2 } }), 'with state')
            .to.equal(`<div><!-- store1.a -->1<!-- --><!-- store1.b -->2<!-- --></div>`);
        expect(withBoth({ a: 'a', b: 'b' }, { store2: { a: 1, b: 2 } }), 'with state and props')
            .to.equal(`<div><!-- props.a -->a<!-- --><!-- props.b -->b<!-- --><!-- store2.a -->1<!-- --><!-- store2.b -->2<!-- --></div>`);
    });

    it(`uses nested components' toString`, () => {
        const nested = evalAst(generateToString(analyzed[4].jsxRoots[0], analyzed[4]));

        expect(nested.toString()).
            // @ts-ignore
            // tslint:disable: quotemark
            to.be.eqlCode((pr => `<div>${WithProps.factory.toString({
                "a": pr.a,
                "b": pr.a,
                "unused": 3
            })}</div>`).toString());
    });

    it(`should removed event listeners`, () => {
        const withEvent = evalAst(generateToString(analyzed[5].jsxRoots[0], analyzed[5]));
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