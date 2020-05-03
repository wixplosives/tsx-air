import ts from 'typescript';

export const cloneDeep = <T extends ts.Node>(node: T, parent?: ts.Node) => {
    let clone;
    clone = createSynthesizedNode(node) as T;

    clone.parent = parent!;
    for (const key in node) {
        if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
            continue;
        }
        if (node[key] && (node[key] as any).kind) {
            clone[key] = (cloneDeep(node[key] as any as ts.Node, node) as any);
            continue;
        }
        if (node[key] && (node[key] as any).length && (node[key] as any)[0].kind) {
            clone[key] = (node[key] as any as ts.Node[]).map(item => cloneDeep(item, node)) as any;
            continue;
        }
        clone[key] = node[key];
    }
    return clone;
};

function createSynthesizedNode(like: ts.Node) {
    const node = ts.createNode(like.kind, -1, -1);
    node.flags |= like.flags | 8 /* Synthesized */;
    return node;
}