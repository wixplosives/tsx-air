import ts from 'typescript';

export interface AnalyzerResult<T extends TsxAirNode> {
    tsxAir: T | TsxAirNodeError;
    astToTsxAir: Map<ts.Node, TsxAirNode[]>;
}

export type Analyzer<T extends TsxAirNode> = (node: ts.Node) => AnalyzerResult<T>;

export type TsxAirNodeType = 'CompDefinition' | 'JsxFragment' |
    'JsxRoot' | 'JsxExpression' | 'file' | 'import' |
    'JsxComponent' | 'JsxAttribute' | 'CompProps' | 'error' | 'importSpecifier' |
    'exportSpecifier' | 'reExport' | 'funcDefinition' | 'storeDefinition' |
    'Namespace' | 'UsedNamespaceProperty'
    ;
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

export interface StoreDefinition extends Namespace {
    kind: 'storeDefinition';
    keys: string[];
}

export interface CompDefinition extends NodeWithVariables<ts.CallExpression> {
    kind: 'CompDefinition';
    name?: string;
    propsIdentifier?: string;
    jsxRoots: JsxRoot[];
    functions: FuncDefinition[];
    stores: StoreDefinition[];
}

export interface Namespace extends NodeWithVariables<ts.ParameterDeclaration | ts.VariableDeclaration> {
    name:string;
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
    expression: string;
}

export interface JsxComponent extends NodeWithVariables<JsxElm> {
    kind: 'JsxComponent';
    name: string;
    props: JsxAttribute[];
    children?: JsxFragment;
    // dependencies: CompProps[];
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
    T extends ts.Identifier | ts.PropertyAccessExpression ? Namespace :
    T extends ts.CallExpression ? CompDefinition :
    T extends ts.SourceFile ? TsxFile : TsxAirNode<T>;


export interface RecursiveMap {
    [key: string]: RecursiveMap;
}

export interface UsedVariables extends RecursiveMap {
    accessed: RecursiveMap;
    modified: RecursiveMap;
    defined: RecursiveMap;
}
