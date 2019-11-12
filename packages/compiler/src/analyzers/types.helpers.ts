import { isArray } from 'util';
import { TsxErrorType, TsxAirNodeError, TsxAirNode, AnalyzerResult } from './types';
import ts from 'typescript';
import { isString, flatten } from 'lodash';
export function errorNode<T extends TsxAirNode>(sourceAstNode: ts.Node, message: string, type: TsxErrorType = 'code'): AnalyzerResult<T> {
    const tsxAir: TsxAirNodeError = {
        kind: 'error',
        sourceAstNode,
        errors: [{ message, type }]
    };
    return {
        tsxAir,
        astToTsxAir: new Map([[sourceAstNode, [tsxAir]]]) as Map<ts.Node, TsxAirNode[]>
    };
}

export function hasError(node: TsxAirNode): node is TsxAirNodeError {
    return node && node.kind === 'error';
}

export function isTsxAirNode(x: any): x is TsxAirNode {
    return x && isString(x.kind) && x.sourceAstNode;
}

export type NodesMap = Map<ts.Node, TsxAirNode[]>;
export function addToNodesMap(target: NodesMap, added: NodesMap|TsxAirNode) {
    if (isTsxAirNode(added)) {
        addNodeToMap(target, added);
    } else {
        flatten([...added.values()]).forEach(i => addNodeToMap(target, i));
    }
}

function addNodeToMap(target: NodesMap, node: TsxAirNode) {
    const { sourceAstNode } = node;
    const nodeResults = target.get(sourceAstNode) || [];
    if (!nodeResults.find(i => i === node)) {
        nodeResults.push(node);
        target.set(sourceAstNode, nodeResults);
    }
}

export function aggregateAstNodeMapping(nodes: TsxAirNode[]): NodesMap {
    const agg = new Map<ts.Node, TsxAirNode[]>();
    const visited = new Set();
    const walk = (node: any) => {
        if (visited.has(node)) {
            return;
        }
        visited.add(node);
        if (isTsxAirNode(node)) {
            const { sourceAstNode } = node;
            const nodeResults = agg.get(sourceAstNode) || [];
            agg.set(sourceAstNode, [...nodeResults, node]);

            Object.entries(node).forEach(([_, v]) => {
                walk(node);
                if (isArray(v)) {
                    v.forEach(walk);
                }
            });
        }
    };

    nodes.forEach(walk);
    return agg;
}