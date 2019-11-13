export interface Compiler {
    compile: (src: string, expectedTarget: string) => string;
    label: string;
}