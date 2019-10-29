import ts from 'typescript';
import React from 'react';
import { IFileSystem } from '@file-services/types';
import { IBaseHost } from '@file-services/typescript';
import { Editor } from './editor';
import * as Session from './session';

import 'sanitize.css';
import 'sanitize.css/typography.css';
import './playground.css';
import SyntaxHighlighter from 'react-syntax-highlighter';
// @ts-ignore
import { atomOneLight as style } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { tsxair, FileAstLoader, scan, sourceWithNotes, transformers } from '@wixc3/tsx-air-compiler';

export interface IPlaygroundProps {
    fs: IFileSystem;
    baseHost: IBaseHost;
    languageService: ts.LanguageService;
    filePath: string;
}

export interface IPlaygroundState {
    output: string;
    scanned: string;
}

export type RenderTarget = 'react' | 'markdown';

export class Playground extends React.PureComponent<IPlaygroundProps, IPlaygroundState> {
    public state: IPlaygroundState = {
        output: '',
        scanned: '',
    };

    private scanner!: FileAstLoader;
    private excluded = new Set();

    public componentDidMount() {
        this.scanner = new FileAstLoader(this.props.fs, this.getFilePath());
        this.updateTranspiled();
    }

    public render() {
        const { fs } = this.props;
        const filePath = this.getFilePath();
        const transformerSelect = (e: React.ChangeEvent) => {
            const exclude = new Set(this.excluded);
            const t = transformers.find(tr => tr.name === e.target!.getAttribute('x-data'))!;
            exclude.has(t) ? exclude.delete(t) : exclude.add(t);
            this.excluded = exclude;
            this.updateTranspiled();
        };

        return (<div className="playground">
            <div className="playground-pane source-code-pane">
                <h2>Source</h2>
                <Editor
                    className="source-code-editor"
                    fs={fs}
                    filePath={filePath}
                    onChange={this.handleSourceCodeChange}
                />
            </div>

            <div className="playground-pane view-pane" >
                <h2>Scanned</h2>
                <SyntaxHighlighter language="typescript" style={style}>
                    {this.state.scanned}
                </SyntaxHighlighter>
            </div>

            <div className="playground-pane view-pane" >
                <h2>Compiled</h2>
                <div>{
                    transformers.map(t => (<div key={t.name} >
                        <input type="checkbox" checked={!this.excluded.has(t)} x-data={t.name}
                            onChange={transformerSelect}
                        />{t.name}
                    </div>))
                }</div>
                <SyntaxHighlighter language="javascript" style={style}>
                    {this.state.output}
                </SyntaxHighlighter>
            </div>
        </div >
        );
    }

    private getFilePath() {
        return this.props.filePath;
    }

    private handleSourceCodeChange = (newValue: string) => {
        const filePath = this.getFilePath();
        this.props.fs.writeFileSync(filePath, newValue);
        Session.saveFile(filePath, newValue);
        this.forceUpdate();
        requestAnimationFrame(() => this.updateTranspiled());
    };

    private updateTranspiled() {
        const { ast } = this.scanner.getAst(this.getFilePath());
        const notes = scan(ast, tsxair);
        const scanned = sourceWithNotes(ast.getFullText(), notes);

        const content = this.props.fs.readFileSync(this.props.filePath);
        const compilerOptions: ts.CompilerOptions = { target: ts.ScriptTarget.Latest, jsx: ts.JsxEmit.React , jsxFactory: 'TSXAir'};
        const output = ts.transpileModule(content.toString(), {
            compilerOptions, transformers: {
                before: transformers.filter(t => !this.excluded.has(t)).map(i => i.transformer)
            }
        }).outputText;

        this.setState({
            output: output.split('\\n').join('\n'),
            scanned
        });
    }
}
