import { cloneDeep } from 'lodash';
import { driver } from 'neo4j-driver';
import { Compiler } from '@tsx-air/types';
import { createVisitor, mapToId } from './reporter.helpers';
import ts from 'typescript';
import debounce from 'lodash/debounce';
import { createNewCompilation, compilingFile, result } from './reporter.queries';
import nodeFs from '@file-services/node';
// tslint:disable: no-console

export function createReporter(files: string[], compiler: Compiler, url = 'bolt://0.0.0.0:7687') {
    const transformers = cloneDeep(compiler.transformers);
    type Driver = ReturnType<typeof driver>;
    try {
        const drv: Driver = driver(url);
        const session = drv.session();
        console.log(`Logging compilation data to ${url}`);
        let last: Promise<any> | null = Promise.resolve();
        const closeAfter = debounce(() =>
            session.close().then(() => drv.close())
            , 500);
        const run = (query: string, data: object) => {
            if (last) {
                last = last
                    .then(() => {
                        closeAfter();
                        const r = session.run(query, data);
                        // r.then(res => {
                        //     console.log('============================')
                        //     console.log(query)
                        //     console.error(JSON.stringify(data, null, 2));
                        //     console.log(res)
                        // });
                        return r;
                    })
                    .catch(e => {
                        console.error(`Logging error`, query);
                        console.error(JSON.stringify(data, null, 2));
                        console.error(e);
                        last = null;
                    });
                return last;
            } else {
                return Promise.resolve(null);
            }
        };

        const compilationId = run(
            ...createNewCompilation(files, compiler))
            .then(mapToId);

        transformers.before = [
            (ctx => nd => {
                const fileName = nodeFs.resolve(process.cwd(), nd.fileName);
                const file = compilationId.then(
                    (compId: any) => run(...compilingFile(compId, fileName))
                        .then(mapToId)
                );
                ts.visitEachChild(nd, createVisitor(file, file, fileName, ctx, run), ctx);
                return nd;
            }),
            ...(transformers.before || []),
            (ctx => nd => {
                const fileName = nodeFs.resolve(process.cwd(), nd.fileName);
                const file = compilationId.then(
                    (compId: any) => run(...result(compId, fileName))
                        .then(mapToId)
                );
                ts.visitEachChild(nd, createVisitor(file, file, fileName, ctx, run), ctx);
                return nd;
            }),
        ];
        return transformers;
    } catch (err) {
        console.error(`Logging to ${url} failed:`, err);
        return compiler.transformers;
    }
}