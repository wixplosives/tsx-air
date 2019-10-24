import { IFileSystem } from '@file-services/types';
import { createBaseHost, createLanguageServiceHost } from '@file-services/typescript';
import ts from 'typescript';
import * as _ from 'lodash';

export interface PointsOfInterest {
    note: any;
    node: ts.Node;
}

export type Visitor = (node: ts.Node,
    ignoreChildren: () => void,
    report: (pois: PointsOfInterest|PointsOfInterest[]) => void) => any | undefined;

export type Scanner = (target: ts.Node, visitor: Visitor) => PointsOfInterest[];


export class FileAstLoader {
    public readonly langService: ts.LanguageService;

    constructor(public readonly fs: IFileSystem, public readonly filePath: string) {
        const baseHost = createBaseHost(fs);
        const baseLangServiceHost = createLanguageServiceHost(baseHost, () => [filePath], () => {
            return { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React, jsxFactory: 'TSXAir' };
        }, '/node_modules/typescript/lib');

        this.langService = ts.createLanguageService(baseLangServiceHost);
    }


    public getAst(filePath: string) {
        const program = this.langService.getProgram()!;
        const ast = program.getSourceFile(filePath)!;
        return {
            source: this.fs.readFileSync(filePath).toString('utf8'),
            ast
        };
    }
}

const walker = (node: ts.Node, report: (point: PointsOfInterest) => void, visitorr: Visitor) => {
    let ignoreChildren = false;
    const reportChildren = 
        (pois: PointsOfInterest | PointsOfInterest[]) => {
            if (!(pois instanceof Array)) {
                pois = [pois];
            }
            pois.forEach(p => report(p));
        };
    

    const note = visitorr(node, () => ignoreChildren = true, reportChildren);
    if (note) {
        report({ node, note });
    }
    if (!ignoreChildren) {
        node.forEachChild(n => walker(n, report, visitorr));
    }
};

export const scan: Scanner = (target, visitor) => {
    const pointsOfInterest = [] as PointsOfInterest[];

    const reportPOI = (point: PointsOfInterest) => {
        pointsOfInterest.push(point);
    };

    walker(target, reportPOI, visitor);
    return pointsOfInterest;
};