export type Loader = (path: string) => Promise<string>;
export interface Compiler {
    compile: (src: string, path: string) => Promise<string>;
    label: string;
}

export interface BuildTools {
    compiler:Compiler;
    loader:Loader;
}