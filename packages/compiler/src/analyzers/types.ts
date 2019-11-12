import { TsxAirNode } from './types';
import ts from 'typescript';

export interface AnalyzerResult<T> {
    tsxAir: T | TsxAirNodeError;
    astToTsxAir: Map<ts.Node, TsxAirNode[]>;
}

export type Analyzer<N extends ts.Node = ts.Node, T extends TsxAirNode<N> = TsxAirNode<N>> = (node: N) => AnalyzerResult<T>;

export type TsxAirNodeType = 'CompDefinition' | 'JsxFragment' |
    'JsxRoot' | 'JsxExpression' | 'file' |
    'JsxComponent' | 'JsxComponentProps' | 'CompProps' | 'error';
export type JsxElm = ts.JsxElement | ts.JsxSelfClosingElement;
export type TsxErrorType = 'internal' | 'code' | 'unsupported' | 'not supported yet';

interface TsxAirError {
    message: string;
    type: TsxErrorType;
}

export interface TsxAirNodeError extends TsxAirNode<ts.Node> {
    kind: 'error';
}

export interface TsxAirNode<T extends ts.Node = ts.Node> {
    kind: TsxAirNodeType;
    sourceAstNode: T;
    errors?: TsxAirError[];
}

export interface TsxFile extends TsxAirNode<ts.SourceFile> {
    kind: 'file';
    compDefinitions: CompDefinition[];
}

export interface CompDefinition extends TsxAirNode<ts.CallExpression> {
    kind: 'CompDefinition';
    name?: string;
    propsIdentifier?: string;
    usedProps: CompProps[];
    jsxRoots: JsxRoot[];
}

export interface CompProps extends TsxAirNode<ts.Identifier | ts.PropertyAccessExpression> {
    kind: 'CompProps';
    name: string;
}

export interface JsxRoot extends TsxAirNode<JsxElm> {
    kind: 'JsxRoot';
    expressions: JsxExpression[];
    components: JsxComponent[];
}

export interface JsxFragment extends TsxAirNode<ts.JsxFragment> {
    kind: 'JsxFragment';
    expressions: JsxExpression[];
    components: JsxComponent[];
    items: JsxRoot[];
}

export interface JsxExpression extends TsxAirNode<ts.JsxExpression> {
    kind: 'JsxExpression';
    dependencies: CompProps[];
    expression: string;
}

export function isJsxExpression(x: any): x is JsxExpression {
    return x.kind === 'JsxExpression' && x.expression && x.sourceAstNode;
}

export interface JsxComponent extends TsxAirNode<JsxElm> {
    kind: 'JsxComponent';
    name: string;
    props: JsxComponentProps[];
    children?: JsxFragment;
    dependencies: CompProps[];
}

export interface JsxComponentProps extends TsxAirNode<ts.JsxAttributeLike> {
    kind: 'JsxComponentProps';
    name: string;
    value: string | JsxExpression;
}


export type tsNodeToAirNode<T extends ts.Node> = T extends ts.JsxAttributeLike ? JsxComponentProps :
    T extends JsxElm ? JsxComponent :
    T extends ts.JsxExpression ? JsxExpression :
    T extends ts.JsxFragment ? JsxFragment | JsxRoot :
    T extends ts.Identifier | ts.PropertyAccessExpression ? CompProps :
    T extends ts.CallExpression ? CompDefinition :
    T extends ts.SourceFile ? TsxFile : TsxAirNode<T>;


export function isJsxComponentProps(node: TsxAirNode<any>): node is JsxComponentProps {
    return node.kind === 'JsxComponentProps';
}

export function isJsxComponent(node: TsxAirNode<any>): node is JsxComponent {
    return node.kind === 'JsxComponent';
}

export function isJsxExpression(node: TsxAirNode<any>): node is JsxExpression {
    return node.kind === 'JsxExpression';
}

export function isJsxFragment(node: TsxAirNode<any>): node is JsxFragment {
    return node.kind === 'JsxFragment';
}

export function isJsxRoot(node: TsxAirNode<any>): node is JsxRoot {
    return node.kind === 'JsxRoot';
}

export function isCompProps(node: TsxAirNode<any>): node is CompProps {
    return node.kind === 'CompProps';
}

export function isCompDefinition(node: TsxAirNode<any>): node is CompDefinition {
    return node.kind === 'CompDefinition';
}

export function isTsxFile(node: TsxAirNode<any>): node is TsxFile {
    return node.kind === 'file';
}