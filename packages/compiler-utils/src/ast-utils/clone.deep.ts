import ts from 'typescript';


type Modifier<S> = S extends ts.Node ? ((n: ts.Node, p: ts.Node) => S | undefined) : never;

export function cloneDeep<T extends ts.Node>(node: T, parent?: ts.Node):T ;
export function cloneDeep<T extends ts.Node, S extends ts.Node>(node: T, parent: ts.Node|undefined, modifier: Modifier<S>):T|S ;
export function cloneDeep<T extends ts.Node, S>(node: T, parent?: ts.Node, modifier?: Modifier<S>):T|S {
    const mod = modifier && modifier(node, parent!);
    if (mod) {
        (mod as any).src = node;
        return mod as S;
    }

    let clone;
    clone = createSynthesizedNode(node) as T;

    clone.parent = parent!;
    for (const key in node) {
        if (clone.hasOwnProperty(key) || !node.hasOwnProperty(key)) {
            continue;
        }
        if (node[key] && (node[key] as any).kind) {
            clone[key] = (cloneDeep(node[key] as any as ts.Node, node, modifier) as any);
            continue;
        }
        if (node[key] && (node[key] as any).length && (node[key] as any)[0].kind) {
            clone[key] = (node[key] as any as ts.Node[]).map(item => cloneDeep(item, node, modifier)) as any;
            continue;
        }
        clone[key] = node[key];
    }
    (clone as any).src = node;
    return clone;
};

function createSynthesizedNode(like: ts.Node) {
    const node = ts.createNode(like.kind, -1, -1);
    node.flags |= like.flags | 8 /* Synthesized */;
    return node;
}