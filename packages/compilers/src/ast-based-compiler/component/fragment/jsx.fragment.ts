import ts from 'typescript';
import { JsxRoot, isJsxRoot, asCode, UserCode, FuncDefinition, JsxExpression } from '@tsx-air/compiler-utils';
import { postAnalysisData } from '../../../common/post.analysis.data';
import { isComponentTag } from '@tsx-air/utils';

export function parseFragments(code: UserCode) {
    // const allFragments: FragmentData[] = [];
    // const statements =
    //     (get(code.sourceAstNode.arguments[0], 'body.statements')
    //         || [get(code.sourceAstNode.arguments[0], 'body')]) as ts.Statement[];

    // for (const s of statements) {
    //     yield* processStatementJsxRoots(code, s, allFragments);
    // }
    return findFragments(code);
}

function findFragments(code: UserCode) {
    const allFragments: FragmentData[] = [];
    for (const root of getAllRoots(code)) {
        const hasInnerFragments = 
            root.expressions.some(exp => exp.jsxRoots.length > 0);
        const counter = getCounter(code);
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
            allFragments,
            code
        });
        allFragments.push(frag);

        if (frag.index === counter) {
            setCounter(code, counter + 1);
        }
    }
    return allFragments;
}

function* getAllRoots(code:UserCode):Generator<JsxRoot> {
    for(const fn of code.functions) {
        yield* _getAllRoots(fn);
    }
    yield* _getAllRoots(code);
}

function* _getAllRoots(root: {
    functions?: FuncDefinition[],
    jsxRoots?: JsxRoot[],
    expressions?: JsxExpression[]
}):Generator<JsxRoot> {
    if (root.expressions) {
        for (const ex of root.expressions) {
            yield* _getAllRoots(ex);
        }
    }
    if (root.jsxRoots) {
        for (const jsx of root.jsxRoots) {
            yield* _getAllRoots(jsx);
            yield jsx;
        }
    }
}


const assignFragmentData = (root: JsxRoot, dataIfNew: FragmentData) =>
    postAnalysisData.writeIfNew(root, 'fragmentData', dataIfNew);
const getCounter = (code: UserCode) =>
    postAnalysisData.read(code, 'fragmentCount', 0);
const setCounter = (code: UserCode, counter: number) =>
    postAnalysisData.write(code, 'fragmentCount', counter);

export function getFragmentData(root: JsxRoot | ts.Node): FragmentData | undefined {
    return isJsxRoot(root)
        ? postAnalysisData.read(root, 'fragmentData')
        : postAnalysisData.readByAst(root, 'fragmentData');
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

export function isDecedentOf(child: ts.Node, parent: ts.Node): boolean {
    if (!child || !parent) {
        return false;
    }
    return child === parent || isDecedentOf(child.parent, parent);
}

export function* _getJsxRoots(code: UserCode, s: ts.Node) {
    for (const r of code.jsxRoots) {
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
    code: UserCode;
    allFragments: FragmentData[];
}