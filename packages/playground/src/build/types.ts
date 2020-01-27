import { IFileSystem } from '@file-services/types';
import { ICommonJsModuleSystem } from '@file-services/commonjs';
import { Compiler } from '@tsx-air/types';

export type Loader = (path: string) => Promise<Record<string,string>>;

export interface BuildTools {
    compiler: Compiler;
    loader: Loader;
}

export type FileSnippets = Record<number, string>;
export type Snippets = Record<string, FileSnippets>;

export interface BuiltCode {
    source: string;
    path: string;
    compiled: string;
    imports: Array<Promise<BuiltCode>>;
    module: Promise<any>;
    error?: any;
    _usedBuildTools: BuildTools;
    _cjsEnv: CjsEnv;
    _injected: Snippets;
}

export interface CjsEnv {
    compiledCjs: IFileSystem;
    compiledEsm: IFileSystem;
    cjs: ICommonJsModuleSystem;
    sources: IFileSystem;
}
