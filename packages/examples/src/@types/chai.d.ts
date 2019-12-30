declare namespace Chai {
    export interface Assertion {
        text(property: string): Promise<void>;
        similarText(sameIgnoreWhitespace: string): Assertion;
        one(cssQuery: string): Promise<void>;
    }
}
