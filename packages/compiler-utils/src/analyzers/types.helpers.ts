import { TsxErrorType, TsxAirNodeError, TsxAirNode, AnalyzerResult } from './types';
import ts from 'typescript';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import flatten from 'lodash/flatten';
import { NodeMetaData } from '../astUtils/scanner';
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

export function asAnalyzerResult<T extends TsxAirNode>(analyzedNode: T): AnalyzerResult<T> {
    return {
        tsxAir: analyzedNode,
        astToTsxAir: new Map([[analyzedNode.sourceAstNode, [analyzedNode]]]) as Map<ts.Node, TsxAirNode[]>
    };
}

export function hasError(node: TsxAirNode): node is TsxAirNodeError {
    return node && node.kind === 'error';
}

export function isTsxAirNode(x: any): x is TsxAirNode {
    return x && isString(x.kind) && x.sourceAstNode;
}

export type NodesMap = Map<ts.Node, TsxAirNode[]>;
export function addToNodesMap(target: NodesMap, added: NodesMap | TsxAirNode) {
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

export function isNotNull<T extends TsxAirNode>(input: null | undefined | T): input is T {
    return !!input;
}

export function filterResults<T extends TsxAirNode<any>>(result: Array<NodeMetaData<AnalyzerResult<T>>>): T[] {
    const specifiersInfo = result.map(res => {
        const inner = res.metadata.tsxAir;
        if (hasError(inner)) {
            return null;
        }
        return inner;
    });
    return specifiersInfo.filter(isNotNull);
}