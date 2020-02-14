import { isJsxExpression, JsxExpression, DomBinding } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const getAttrName = (exp: JsxExpression | ts.JsxExpression) => {
    const parent = isJsxExpression(exp) ? exp.sourceAstNode.parent : exp.parent;
    return ts.isJsxAttribute(parent) && parent.name.getText();
};

export const isEventHandler =
    (exp: JsxExpression | ts.JsxExpression) => (getAttrName(exp) || '').match(/^on[A-Z]/);

export const findBinding = (exp: JsxExpression, domBinding: DomBinding[]) => {
    const dbind = new Map<ts.Node, DomBinding>();
    domBinding.forEach(b => dbind.set(b.astNode, b));
    type Walker = (n: ts.Node) => DomBinding | void;
    const walker: Walker = n => {
        if (n && n.parent && !ts.isSourceFile(n)) {
            return dbind.get(n) || walker(n.parent);
        }
    };
    return walker(exp.sourceAstNode);
};