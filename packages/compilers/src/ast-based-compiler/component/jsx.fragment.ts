import ts from "typescript";
import { CompDefinition, JsxRoot, cloneDeep, isJsxRoot, asCode, asAst, cMethod } from "@tsx-air/compiler-utils";
import { postAnalysisData } from "../../common/post.analysis.data";
import { generateFragmentToString } from "./jsx.string.template";
import { get, chain } from "lodash";
import { cStateCall } from "./function";
import { Component, Fragment } from "@tsx-air/framework";


export const fragId = (prefix: string, index: number) =>
    `${prefix}$${index}`; ``

export const parseFragments = (comp: CompDefinition) => {
    const fragments:Record<string, Fragment> = {};
    for (const frag of _parseFragments(comp)) {
        const elm = frag.root.sourceAstNode;
        const elmType = asCode(
            ts.isJsxSelfClosingElement(elm)
                ? elm.tagName
                : elm.openingElement.tagName
        );
        fragments[`${elmType}${frag.index}`] = 
    }
};

function* _parseFragments(comp: CompDefinition) {
    const statements = get(comp.sourceAstNode.arguments[0], 'body.statements') as ts.Statement[];
    for (const s of statements) {
        yield* processStatementFragments(comp, s, '');
    }
}

function* processStatementFragments(comp: CompDefinition, node: ts.Node, prefix: string): Generator<FragmentData> {
    const roots = _getJsxRoots(comp, node);
    for (const root of roots) {
        const hasInnerFragments = root.expressions.some(exp => exp.jsxRoots.length > 0);
        const counter = getCounter(comp);

        const frag = assignFragmentData(root, {
            id: fragId(`${comp.name}${prefix}`, counter),
            index: counter,
            hasInnerFragments,
            root,
            src: []
        });
        frag.src.push(node)
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

export const generateFragment = (comp: CompDefinition, frag: FragmentData) =>
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

export interface FragmentData {
    index: number;
    id: string;
    root: JsxRoot;
    hasInnerFragments: boolean;
    src: ts.Node[]
}

