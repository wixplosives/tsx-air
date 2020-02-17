import { cloneDeep } from 'lodash';
import {driver} from 'neo4j-driver';
import { Compiler } from '@tsx-air/types';

export function createReporter(files:string[], compiler:Compiler){
    const transformers = cloneDeep(compiler.transformers);
    type Driver = ReturnType<typeof driver>;
    try {
        const drv: Driver = driver('0.0.0.0:7474');
        const session = drv.session({ database: `ast` });
    
        session.run(`
            ${files.map((f,i) => `MERGE (file${i}:File {path:${f}}`)}
            MERGE (compiler:Compiler {label:${compiler.label}})
            CREATE (comp:Compilation {timestamp:$time})-[rel:USING]->compiler)
            CREATE(comp-[rel:MAIN]->main)
            `, { time: new Date() });
    
        transformers.before?.unshift(
            ctx => node => {
                session.run(`CREATE (node:Node {
                        type: ${node.kind}
                    })`);
                return node;
            }
        );
    } catch {
        //
    }
}
