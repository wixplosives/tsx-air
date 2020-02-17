import { cloneDeep } from 'lodash';
import { driver } from 'neo4j-driver';
import { Compiler } from '@tsx-air/types';
import { tsKindInverse } from './reporter.helpers';
import { delay } from '@tsx-air/utils/src';
import ts from 'typescript';

export function createReporter(files: string[], compiler: Compiler) {
    const transformers = cloneDeep(compiler.transformers);
    type Driver = ReturnType<typeof driver>;
    try {
        const drv: Driver = driver('bolt://0.0.0.0:7687');
        const session = drv.session();
        let last: Promise<any> = Promise.resolve();
        const run = (query: string, data: object) => {
            last = last.then(async () => session.run(query, data));
            return last;
        };

        run(`
            ${files.map((f, i) => `
            MERGE (file${i}:File {path: '${f}'}`)})
            MERGE (compiler:Compiler {label:'${compiler.label}'})
            CREATE (comp:Compilation {timestamp: $time})-[:USING]->(compiler)
            ${files.map((_, i) => `MERGE (comp)-[:COMPILED {main:'true'}]->(file${i})`)}            
            `, { time: new Date().toISOString() });

        transformers.before?.unshift(ctx => nd => {
            const { fileName } = nd;
            run(`MERGE (file:File { path: $fileName })`, { fileName });


            const visitor = (node: ts.Node) => {
                const params = {
                    fileName,
                    kind: tsKindInverse[node.kind],
                    pos: node.pos,
                    fullPos: node.getFullStart(),
                    end: node.end,
                    text: node.getText(),
                    fullText: node.getFullText(),
                    parentPos: node.parent?.pos,
                    parentEnd: node.parent?.end,
                    parentFullPos: node.parent?.getFullStart(),
                    parentText: node.getText(),
                };
                if (node.parent.parent) {
                    console.log('adding node', params.text, params.parentText);
                    run(`
                    CREATE (node:Node { kind: $kind, text: $text, fullText:$fullText }) 
                    WITH node
                    MATCH (file:File)-[s:SOURCE_OF]->(parent:Node) WHERE
                        file.path =   $fileName AND
                        s.pos =       $parentPos AND 
                        s.end =       $parentEnd
                       
                    CREATE (file)-[:SOURCE_OF { pos: $pos, fullPos: $fullPos, end:$end }]->(node)                
                    CREATE (parent)-[:PARENT_OF]->(node)
                    `, params);
                } else {
                    run(`
                        MATCH (file:File) WHERE file.path = $fileName
                        CREATE (node:Node { kind: $kind, text: $text, fullText:$fullText })
                        CREATE (file)-[:SOURCE_OF { pos: $pos, fullPos: $fullPos, end:$end }]->(node)
                        CREATE (file)-[:PARENT_OF {root: TRUE}]->(node)
                `, params);
                }

                ts.visitEachChild(node, visitor, ctx);
                return node;
            };
            ts.visitEachChild(nd, visitor, ctx);
            return nd;
        });
        delay(1000).then(() => last.then(() => session.close())).then(() => drv.close());
        return transformers;
    } catch (err) {
        console.error(err);
        return compiler.transformers;
    }
}
