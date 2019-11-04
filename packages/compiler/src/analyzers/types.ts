import { TsxAirNode } from './types';
import * as ts from 'typescript';

export type Analyzer<N extends ts.Node = ts.Node, T extends TsxAirNode<N> = TsxAirNode<N>> = (node: N) => T | void | undefined;

export type TsxAirNodeType = 'CompDefinition' | 'TrivialComponentDefinition' |
    'JsxRoot' | 'JsxExpression' |
    'JsxComponent' | 'JsxComponentProps' | 'CompProps' | 'error';
export type JsxElm = ts.JsxElement | ts.JsxSelfClosingElement;

export interface TsxAirError {
    message: string;
    type: 'internal' | 'code' | 'unsupported' | 'not supported yet';
}

export interface TsxAirNodeError extends TsxAirNode<ts.Node> {
    kind: 'error';
}

export interface TsxAirNode<T extends ts.Node> {
    kind: TsxAirNodeType;
    sourceAstNode: T;
    errors?: TsxAirError[];
}

export interface TrivialComponentDefinition extends TsxAirNode<ts.CallExpression> {
    kind: 'TrivialComponentDefinition';
    name?: string;
    jsxRoots: JsxRoot[];
}

export interface CompDefinition extends TsxAirNode<ts.CallExpression> {
    kind: 'CompDefinition';
    name?: string;
    propsIdentifier: string;
    usedProps: CompProps[];
    jsxRoots: JsxRoot[];
}

export interface CompProps extends TsxAirNode<ts.Identifier> {
    kind: 'CompProps';
    name: string;
}

export interface JsxRoot extends TsxAirNode<JsxElm> {
    kind: 'JsxRoot';
    expressions: string[];
}

export interface JsxExpression extends TsxAirNode<ts.JsxExpression> {
    kind: 'JsxExpression';
    dependencies: CompProps[];
}

export interface JsxComponent extends TsxAirNode<JsxElm> {
    kind: 'JsxComponent';
    name: string;
    props: JsxComponentProps[];
}

export interface JsxComponentProps extends TsxAirNode<ts.JsxAttribute> {
    kind: 'JsxComponentProps';
    name: string;
    isDynamic: boolean;
    value: string | JsxExpression;
}