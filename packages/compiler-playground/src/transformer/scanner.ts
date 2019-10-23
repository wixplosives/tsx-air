import { nodeFs } from '@file-services/node';
import { IFileSystem } from '@file-services/types';
import { createBaseHost, createLanguageServiceHost } from '@file-services/typescript';
import ts from 'typescript';

export interface PointsOfInterest {
    note: any;
    node: ts.Node;
}

export type Visitor = (node: ts.Node, ignoreChildren?: () => void) => any | undefined;

export class FileScanner {
    public readonly langService: ts.LanguageService;
    private _source!:string;

    constructor(public readonly fs: IFileSystem, public readonly filePath: string) {
        const baseHost = createBaseHost(fs);
        const baseLangServiceHost = createLanguageServiceHost(baseHost, () => [filePath], () => {
            return { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React, jsxFactory: 'TSXAir' };
        }, '/node_modules/typescript/lib');

        this.langService = ts.createLanguageService(baseLangServiceHost);        
    }

    public get source(){
        return this._source;
    }

    /**
     * @param visitor returns a note on the visited node (or undefined)
     */
    public scan(filePath: string, visitor: Visitor) {
        this._source = nodeFs.readFileSync(filePath).toString('utf8');
        const program = this.langService.getProgram()!;
        const source = program.getSourceFile(filePath)!;
        return scan(source, visitor);
    }
}

const walker = (node: ts.Node, report: (point: PointsOfInterest) => void, visitorr: Visitor) => {
    let ignoreChildren = false;
    const note = visitorr(node, () => ignoreChildren = true);
    if (note) {
        report({ node, note });
    }
    if (!ignoreChildren) {
        node.forEachChild(n => walker(n, report, visitorr));
    }
};

export const scan = (target: ts.Node, visitor: Visitor) => {
    const pointsOfInterest = [] as PointsOfInterest[];
    const reportPOI = (point: PointsOfInterest) => {
        pointsOfInterest.push(point);
    };

    walker(target, reportPOI, visitor);
    return pointsOfInterest;
};