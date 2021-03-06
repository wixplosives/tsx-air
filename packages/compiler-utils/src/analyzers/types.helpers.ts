import { TsxErrorType, AnalysisError, AnalyzedNode, AnalyzerResult } from './types';
import ts from 'typescript';
import isArray from 'lodash/isArray';
import flatten from 'lodash/flatten';
import { NodeMetaData } from '../ast-utils/scanner';
import { hasError, isNotNull, isTsxAirNode } from './types.is.type';

export function errorNode<T extends AnalyzedNode>(sourceAstNode: ts.Node, message: string, type: TsxErrorType = 'code'): AnalyzerResult<T> {
    const tsxAir: AnalysisError = {
        kind: 'error',
        sourceAstNode,
        errors: [{ message, type }]
    };
    return {
        tsxAir,
        astToTsxAir: new Map([[sourceAstNode, [tsxAir]]]) as Map<ts.Node, AnalyzedNode[]>
    };
}

export function asAnalyzerResult<T extends AnalyzedNode>(analyzedNode: T): AnalyzerResult<T> {
    return {
        tsxAir: analyzedNode,
        astToTsxAir: new Map([[analyzedNode.sourceAstNode, [analyzedNode]]]) as Map<ts.Node, AnalyzedNode[]>
    };
}


export type NodesMap = Map<ts.Node, AnalyzedNode[]>;

export function addToNodesMap(target: NodesMap, added: NodesMap | AnalyzedNode) {
    if (isTsxAirNode(added)) {
        addNodeToMap(target, added);
    } else {
        flatten([...added.values()]).forEach(i => addNodeToMap(target, i));
    }
}

function addNodeToMap(target: NodesMap, node: AnalyzedNode) {
    const { sourceAstNode } = node;
    const nodeResults = target.get(sourceAstNode) || [];
    if (!nodeResults.find(i => i === node)) {
        nodeResults.push(node);
        target.set(sourceAstNode, nodeResults);
    }
}

export function aggregateAstNodeMapping(nodes: AnalyzedNode[]): NodesMap {
    const agg = new Map<ts.Node, AnalyzedNode[]>();
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

export function filterResults<T extends AnalyzedNode<any>>(result: Array<NodeMetaData<AnalyzerResult<T>>>): T[] {
    const specifiersInfo = result.map(res => {
        const inner = res.metadata.tsxAir;
        if (hasError(inner)) {
            return null;
        }
        return inner;
    });
    return specifiersInfo.filter(isNotNull);
}