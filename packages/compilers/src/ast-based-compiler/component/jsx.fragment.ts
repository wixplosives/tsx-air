import ts from "typescript";
import { CompDefinition, JsxRoot, cloneDeep, isJsxRoot, asCode, asAst, cMethod } from "@tsx-air/compiler-utils";
import { postAnalysisData } from "../../common/post.analysis.data";
import { generateFragmentToString } from "./jsx.string.template";
import { get, chain } from "lodash";
import { cStateCall } from "./function";


export const fragId = (prefix: string, index: number) =>
    `${prefix}$${index}`;

export const parseFragments = (comp: CompDefinition) => [..._parseFragments(comp)];

function* _parseFragments(comp: CompDefinition) {
    const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    for (const s of statements) {
        yield* processStatementFragments(comp, s, '');
    }
}

function* processStatementFragments(comp: CompDefinition, node: ts.Node, prefix: string): Generator<Fragment> {
    const roots = [..._getJsxRoots(comp, node)];
    for (const root of roots) {
        const hasInnerFragments = root.expressions.some(exp => exp.jsxRoots.length > 0);
        const counter = postAnalysisData.read(comp, 'fragmentCount', 0);
        const frag = assignFragmentData(root, {
            id: fragId(`${comp.name}${prefix}`, counter),
            index: counter,
            hasInnerFragments,
            root,
            src: []
        });
        frag.src.push(node)
        if (frag.index === counter) {
            postAnalysisData.write(comp, 'fragmentCount', counter + 1);
        }
        yield frag;
    }
}

const assignFragmentData = (root: JsxRoot, dataIfNew: Fragment) =>
    postAnalysisData.writeIfNew(root, 'fragmentId', dataIfNew);

export function getFragmentData(root: JsxRoot | ts.Node): Fragment | undefined {
    return isJsxRoot(root)
        ? postAnalysisData.read(root, 'fragmentId')
        : postAnalysisData.readByAst(root, 'fragmentId');
}

export const generateFragment = (comp: CompDefinition, frag: Fragment) =>
    asAst(`({$key}) => TEMPLATE;`, false, n =>
        (ts.isIdentifier(n) && n.getText() === `TEMPLATE`)
            ? generateFragmentToString(frag.root, comp)
            : undefined);
}

function getModifiedNode(node: ts.Node) {
    return cloneDeep(node, undefined, n => {
        const fragment = getFragmentData(n);
        return (fragment)
            ? asAst(`${fragment.id}`) as ts.StringLiteral
            : undefined;
    });
}

function* innerRootsOf(root: JsxRoot | null): Generator<JsxRoot> {
    if (root) {
        for (const exp of root.expressions) {
            for (const inner of exp.jsxRoots) {
                yield* innerRootsOf(inner);
            }
        }
        yield root;
    }
}

function isDecedentOf(n: ts.Node, p: ts.Node): boolean {
    if (!n || !p) {
        return false;
    }
    return n === p || isDecedentOf(n.parent, p);
}

export function* _getJsxRoots(comp: CompDefinition, s: ts.Node) {
    for (const r of comp.jsxRoots) {
        if (isDecedentOf(r.sourceAstNode, s)) {
            yield* innerRootsOf(r);
        }
    }
}

export interface Fragment {
    index: number;
    id: string;
    root: JsxRoot;
    hasInnerFragments: boolean;
    src: ts.Node[]
}