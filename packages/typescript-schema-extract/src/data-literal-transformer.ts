import ts from 'typescript';
import { resolveImportedIdentifier, IFileSystemPath } from './imported-identifier-resolver';

export interface IExctractorEnv extends Object {
    checker: ts.TypeChecker;
    pathUtil: IFileSystemPath;
    modulePath: string;
}

export interface ILiteralInferenceResult {
    isLiteral: true;
    value: any;
}

export interface IExpressionInferenceResult {
    isLiteral: false;
    value: any;
    expression: string;
}

function aLiteralValue(value: any): ILiteralInferenceResult {
    return {
        isLiteral: true,
        value
    };
}

function anExpression(value: any, expression: string): IExpressionInferenceResult {
    return {
        isLiteral: false,
        value,
        expression
    };
}

function aProcessedExpression(
    type: string,
    id: string,
    expression: string,
    extraFields: any = {}
): IExpressionInferenceResult {
    return {
        isLiteral: false,
        value: {
            __serilizedType: type,
            id,
            ...extraFields
        },
        expression
    };
}

export function generateDataLiteral(
    env: IExctractorEnv,
    node: ts.Node
): ILiteralInferenceResult | IExpressionInferenceResult {
    // const {checker, modulePath } = env;
    if (ts.isStringLiteral(node)) {
        return aLiteralValue(node.text);
    } else if (ts.isNumericLiteral(node)) {
        return aLiteralValue(parseFloat(node.text));
    } else if (node.getText() === 'true' || node.getText() === 'false') {
        return aLiteralValue(node.getText() === 'true');
    } else if (ts.isObjectLiteralExpression(node)) {
        const value: any = {};
        let isLiteral = true;
        for (const prop of node.properties) {
            if (ts.isPropertyAssignment(prop)) {
                const innerRes = generateDataLiteral(env, prop.initializer);
                isLiteral = isLiteral && innerRes.isLiteral;
                value[prop.name!.getText()] = innerRes.value;
            }
        }
        return isLiteral ? aLiteralValue(value) : anExpression(value, node.getText());
    } else if (ts.isObjectBindingPattern(node)) {
        const value: any = {};
        let isLiteral = true;
        for (const bindingElement of node.elements) {
            if (!bindingElement.initializer) {
                isLiteral = false;
                value[bindingElement.name!.getText()] = {};
            } else {
                const innerRes = generateDataLiteral(env, bindingElement.initializer);
                isLiteral = isLiteral && innerRes.isLiteral;
                value[bindingElement.name!.getText()] = innerRes.value;
            }
        }
        return isLiteral ? aLiteralValue(value) : anExpression(value, node.getText());
    } else if (ts.isArrayLiteralExpression(node)) {
        const value: any[] = [];
        let isLiteral = true;
        for (const element of node.elements) {
            const innerRes = generateDataLiteral(env, element);
            isLiteral = isLiteral && innerRes.isLiteral;
            value.push(innerRes.value);
        }

        return isLiteral ? aLiteralValue(value) : anExpression(value, node.getText());
    } else if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        let currentNode: ts.Node = node;
        const expression: string[] = [];
        do {
            if (ts.isPropertyAccessExpression(currentNode)) {
                expression.push(currentNode.name.getText());
                currentNode = currentNode.expression;
            }
            if (ts.isElementAccessExpression(currentNode)) {
                const innerValue = generateDataLiteral(env, currentNode.argumentExpression);
                expression.push(innerValue.value);
                currentNode = currentNode.expression;
            }
        } while (ts.isPropertyAccessExpression(currentNode) || ts.isElementAccessExpression(currentNode));

        const id = getIdFromExpression(env, currentNode as ts.Expression);
        return aProcessedExpression('reference', id, node.getText(), { innerPath: expression.reverse() });
    } else if (ts.isIdentifier(node)) {
        return aProcessedExpression('reference', getIdFromExpression(env, node), node.getText());
    } else if (ts.isCallExpression(node)) {
        return aProcessedExpression('reference-call', getIdFromExpression(env, node.expression), node.getText(), {
            args: node.arguments.map(arg => generateDataLiteral(env, arg).value)
        });
    } else if (ts.isNewExpression(node)) {
        return aProcessedExpression('reference-construct', getIdFromExpression(env, node.expression), node.getText(), {
            args: node.arguments!.map(arg => generateDataLiteral(env, arg).value)
        });
    }
    return anExpression(undefined, node.getText());
}

function getIdFromExpression(env: IExctractorEnv, node: ts.Expression) {
    const referencedSymb = env.checker.getSymbolAtLocation(node)!;
    const referencedSymbDecl = referencedSymb.valueDeclaration || referencedSymb.declarations[0];
    if (referencedSymbDecl) {
        const importedRef = resolveImportedIdentifier(referencedSymbDecl, env.modulePath, env.pathUtil);
        if (importedRef) {
            return importedRef;
        }
    }
    return '#' + node.getText();
}
