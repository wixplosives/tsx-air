import ts from 'typescript';
import { cObject, generateHydrate, cClass, createChangeBitMask, cArrow, cFunction, cBitMaskIf, cAccess, cCall, createBitWiseOr, cAssign } from './ast-generators';
import { GeneratorTransformer } from './append-node-transformer';
import { generateToString } from './to-string-generator';
import { printAST } from '../../dev-utils/print-ast';
import { generateDomBindings, DomBinding } from './component-common';
import { CompProps, CompDefinition, JsxRoot, JsxExpression, JsxComponent, isJsxExpression } from '../../analyzers/types';

export const contains = (node: ts.Node, child: ts.Node) => node.getStart() <= child.getStart() && node.getEnd() >= child.getEnd();

if (typeof window !== 'undefined') {
    (window as any).printAST = printAST;
}

export const createProccessUpdateForComp = (comp: CompDefinition, domBindings: DomBinding[]) => {
    return cFunction([comp.propsIdentifier!, 'state', 'changeMap'],
        comp.usedProps.map(prop => cBitMaskIf(prop.name, {
            changedMaskName: 'changeMap',
            maskPath: [comp.name!, 'changeBitmask']
        }, [
            ...updateNativeExpressions(comp.jsxRoots[0], prop, domBindings),
            ...updateComponentExpressions(comp, comp.jsxRoots[0], prop, domBindings)
        ]))
    );
};

export const filterByDependencies = <T extends JsxExpression | JsxComponent>(prop: CompProps, exp: T[]) => {
    return exp.filter(ex => ex.dependencies.find(dep => dep.name === prop.name));
};

export const updateNativeExpressions = (root: JsxRoot, prop: CompProps, domBindings: DomBinding[]) => {
    const relevantExpressions = filterByDependencies(prop, root.expressions);
    const relevantExpressionsWithDom = relevantExpressions.map(exp => ({
        exp,
        dom: domBindings.find(bind => bind.astNode === exp.sourceAstNode)
    }));

    return relevantExpressionsWithDom.map(exp => cAssign(
        ['this', 'context', exp.dom!.ctxName, 'textContent'],
        exp.exp.sourceAstNode!.expression!));
};

export const updateComponentExpressions = (_comp: CompDefinition, root: JsxRoot, prop: CompProps, domBindings: DomBinding[]) => {
    const relevantExpressions = filterByDependencies(prop, root.components);
    const relevantComponentsWithDom = relevantExpressions.map(exp => ({
        exp,
        dom: domBindings.find(bind => bind.astNode === exp.sourceAstNode)
    }));
    const res: ts.Statement[] = [];
    for (const shadowComp of relevantComponentsWithDom) {
        const changed = shadowComp.exp.props.filter(p => isJsxExpression(p.value));
        if (changed.length) {
            const updateStatements: ts.Statement[] = [];
            for (const compProp of changed) {
                updateStatements.push(
                    cAssign(['p', compProp.name], (compProp.value as JsxExpression).sourceAstNode.expression!)
                );
            }
            updateStatements.push(ts.createReturn(
                createBitWiseOr([shadowComp.exp.name, 'changeBitmask'], changed.map(c => c.name))
            ));
            res.push(ts.createStatement(cCall(['TSXAir', 'runtime', 'updateProps'],
                [
                    cAccess('this', 'context', shadowComp.dom!.ctxName),
                    cArrow(['p'], ts.createBlock(updateStatements))
                ])));
        }

    }
    return res;

};


export const tsxAirTransformer: GeneratorTransformer = (genCtx, ctx) => {
    const comps = genCtx.getScanRes().compDefinitions;
    const visitor: ts.Transformer<ts.Node> = node => {
        if (ts.isVariableStatement(node)) {
            const compNode = node.declarationList.declarations[0].initializer!;
            const comp = comps.find(c => c.sourceAstNode === compNode);
            if (comp) {

                const binding = generateDomBindings(comp);
                const info = comp.jsxRoots[0];
                const res = cClass(comp.name || 'untitled', undefined, {
                    params: ['context', 'props', 'state'],
                    statements: [
                        cAssign(['this', 'context'], ['context']),
                        cAssign(['this', 'props'], ['props']),
                        cAssign(['this', 'state'], ['state'])
                    ]
                }, [
                    {
                        isPublic: true,
                        isStatic: true,
                        name: 'factory',
                        initializer: cObject(
                            {
                                toString: generateToString(info, comp),
                                hydrate: generateHydrate(info, comp, binding),
                                initialState: cArrow([], cObject({}))
                            })
                    },
                    {
                        isPublic: true,
                        isStatic: true,
                        name: 'changeBitmask',
                        initializer: createChangeBitMask(comp.usedProps.map(prop => prop.name))
                    },
                    {
                        isPublic: true,
                        isStatic: false,
                        name: '$$processUpdate',
                        initializer: createProccessUpdateForComp(comp, binding)
                    }
                ]);
                return res;
            }
        }


        return ts.visitEachChild(node, visitor, ctx);
    };
    return visitor;
};