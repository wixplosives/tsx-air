import { CompDefinition, isComponentTag, asCode, cloneDeep, cObject, findUsedVariables, UsedInScope, asAst, cMethod, astTemplate, cGet } from "@tsx-air/compiler-utils";
import { FragmentData } from "./jsx.fragment";
import ts from "typescript";
import { dependantOnVars, setupClosure } from "../helpers";

export function generateVirtualComponents(comp: CompDefinition, fragment: FragmentData) {
    const comps: ts.GetAccessorDeclaration[] = [];
    const visitor = (node: ts.Node) => {
        const tag = getComponentNodeOpening(node);
        if (tag) {
            comps.push(generateVCMethod(comp, tag, comps.length));
        }
        node.forEachChild(visitor);
    }
    visitor(fragment.src);
    return comps;
}

function generateVCMethod(comp: CompDefinition, child: ts.JsxOpeningLikeElement, index: number) {
    const props = extractProps(child);
    const affectedBy = (Object.values(props)).filter(f => !ts.isLiteralExpression(f)) as ts.Expression[];
    const mapping = calcRemapping(comp, props);
    const childType = asCode(child.tagName);
    const preMapping = mapping === 'undefined' ? [] : [
        asAst(`const $pr=this.changesBitMap, $ch=${childType}.changesBitMap;`) as ts.Statement
    ]

    return cGet(`$comp${index}`, [
        ...setupClosure(comp, affectedBy),
        ...preMapping,
        ts.createReturn(
            astTemplate(
                `VirtualElement.component('${index}', ${child}, this, ${mapping}, PROPS)`,
                { 'PROPS': cObject(props) }
            ) as any as ts.Expression
        )]
    );
}

function getComponentNodeOpening(node: ts.Node): ts.JsxOpeningLikeElement | false {
    const opening: ts.JsxOpeningLikeElement | false = (ts.isJsxElement(node) && node.openingElement)
        || (ts.isJsxSelfClosingElement(node) && node);
    return (opening && isComponentTag(opening.tagName)) && opening;
}

function calcRemapping(comp: CompDefinition, props: Props) {
    const mapping: string[] = [];
    for (const [prop, exp] of Object.entries(props)) {
        if (!ts.isLiteralExpression(exp)) {
            const dependencies = dependenciesAsBitMapOr(comp, exp);
            if (dependencies) {
                mapping.push(`[$ch['props.${prop}'], ${dependencies}]`);
            }
        }
    }
    return mapping.length ? `new Map([${mapping.join(',')}])` : 'undefined';
}

function dependenciesAsBitMapOr(comp: CompDefinition, exp: ts.Expression) {
    const dependencies = dependantOnVars(comp, findUsedVariables(exp));
    const res=[];
    if (dependencies.props) {
        const props = dependencies.props[Object.keys(dependencies.props)[0]];
        for (const prop in props) {
            res.push(`$b['props.${prop}']`);
        }
    }
    if (dependencies.stores) {
        for (const [store, field] of Object.entries(dependencies.stores)) {
            for (const fieldName in field) {
                res.push(`$b['${store}.${fieldName}']`);
            }
        }
    }
    return res.join('|');
}

type Props = Record<string, ts.StringLiteral | ts.Expression | ts.BooleanLiteral>;
function extractProps(node: ts.JsxOpeningLikeElement): Props {
    return node.attributes.properties.reduce((acc, prop) => {
        if (ts.isJsxSpreadAttribute(prop)) {
            throw new Error('spread in attributes is not handled yet');
        }
        const initializer = prop.initializer;
        const name = asCode(prop.name);
        if (!initializer) {
            acc[name] = ts.createTrue();
        } else if (ts.isJsxExpression(initializer)) {
            if (initializer.expression) {
                acc[name] = cloneDeep(initializer.expression) as ts.Expression;
            }
        } else {
            acc[name] = cloneDeep(initializer);
        }
        return acc;
    }, {} as Props);
}