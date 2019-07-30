export interface ScannedJSX {
    kind: 'jsx';
    type: string;
    attributes: Array<{ name: string, value: string | ScannedExpression }>;
    children: ScannedChild[];
    key: string;
    path: number[];
}


export interface ScannedText {
    kind: 'text';
    text: string;
}


export interface ScannedExpression {
    kind: 'expression';
    expression: string;
}

export type ScannedChild = ScannedText | ScannedExpression | ScannedJSX;
