import { AnalyzedNode, JsxExpression, FuncDefinition, CompDefinition, UsedVariables, NodeWithVariables } from '@tsx-air/compiler-utils';
import isFunction from 'lodash/isFunction';

type Modifier<T> = (mod: T | undefined) => T;
type NotFunc<T> = T extends () => any ? never : T;

export class PostAnalysisData {
    private _data = new Map<AnalyzedNode, any>();
    public write(node: AnalyzedNode, key: 'name', value: string, override?: boolean): string;
    public write(node: AnalyzedNode, key: 'handlerOf', value: JsxExpression[], override?: boolean): JsxExpression[];
    public write(node: AnalyzedNode, key: 'handler', value: FuncDefinition, override?: boolean): FuncDefinition;
    public write(node: CompDefinition, key: 'lambdaCount', modifier: Modifier<number>):number;
    public write<T>(node: AnalyzedNode, key: string, modifier: Modifier<T>, override: true): T;
    public write<T>(node: AnalyzedNode, key: string, modifier: NotFunc<T>, override: boolean): T;
    public write<T=any>(node: AnalyzedNode, key: string, value: NotFunc<T> | Modifier<T>, override = true): T {
        const nodeData = this._data.get(node) || {};
        this._data.set(node, nodeData);
        if (isFunction(value)) {
            nodeData[key] = value(nodeData[key]);
        } else {
            if (override) {
                nodeData[key] = value;
            } else {
                if (!(key in nodeData)) {
                    nodeData[key] = value;
                }
            }
        }
        return nodeData[key] as T;
    }
    public writeIfNew<T = any>(node: AnalyzedNode, key: string, value: NotFunc<T>): T {        
        return this.write(node, key, value, true);
    }
    public read(node: NodeWithVariables, key: 'dependencies', _default?:string[]): string[];
    public read(node: AnalyzedNode, key: 'name', _default?: string): string | undefined;
    public read(node: AnalyzedNode, key: 'handlerOf', _default?: JsxExpression[]): JsxExpression[] | undefined;
    public read(node: AnalyzedNode, key: 'handler', _default: FuncDefinition): FuncDefinition;
    public read<T = any>(node: AnalyzedNode, key: string, _default?: T | undefined): T | undefined {
        const nodeData = this._data.get(node);
        return nodeData && key in nodeData
            ? nodeData[key] as T
            : _default;
    }
}

export const postAnalysisData = new PostAnalysisData();
