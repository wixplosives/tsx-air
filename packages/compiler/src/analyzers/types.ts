import { TsxAirNode } from './types';
import ts from 'typescript';

export interface AnalyzerResult<T extends TsxAirNode> {
    tsxAir: T | TsxAirNodeError;
    astToTsxAir: Map<ts.Node, TsxAirNode[]>;
}

export type Analyzer<T extends TsxAirNode> = (node: ts.Node) => AnalyzerResult<T>;

export type TsxAirNodeType = 'CompDefinition' | 'JsxFragment' |
    'JsxRoot' | 'JsxExpression' | 'file' | 'import' |
    'JsxComponent' | 'JsxAttribute' | 'CompProps' | 'error';
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
    imports: Import[];
}

export interface Import extends TsxAirNode<ts.ImportDeclaration> {
    kind: 'import';
    module: string;
    imports?: string;
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

export interface JsxComponent extends TsxAirNode<JsxElm> {
    kind: 'JsxComponent';
    name: string;
    props: JsxAttribute[];
    children?: JsxFragment;
    dependencies: CompProps[];
}

export interface JsxAttribute extends TsxAirNode<ts.JsxAttributeLike> {
    kind: 'JsxAttribute';
    name: string;
    value: string | JsxExpression | true;
}

export type tsNodeToAirNode<T extends ts.Node> = T extends ts.JsxAttributeLike ? JsxAttribute :
    T extends JsxElm ? JsxComponent | JsxRoot :
    T extends ts.JsxExpression ? JsxExpression :
    T extends ts.JsxFragment ? JsxFragment | JsxRoot :
    T extends ts.Identifier | ts.PropertyAccessExpression ? CompProps :
    T extends ts.CallExpression ? CompDefinition :
    T extends ts.SourceFile ? TsxFile : TsxAirNode<T>;


export function isJsxAttribute(node: any): node is JsxAttribute {
    return node.kind === 'JsxAttribute';
}

export function isJsxComponent(node: any): node is JsxComponent {
    return node && node.kind === 'JsxComponent';
}

export function isJsxExpression(node: any): node is JsxExpression {
    return node && node.kind === 'JsxExpression';
}

export function isJsxFragment(node: any): node is JsxFragment {
    return node && node.kind === 'JsxFragment';
}

export function isJsxRoot(node: any): node is JsxRoot {
    return node && node.kind === 'JsxRoot';
}

export function isCompProps(node: any): node is CompProps {
    return node && node.kind === 'CompProps';
}

export function isCompDefinition(node: any): node is CompDefinition {
    return node && node.kind === 'CompDefinition';
}

export function isTsxFile(node: any): node is TsxFile {
    return node && node.kind === 'file';
}

export function isImport(node: any): node is Import {
    return node && node.kind === 'import';
}