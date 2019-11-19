import { Compiler } from './../compilers';
import { Example } from './../utils/examples.index';
import { DOM } from './dom';
export interface Model {
    currentExample: Example;
    stop: ()=>void;
    dom: DOM;
    getSelectedExample: () => string;
    getSelectedCompiler: () => Compiler;
    getSelectedSource: () => string;
}