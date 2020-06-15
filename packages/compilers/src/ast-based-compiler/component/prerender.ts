import { CompDefinition, cMethod, asCode, cloneDeep, asAst } from '@tsx-air/compiler-utils';
import { setupClosure } from './helpers';
import ts from 'typescript';
import { isStoreDefinition, toTsxCompatible } from './function';
import get from 'lodash/get';
import { FragmentData } from './fragment/jsx.fragment';

export function generatePreRender(comp: CompDefinition, fragments: FragmentData[]) {
    const body = get(comp.sourceAstNode.arguments[0], 'body');
    const statements = get(body, 'statements')
        ? get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[]
        : [body]
    const modified =  [...parseStatements(comp, statements, fragments)];

    return cMethod('preRender', [], [
        ...setupClosure(comp, modified, false),
        ...modified]);
}

function* parseStatements(comp: CompDefinition, statements: ts.Statement[], fragments: FragmentData[]) {
    const declaredVars = new Set<string>();
    for (const s of statements) {
        yield* parseStatement(comp, s, declaredVars, fragments);
    }
}

function* parseStatement(comp: CompDefinition, statement: ts.Statement, declaredVars: Set<string>, fragments: FragmentData[]) {
    if (ts.isVariableStatement(statement)) {
        const vars = [];
        for (const declaration of statement.declarationList.declarations) {
            if (!declaration.initializer
                || !(isStoreDefinition(comp, declaration) || isFunc(declaration))
            ) {
                if (ts.isObjectBindingPattern(declaration.name)) {
                    const bound = declaration.name.elements.filter(e => asCode(e.name) in comp.aggregatedVariables.accessed);
                    if (bound.length) {
                        vars.push(
                            ts.createVariableDeclaration(
                                ts.createObjectBindingPattern(
                                    bound)));
                    }
                } else if (asCode(declaration.name) in comp.aggregatedVariables.accessed) {
                    // TODO: make this state safe for var d=state.a++
                    vars.push(declaration);
                    declaredVars.add(asCode(declaration.name));
                }
            }
        }
        if (vars.length) {
            yield ts.createVariableStatement(statement.modifiers, vars);
        }
    } else {
        if (!ts.isFunctionDeclaration(statement)) {
            yield toTsxCompatible(comp, fragments)(statement);
        } else if (ts.isReturnStatement(statement)) {
            if (declaredVars.size) {
                yield asAst(`this.volatile={${[...declaredVars].join(',')}}`) as ts.Statement;
            }
            yield statement;
        }
    }
}

const isFunc = (v: ts.VariableDeclaration) => (v.initializer && (
    ts.isArrowFunction(v.initializer) ||
    ts.isFunctionExpression(v.initializer)));