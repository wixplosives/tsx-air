import ts from 'typescript';

export const cloneDeep = <T extends ts.Node>(node: T, parent?: ts.Node) => {
    const clone = createSynthesizedNode(node.kind) as T;
    if (parent) {
        clone.parent = parent;
    }
    for (const key in node) {
        if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
            continue;
        }
        if (node[key] && (node[key] as any).kind) {
            clone[key] = (cloneDeep(node[key] as any as ts.Node, node) as any);
        } else if (node[key] && (node[key] as any).length && (node[key] as any)[0].kind) {
            clone[key] = (node[key] as any as ts.Node[]).map(item => cloneDeep(item, node)) as any;
        } else {
            clone[key] = node[key];
        }
    }
    clone.pos = -1;
    clone.end = -1;
    return clone;
};

function createSynthesizedNode(kind: ts.SyntaxKind) {
    const node = ts.createNode(kind, -1, -1);
    node.flags |= 8 /* Synthesized */;
    return node;
}