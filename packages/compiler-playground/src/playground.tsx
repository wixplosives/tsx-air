import ts from 'typescript';
import React from 'react';
import { IFileSystem } from '@file-services/types';
import { IBaseHost } from '@file-services/typescript';
import { Editor } from './editor';
import * as Session from './session';

import 'sanitize.css';
import 'sanitize.css/typography.css';
import './playground.css';
import { tsxAirTransformer } from './transformer/transformer';

export interface IPlaygroundProps {
    fs: IFileSystem;
    baseHost: IBaseHost;
    languageService: ts.LanguageService;
    filePath: string;
}

export interface IPlaygroundState {
    output: string;
}

export type RenderTarget = 'react' | 'markdown';
export class Playground extends React.PureComponent<IPlaygroundProps, IPlaygroundState> {
    public state: IPlaygroundState = {
        output: ''
    };

    public componentDidMount() {
        this.updateTranspiled();
    }

    public render() {
        const { fs } = this.props;
        const filePath = this.getFilePath();

        return (
            <div className="playground">
                <div className="playground-pane source-code-pane">
                    <Editor
                        className="source-code-editor"
                        fs={fs}
                        filePath={filePath}
                        onChange={this.handleSourceCodeChange}
                    />
                </div>


                <div className="playground-pane view-pane">
                    <pre>{this.state.output}</pre>
                </div>
            </div>
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
        const content = this.props.fs.readFileSync(this.props.filePath);
        const compilerOptions: ts.CompilerOptions = { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React };
        const output = ts.transpileModule(content.toString(), { compilerOptions, transformers: { before: [tsxAirTransformer] } }).outputText;

        console.log(output);
        this.setState({
            output: output.split('\\n').join('\n')
        });
    }

}
