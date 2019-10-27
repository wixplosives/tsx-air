import { IFileSystem } from '@file-services/types';
import { createBaseHost, createLanguageServiceHost } from '@file-services/typescript';
import ts from 'typescript';
import * as _ from 'lodash';

export interface PointsOfInterest<T = any> {
    note: T;
    node: ts.Node;
}

interface ScannerApi {
    ignoreChildren: () => void;
    report: (pois: PointsOfInterest<any> | Array<PointsOfInterest<any>>) => void;
    stop: () => void;
}

export type Visitor<T = any> = (node: ts.Node, scannerApi: ScannerApi) => T | undefined;

export type Scanner = <T>(target: ts.Node, visitor: Visitor<T>) => Array<PointsOfInterest<T>>;


export class FileAstLoader {
    public readonly langService: ts.LanguageService;

    constructor(public readonly fs: IFileSystem, public readonly filePath: string) {
        const baseHost = createBaseHost(fs);
        const baseLangServiceHost = createLanguageServiceHost(baseHost, () => [filePath], () => {
            return { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React, jsxFactory: 'TSXAir' };
        }, '/node_modules/typescript/lib');

        this.langService = ts.createLanguageService(baseLangServiceHost);
    }


    public getAst(filePath: string, content?: string) {
        const program = this.langService.getProgram()!;
        const ast = content ? ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest) : program.getSourceFile(filePath)!;
        return {
            source: content || this.fs.readFileSync(filePath).toString('utf8'),
            ast
        };
    }
}

interface StopScan {
    (): void;
    shouldStop: boolean;
}

const walker = (node: ts.Node, report: (point: PointsOfInterest) => void, stop: StopScan, visitorr: Visitor) => {
    if (!stop.shouldStop) {
        let ignoreChildren = false;
        const api: ScannerApi = {
            ignoreChildren: () => ignoreChildren = true,
            report: pois => {
                if (!(pois instanceof Array)) {
                    pois = [pois];
                }
                pois.forEach(p => report(p));
            }, stop
        };

        const note = visitorr(node, api);
        if (note) {
            report({ node, note });
        }
        if (!ignoreChildren) {
            node.forEachChild(n =>
                walker(n, report, stop, visitorr)
            );
        }
    }
};

export const scan: Scanner = (target, visitor) => {
    const pointsOfInterest = [] as PointsOfInterest[];

    const reportPOI = (point: PointsOfInterest) => {
        pointsOfInterest.push(point);
    };

    const stop: StopScan = () => {
        stop.shouldStop = true;
    };
    stop.shouldStop = false;

    walker(target, reportPOI, stop, visitor);
    return pointsOfInterest;
};

export const find = (target: ts.Node, predicate: Visitor) => {
    const result = scan(target, (node, api) => {
        const ret = predicate(node, api);
        if (ret) {
            api.stop();
        }
        return ret;
    })[0];
    return result && result.node;
};