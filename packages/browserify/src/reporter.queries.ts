import { Compiler } from '@tsx-air/types';
// @ts-ignore
import { DateTime } from 'neo4j-driver/lib/temporal-types.js';
import { fileDetails } from './reporter.helpers';
import nodeFs from '@file-services/node';

export type Query = (...args: any[]) => [string, object];

export const createNewCompilation: Query = (files: string[], compiler: Compiler) => [`
    MERGE (compiler:Compiler {label: $compilerLabel})            
    WITH compiler
    UNWIND $features AS keywords MERGE (feature:Feature {keywords: keywords}) 
    WITH feature, compiler 
    MERGE (compiler)-[:Supports]->(feature)
    MERGE (compilation:Compilation {timestamp: $time})
    MERGE (compilation)-[:USING]->(compiler)
    WITH compilation
    UNWIND $files AS details MERGE (file:File {path: details.path, modified:details.modified }) 
    MERGE (file)-[:MAIN_FILE]->(compilation)
    RETURN id(compilation)
    `, {
        time: DateTime.fromStandardDate(new Date()),
        files: files.map(f => fileDetails(nodeFs.resolve(process.cwd(), f))),
        compilerLabel: compiler.label,
        features: compiler.features
    }];

export const compilingFile: Query = (compId: any, filename: string) => [`
    MATCH (c:Compilation) WHERE id(c)=$compId
    MERGE (file:File { path: $file.path, modified:$file.modified }) 
    MERGE (c)-[:SOURCE]->(file)
    RETURN id(file)
    `, { compId, file: fileDetails(filename) }];


export const result: Query = (compId: any, filename: string) => [`
    MATCH (c:Compilation) WHERE id(c)=$compId
    CREATE (file:Output { path: $file.path, modified:$file.modified }) 
    MERGE (c)<-[:RESULT]-(file)
    RETURN id(file)
    `, { compId, file: fileDetails(filename) }];


export const parsedNode: Query = (fileId: any, parentId: any, params: any) => [`
    MATCH (file) WHERE id(file) = $fileId 
    MATCH (parent) WHERE id(parent) = $parentId     
    MERGE (node:${params.kind} { text: $text, kind: $kind })
    MERGE (parent)-[:PARENT_OF ${ params.rel ? '{ field: $rel }' : ''}]->(node)
    MERGE (file)-[:CONTAINS { pos: $pos, fullPos: $fullPos, end: $end }]->(node)
    RETURN id(node)
    `, {
    ...params,
    fileId,
    parentId
}];
