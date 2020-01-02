import { Example } from './../utils/examples.index';
import { DOM } from './dom';
import { Compiler } from '@tsx-air/compilers';
export interface Model {
    currentExample: Example;
    stop: ()=>void;
    dom: DOM;
    getSelectedExample: () => string;
    getSelectedCompiler: () => Compiler;
    getSelectedSource: () => string;
}