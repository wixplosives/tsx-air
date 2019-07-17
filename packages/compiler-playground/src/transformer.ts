import ts from 'typescript';

(window as any).ts = ts;
interface ScannedJSX {
    kind: 'jsx';
    type: string;
    attributes: Array<{ name: string, value: string | ScannedExpression }>;
    children: ScannedChild[];
}


interface ScannedText {
    kind: 'text';
    text: string;
}


interface ScannedExpression {
    kind: 'expression';
    expression: string;
}

type ScannedChild = ScannedText | ScannedExpression | ScannedJSX;

export function tsxAirTransformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const returnStatements: ts.ReturnStatement[] = [];
    return sourceFile => {
        // fist run the visitor, so it will mark whether we need to add fileName const declaration
        sourceFile = ts.visitEachChild(sourceFile, replaceTsxAirFunctions, context);

        return sourceFile;

        function replaceTsxAirFunctions(node: ts.Node): ts.Node | ts.Node[] {
            // we only transform jsx attributes nodes that have parent jsx elements
            if (!ts.isCallExpression(node) || node.expression.getText() !== 'TSXAir') {
                return ts.visitEachChild(node, replaceTsxAirFunctions, context);
            }
            const arg = node.arguments[0];
            if (!ts.isArrowFunction(arg)) {
                throw new Error('unhanlded input');
            }

            ts.visitEachChild(node, findReturnStatements, context);
            let expression = returnStatements[0].expression!;

            if (ts.isParenthesizedExpression(expression)) {
                expression = expression.expression;
            }
            if (!ts.isJsxElement(expression)) {
                throw new Error('unhnadled input');
            }

            const scanned = getJSXElements(expression);
            return ts.createCall(ts.createIdentifier('TSXAir'), [], [ts.createObjectLiteral([
                ts.createPropertyAssignment('unique', ts.createCall(ts.createIdentifier('Symbol'), undefined, [ts.createStringLiteral((node.parent! as any).name.getText())])),
                ts.createMethod(undefined, undefined, undefined, 'toString', undefined, undefined, [
                    ts.createParameter(undefined, undefined, undefined, 'props'),
                    ts.createParameter(undefined, undefined, undefined, 'state'),
                ], undefined, ts.createBlock(
                    [ts.createReturn(
                        createStringTemplate(scanned))],
                    true
                ))
            ], true)]);
        }
    };

    function createStringTemplate(root: ScannedJSX) {
        const parts = getStringParts(root);
        const mergedParts = parts.reduce((accum, item) => {
            if (typeof item === 'string') {
                const last = accum[accum.length - 1];
                if (typeof last === 'string') {
                    accum[accum.length - 1] += item;
                    return accum;
                }
            }
            accum.push(item);
            return accum;
        }, [] as Array<string | { expression: string }>);
        const resSpans: ts.TemplateSpan[] = [];
        for (let i = 1; i < mergedParts.length; i += 2) {
            resSpans.push(ts.createTemplateSpan(
                ts.createIdentifier((mergedParts[i] as any).expression),
                (i === mergedParts.length - 2) ?
                    ts.createTemplateTail(mergedParts[i + 1] as string) :
                    ts.createTemplateMiddle(mergedParts[i + 1] as string)
            ));
        }

        return ts.createTemplateExpression(
            ts.createTemplateHead(mergedParts[0] as string),
            resSpans
        );
    }


    function getStringParts(root: ScannedChild): Array<string | { expression: string }> {
        const res: Array<string | { expression: string }> = [];
        switch (root.kind) {
            case 'expression':
                return [{ expression: root.expression }];
            case 'jsx':
                res.push(`\n<${root.type} `);
                for (const attr of root.attributes) {
                    const value = attr.value;
                    if (typeof value === 'string') {
                        res.push(attr.name + '=' + attr.value + ' ');
                    } else {

                        res.push(attr.name + '="');
                        res.push({
                            expression: value.expression
                        });
                        res.push('" ');
                    }
                }
                res.push(`>\n`);
                for (const child of root.children) {
                    res.push(...getStringParts(child));
                }
                res.push(`\n</${root.type}>\n`);
                break;
            case 'text':
                return [root.text];
        }


        return res;
    }

    function findReturnStatements(node: ts.Node) {
        if (ts.isReturnStatement(node)) {
            returnStatements.push(node);
        }
        ts.visitEachChild(node, findReturnStatements, context);
        return node;
    }

    function getJSXElements(node: ts.JsxElement): ScannedJSX {
        return {
            kind: 'jsx',
            type: node.openingElement.tagName.getText(),
            attributes: node.openingElement.attributes.properties.map(child => {
                if (!ts.isJsxAttribute(child)) {
                    throw new Error('unhandled');
                }
                const initializer = child.initializer;
                if (!initializer) {
                    return {
                        name: child.name.getText(),
                        value: 'true'
                    };
                }
                if (ts.isStringLiteral(initializer)) {
                    return {
                        name: child.name.getText(),
                        value: child.initializer ? child.initializer.getText() : 'true'
                    };
                }
                return {
                    name: child.name.getText(),
                    value: {
                        kind: 'expression',
                        expression: initializer.expression!.getText()
                    }
                };

            }),
            children: node.children ? node.children.map(handleJSXChild) : []
        };
    }

    function handleJSXChild(node: ts.JsxChild): ScannedChild {
        if (ts.isJsxElement(node)) {
            return getJSXElements(node);
        } else if (ts.isJsxText(node)) {
            return {
                kind: 'text',
                text: node.getText()
            };
        } else if (ts.isJsxExpression(node)) {
            return {
                kind: 'expression',
                expression: node.expression!.getText()
            };
        }
        throw new Error('unhandled');
    }

}


