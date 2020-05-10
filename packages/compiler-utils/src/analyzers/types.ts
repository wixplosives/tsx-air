import ts from 'typescript';

export interface AnalyzerResult<T extends AnalyzedNode> {
    tsxAir: T | AnalysisError;
    astToTsxAir: Map<ts.Node, AnalyzedNode[]>;
}

export type Analyzer<T extends AnalyzedNode> = (node: ts.Node) => AnalyzerResult<T>;

export type AnalyzedNodeType = 'CompDefinition' | 'JsxFragment' |
    'JsxRoot' | 'JsxExpression' | 'file' | 'import' |
    'JsxComponent' | 'JsxAttribute' | 'CompProps' | 'error' | 'importSpecifier' |
    'exportSpecifier' | 'reExport' | 'funcDefinition' | 'storeDefinition' |
    'Namespace' | 'UsedNamespaceProperty'
    ;
export type JsxElm = ts.JsxElement | ts.JsxSelfClosingElement;
export type TsxErrorType = 'internal' | 'code' | 'unsupported' | 'not supported yet';

export interface TsxAirError {
    message: string;
    type: TsxErrorType;
}

export interface AnalysisError extends AnalyzedNode<ts.Node> {
    kind: 'error';
}

export interface AnalyzedNode<T extends ts.Node = ts.Node> {
    kind: AnalyzedNodeType;
    sourceAstNode: T;
    errors?: TsxAirError[];
}

export interface NodeWithVariables<T extends ts.Node = ts.Node> extends AnalyzedNode<T> {
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

export interface Import extends AnalyzedNode<ts.ImportDeclaration> {
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
export interface ImportSpecifierInfo extends AnalyzedNode<ts.ImportSpecifier> {
    kind: 'importSpecifier';
}
export interface ImportSpecifierInfo extends Specifier {
}

export interface ExportSpecifierInfo extends AnalyzedNode<ts.ExportSpecifier> {
    kind: 'exportSpecifier';
}
export interface ExportSpecifierInfo extends Specifier { }

export interface ReExport extends AnalyzedNode<ts.ExportDeclaration> {
    kind: 'reExport';
    module: string;
    exports?: ExportSpecifierInfo[];
}

export interface FuncDefinition extends NodeWithVariables<ts.FunctionExpression | ts.ArrowFunction> {
    kind: 'funcDefinition';
    name?: string;
    arguments: string[];
    jsxRoots: JsxRoot[];
    definedFunctions: FuncDefinition[];
}

export interface StoreDefinition extends Namespace {
    kind: 'storeDefinition';
    keys: string[];
}

export interface CompDefinition extends NodeWithVariables<ts.CallExpression> {
    kind: 'CompDefinition';
    name: string;
    propsIdentifier?: string;
    jsxRoots: JsxRoot[];
    functions: FuncDefinition[];
    stores: StoreDefinition[];
    volatileVariables: string[];
}

export interface Namespace extends NodeWithVariables<ts.ParameterDeclaration | ts.VariableDeclaration> {
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
    expression: string;
}

export interface JsxComponent extends NodeWithVariables<JsxElm> {
    kind: 'JsxComponent';
    name: string;
    props: JsxAttribute[];
    children?: JsxFragment;
    // dependencies: CompProps[];
}

export interface JsxAttribute extends AnalyzedNode<ts.JsxAttributeLike> {
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
    T extends ts.SourceFile ? TsxFile : AnalyzedNode<T>;


export type RecursiveMap<RefType = ts.Node> = RM<RefType> & { $refs?: RefType[] };
interface RM<RefType> {
    [key: string]: RecursiveMap<RefType>;
}

export const func: RecursiveMap = {};
export interface UsedVariables<RefType = ts.Node> {
    read: RecursiveMap<RefType>;
    accessed: RecursiveMap<RefType>;
    modified: RecursiveMap<RefType>;
    defined: RecursiveMap<RefType>;
    executed: RecursiveMap<RefType>;
}

export interface UsedInScope<RefType = ts.Node> {
    props?: RecursiveMap<RefType>;
    stores?: RecursiveMap<RefType>;
    volatile?: RecursiveMap<RefType>;
}