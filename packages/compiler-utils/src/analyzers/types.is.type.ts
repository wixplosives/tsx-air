import isString from 'lodash/isString';
import * as analyzed from './types';
import ts from 'typescript';
import { isNumber } from 'lodash';

export function isAnalyzed(node: any): node is analyzed.JsxAttribute {
    return typeof node.kind === 'string' && isNumber(node.sourceAstNode?.kind) && isNumber(node.sourceAstNode?.flags);
}

export function isFuncDef(node:any): node is analyzed.FuncDefinition {
    return  node.kind === 'FuncDefinition';
}

export function isJsxAttribute(node: any): node is analyzed.JsxAttribute {
    return node.kind === 'JsxAttribute';
}

export function isJsxComponent(node: any): node is analyzed.JsxComponent {
    return node?.kind === 'JsxComponent';
}

export function isJsxExpression(node: any): node is analyzed.JsxExpression {
    return node?.kind === 'JsxExpression';
}

export function isJsxFragment(node: any): node is analyzed.JsxFragment {
    return node?.kind === 'JsxFragment';
}

export function isJsxRoot(node: any): node is analyzed.JsxRoot {
    return node?.kind === 'JsxRoot';
}

export function isCompDefinition(node: any): node is analyzed.CompDefinition {
    return node?.kind === 'CompDefinition';
}

export function isHookDef(node: any): node is analyzed.HookDefinition {
    return node?.kind === 'HookDefinition';
}

export function isParameter(node: any): node is analyzed.Parameter {
    return node?.kind === 'Parameter';
}

export function isTsxFile(node: any): node is analyzed.TsxFile {
    return node?.kind === 'file';
}

export function isImport(node: any): node is analyzed.Import {
    return node?.kind === 'import';
}

export function isImportSpecifier(node: any): node is analyzed.ImportSpecifierInfo {
    return node && node.kind === 'importSpecifier';
}

export function isReExport(node: any): node is analyzed.ReExport {
    return node?.kind === 'reExport';
}

export function isExportSpecifier(node: any): node is analyzed.ExportSpecifierInfo {
    return node?.kind === 'exportSpecifier';
}


export function hasError(node: analyzed.AnalyzedNode): node is analyzed.AnalysisError {
    return node && node.kind === 'error';
}

export function isTsxAirNode(x: any): x is analyzed.AnalyzedNode {
    return x && isString(x.kind) && x.sourceAstNode;
}

export function isNotNull<T extends analyzed.AnalyzedNode>(input: null | undefined | T): input is T {
    return !!input;
}

export function isTsJsxRoot(node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment {
    return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

export function isTsFunction(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression {
    return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}