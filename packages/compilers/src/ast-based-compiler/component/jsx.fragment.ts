import ts from "typescript";
import { CompDefinition, JsxRoot, cloneDeep, isJsxRoot, asCode, asAst, cMethod, isComponentTag } from "@tsx-air/compiler-utils";
import { postAnalysisData } from "../../common/post.analysis.data";
import get from "lodash/get";

export const parseFragments = (comp: CompDefinition) => {
    // const fragments: FragmentData[] = [];
    return [..._parseFragments(comp)];
};

function* _parseFragments(comp: CompDefinition) {
    const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    for (const s of statements) {
        yield* processStatementJsxRoots(comp, s);
    }
}

function* processStatementJsxRoots(comp: CompDefinition, node: ts.Node): Generator<FragmentData> {
    const roots = _getJsxRoots(comp, node);
    for (const root of roots) {
        const hasInnerFragments = root.expressions.some(exp => exp.jsxRoots.length > 0);
        const counter = getCounter(comp);
        const elm = root.sourceAstNode;
        const tagName = ts.isJsxSelfClosingElement(elm)
            ? elm.tagName
            : (elm as ts.JsxElement).openingElement.tagName;
        
        const elmType = asCode(tagName);
        const isComponent = isComponentTag(tagName);
        const frag = assignFragmentData(root, {
            id: `${elmType}${counter}`,
            index: counter,
            hasInnerFragments,
            root,
            isComponent,
            src: root.sourceAstNode
        });
        frag.src = node;
        if (frag.index === counter) {
            setCounter(comp, counter + 1);
        }
        yield frag;
    }
}

const assignFragmentData = (root: JsxRoot, dataIfNew: FragmentData) =>
    postAnalysisData.writeIfNew(root, 'fragmentId', dataIfNew);
const getCounter = (comp: CompDefinition) =>
    postAnalysisData.read(comp, 'fragmentCount', 0);
const setCounter = (comp: CompDefinition, counter: number) =>
    postAnalysisData.write(comp, 'fragmentCount', counter);

export function getFragmentData(root: JsxRoot | ts.Node): FragmentData | undefined {
    return isJsxRoot(root)
        ? postAnalysisData.read(root, 'fragmentId')
        : postAnalysisData.readByAst(root, 'fragmentId');
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

export interface FragmentData {
    isComponent: boolean;
    index: number;
    id: string;
    root: JsxRoot;
    hasInnerFragments: boolean;
    src: ts.Node;
}