declare namespace Chai {
    export interface Assertion {
        similarText(sameIgnoreWhitespace: string): Assertion;
    }
}
