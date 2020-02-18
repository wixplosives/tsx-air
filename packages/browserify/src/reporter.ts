import { cloneDeep } from 'lodash';
import { driver } from 'neo4j-driver';
import { Compiler } from '@tsx-air/types';
import { tsKindInverse, getProps } from './reporter.helpers';
import ts from 'typescript';
import debounce from 'lodash/debounce';

export function createReporter(files: string[], compiler: Compiler) {
    const transformers = cloneDeep(compiler.transformers);
    type Driver = ReturnType<typeof driver>;
    try {
        const drv: Driver = driver('bolt://0.0.0.0:7687');
        const session = drv.session();
        let last: Promise<any> | null = Promise.resolve();
        const closeAfter = debounce(() =>
            session.close().then(() => drv.close())
            , 500);
        const run = (query: string, data: object) => {
            if (last) {
                last = last
                    .then(() => {
                        closeAfter();
                        return session.run(query, data);
                    })
                    .catch(() => {
                        last = null;
                    });
                return last;
            } else {
                return Promise.resolve(null);
            }
        };
        const compilationId = run(`
            ${files.map((f, i) => `
            MERGE (file${i}:File {path: '${f}'}`)})
            MERGE (compiler:Compiler {label:'${compiler.label}'})
            CREATE (comp:Compilation {timestamp: $time})-[:USING]->(compiler)
            ${files.map((_, i) => `MERGE (comp)-[:COMPILED {main:'true'}]->(file${i})`)}            
            RETURN id(comp)
            `, { time: new Date().toISOString() })
            .then(res => res.records[0].get(0));

        transformers.before?.unshift(ctx => nd => {
            const { fileName } = nd;
            run(`MERGE (file:File { path: $fileName })`, { fileName });
            compilationId.then(compId => {
                run(`
                MATCH (c:Compilation) WHERE id(c)=$compId
                MERGE (file:File { path: $fileName })
                MERGE (c)-[:COMPILED]->(file)
                `, { compId, fileName });
            });

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
                    parentText: node.parent?.getText(),
                };
                getProps(node);
                if (!ts.isSourceFile(node.parent)) {
                    if (node.getText().trim()) {
                        run(`
                        MATCH (parent { text: $parentText })<-[:PARENT_OF*]-(:File { path: $fileName })
                        CREATE (node:${params.kind} { text: $text, kind: $kind })
                        CREATE (parent)-[:PARENT_OF { pos: $pos, fullPos: $fullPos, end: $end }]->(node)
                    `, params);
                    }
                } else {
                    run(`
                    MERGE (node:${params.kind} { kind: $kind, text: $text })
                    MERGE (file:File { path: $fileName} )
                    MERGE (file)-[:PARENT_OF { pos: $pos, fullPos: $fullPos, end: $end }]->(node)
                `, params);
                }

                ts.visitEachChild(node, visitor, ctx);
                return node;
            };
            ts.visitEachChild(nd, visitor, ctx);
            return nd;
        });
        return transformers;
    } catch (err) {
        return compiler.transformers;
    }
}