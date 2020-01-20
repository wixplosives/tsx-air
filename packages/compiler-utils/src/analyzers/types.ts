import ts from 'typescript';

export interface AnalyzerResult<T extends TsxAirNode> {
    tsxAir: T | TsxAirNodeError;
    astToTsxAir: Map<ts.Node, TsxAirNode[]>;
}

export type Analyzer<T extends TsxAirNode> = (node: ts.Node) => AnalyzerResult<T>;

export type TsxAirNodeType = 'CompDefinition' | 'JsxFragment' |
    'JsxRoot' | 'JsxExpression' | 'file' | 'import' |
    'JsxComponent' | 'JsxAttribute' | 'CompProps' | 'error' | 'importSpecifier' |
    'exportSpecifier' | 'reExport' | 'funcDefinition' | 'storeDefinition';
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

export interface NodeWithVariables<T extends ts.Node = ts.Node> extends TsxAirNode<T> {
    variables: UsedVariables;
    /** members including internal closures */
    aggregatedVariables: UsedVariables;
}

export interface TsxFile extends NodeWithVariables<ts.SourceFile> {
    kind: 'file';
    compDefinitions: CompDefinition[];
    imports: Import[];
    reExports: ReExport[];
}

export interface Import extends TsxAirNode<ts.ImportDeclaration> {
    kind: 'import';
    module: string;
    imports: ImportSpecifierInfo[];
    defaultLocalName?: string;
    nameSpace?: string;
}

interface Specifier {
    localName: string;
    externalName: string;
}
export interface ImportSpecifierInfo extends TsxAirNode<ts.ImportSpecifier> {
    kind: 'importSpecifier';
}
export interface ImportSpecifierInfo extends Specifier {
}

export interface ExportSpecifierInfo extends TsxAirNode<ts.ExportSpecifier> {
    kind: 'exportSpecifier';
}
export interface ExportSpecifierInfo extends Specifier { }

export interface ReExport extends TsxAirNode<ts.ExportDeclaration> {
    kind: 'reExport';
    module: string;
    exports?: ExportSpecifierInfo[];
}
export interface FuncDefinition extends NodeWithVariables<ts.FunctionExpression | ts.ArrowFunction> {
    kind: 'funcDefinition';
    name?: string;
    arguments?: string[];
    jsxRoots: JsxRoot[];
    definedFunctions: FuncDefinition[];
}



export interface StoreDefinition extends NodeWithVariables<ts.CallExpression | ts.ArrowFunction> {
    kind: 'storeDefinition';
    name: string;
    keys: string[];
}
export interface CompDefinition extends NodeWithVariables<ts.CallExpression> {
    kind: 'CompDefinition';
    name?: string;
    propsIdentifier?: string;
    usedProps: CompProps[];
    jsxRoots: JsxRoot[];
    functions: FuncDefinition[];
    stores: StoreDefinition[];
}

export interface CompProps extends TsxAirNode<ts.Identifier | ts.PropertyAccessExpression> {
    kind: 'CompProps';
    name: string;
}

export interface JsxRoot extends NodeWithVariables<JsxElm> {
    kind: 'JsxRoot';
    expressions: JsxExpression[];
    components: JsxComponent[];
}

export interface JsxFragment extends NodeWithVariables<ts.JsxFragment> {
    kind: 'JsxFragment';
    expressions: JsxExpression[];
    components: JsxComponent[];
    items: JsxRoot[];
}

export interface JsxExpression extends NodeWithVariables<ts.JsxExpression> {
    kind: 'JsxExpression';
    dependencies: CompProps[];
    expression: string;
}

export interface JsxComponent extends NodeWithVariables<JsxElm> {
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

export type TsNodeToAirNode<T extends ts.Node> = T extends ts.JsxAttributeLike ? JsxAttribute :
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
    return node?.kind === 'JsxComponent';
}

export function isJsxExpression(node: any): node is JsxExpression {
    return node?.kind === 'JsxExpression';
}

export function isJsxFragment(node: any): node is JsxFragment {
    return node?.kind === 'JsxFragment';
}

export function isJsxRoot(node: any): node is JsxRoot {
    return node?.kind === 'JsxRoot';
}

export function isCompProps(node: any): node is CompProps {
    return node?.kind === 'CompProps';
}

export function isCompDefinition(node: any): node is CompDefinition {
    return node?.kind === 'CompDefinition';
}

export function isTsxFile(node: any): node is TsxFile {
    return node?.kind === 'file';
}

export function isImport(node: any): node is Import {
    return node?.kind === 'import';
}

export function isImportSpecifier(node: any): node is ImportSpecifierInfo {
    return node && node.kind === 'importSpecifier';
}

export function isReExport(node: any): node is ReExport {
    return node?.kind === 'reExport';
}

export function isExportSpecifier(node: any): node is ExportSpecifierInfo {
    return node?.kind === 'exportSpecifier';
}

export interface RecursiveMap {
    [key: string]: RecursiveMap;
}


export interface UsedVariables {
    accessed: RecursiveMap;
    modified: RecursiveMap;
    defined: RecursiveMap;
}


export function isTsJsxRoot(node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment {
    return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || isJsxFragment(node);
}
export function isTsFunction(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression {
    return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

