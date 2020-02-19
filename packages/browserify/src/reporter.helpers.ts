import { importedTsx } from './../fixtures/local.imports/b';
import ts from 'typescript';
import { tsKindInverse, printAstText, printAstFullText } from '@tsx-air/compiler-utils';
// @ts-ignore
import { DateTime } from 'neo4j-driver/lib/temporal-types.js';
import nodeFs from '@file-services/node';
import { packagePath } from '@tsx-air/utils/packages';
import { parsedNode } from './reporter.queries';
import { QueryResult } from 'neo4j-driver';
export { importedTsx };

export const getNodeParams = (node: ts.Node, fileName: string) => {
    let rel;
    if (node.parent) {
        for (const key in node.parent) {
            if ((node.parent as any)[key] === node) {
                rel = key;
                break;
            }
        }
    }
    const text = rel === 'moduleSpecifier'
        ? filePath(printAstText(node).replace(/^.(.*).$/g, '$1'), nodeFs.dirname(fileName))
        : printAstText(node);

    return {
        rel,
        kind: tsKindInverse[node.kind],
        pos: node.pos,
        fullPos: node.pos > -1 ? node.getFullStart() : -1,
        end: node.end,
        text,
        fullText: printAstFullText(node),
    };
};

const filePath = (file: string, from?: string) => {
    const base = packagePath('@tsx-air/browserify', '..', '..');
    if (file.startsWith('.')) {
        const fileAbsPath = nodeFs.resolve(from || process.cwd(), file);
        return nodeFs.relative(base, fileAbsPath);
    }
    if (file.startsWith('/')) {
        return nodeFs.relative(base, file);
    }
    return file;
};

export const fileDetails = (file: string, from?: string) => {
    return ({
        path: filePath(file, from),
        // TODO make async
        modified: DateTime.fromStandardDate(nodeFs.statSync(file).mtime)
    });
};

export const mapToId = (res: QueryResult) => res.records[0]?.get(0);

export const createVisitor = (fileId: Promise<any>, parentId: Promise<any>,
    fileName: string,
    ctx: any, run: (q: string, d: any) => Promise<any>) => {
    return (node: ts.Node) => {
        const nodeId = Promise.all([
            fileId,
            parentId
        ]).then(([f, p]) =>
            run(...parsedNode(f, p, getNodeParams(node, fileName)))

                .then(mapToId));
        ts.visitEachChild(node, createVisitor(fileId, nodeId, fileName, ctx, run), ctx);
        return node;
    };
};