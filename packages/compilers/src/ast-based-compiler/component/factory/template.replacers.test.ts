import { asAst, analyze, CompDefinition, jsxToStringTemplate, jsxAttributeReplacer } from "@tsx-air/compiler-utils";
import { expect } from "chai";
import { jsxTextExpressionReplacer, jsxComponentReplacer } from "./template.replacers";
import ts from "typescript";

    describe('template replacers', () => {
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