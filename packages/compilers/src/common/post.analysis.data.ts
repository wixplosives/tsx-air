import { AnalyzedNode, getNodeSrc } from '@tsx-air/compiler-utils';
import isFunction from 'lodash/isFunction';
import ts from 'typescript';

type Modifier<T> = (mod: T | undefined) => T;
type NotFunc<T> = T extends () => any ? never : T;

export class PostAnalysisData {
    private byAnalyzed = new Map<AnalyzedNode, any>();
    private byAst = new Map<ts.Node, any>();

    public write<T = any>(node: AnalyzedNode, key: string, value: NotFunc<T> | Modifier<T>, override = true): T {
        const nodeData = this.byAnalyzed.get(node) || {};
        this.byAnalyzed.set(node, nodeData);
        this.byAst.set(node.sourceAstNode, nodeData);
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
        return this.write(node, key, value, false);
    }

    public read<T = any>(node: AnalyzedNode, key: string, _default: T): T;
    public read<T = any>(node: AnalyzedNode, key: string): T | undefined;
    public read<T = any>(node: AnalyzedNode, key: string, _default?: T | undefined): T | undefined {
        return this._read(this.byAnalyzed, node, key, _default);
    }

    public readByAst<T = any>(node: ts.Node, key: string, _default?: T): T | undefined {
        return this._read(this.byAst, getNodeSrc(node), key, _default);
    }

    private _read<N, T = any>(map: Map<N, any>, node: N, key: string, _default?: T): T | undefined {
        const nodeData = map.get(node);
        return nodeData && key in nodeData
            ? nodeData[key] as T
            : _default;
    }
}

export const postAnalysisData = new PostAnalysisData();
