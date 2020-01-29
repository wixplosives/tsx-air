
declare namespace Chai {
    // @ts-ignore
    import {Node} from 'typescript';

    export interface Assertion {
        eqlCode(sameIgnoreWhitespace: string): Assertion;
        astLike(ast: string | Node, ignoreLines?:boolean):Assertion;
        contentOf(filePath: string):Assertion;
    }
}
