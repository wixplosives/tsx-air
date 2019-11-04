export interface Compiler {
    compile: (src: string, expectedTarget: string) => {printVer: string, runVer: string};
    label: string;
}