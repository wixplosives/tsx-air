import { isText, Text } from './page.matcher.types';
import { expect } from 'chai';

export function expectText(actual: any, expected: Text | string, message?: string) {
    expect(actual, message).to.be.a('string');
    if (isText(expected)) {
        let compare = actual as string;
        const applyReplace = (regEx: RegExp, replacement: string) => {
            compare = compare.replace(regEx, replacement);
            if (expected.contains) {
                expected.contains = expected.contains.replace(regEx, replacement);
            }
            if (expected.doesNotContain) {
                expected.doesNotContain = expected.doesNotContain.replace(regEx, replacement);
            }
            if (expected.equals) {
                expected.equals = expected.equals.replace(regEx, replacement);
            }
        };
        switch (expected.ignoreLineBreaks) {
            case true:
                applyReplace(/^\n+/g, '');
                applyReplace(/\n+$/g, '');
                applyReplace(/\n+/g, ' ');
                break;
            default:
        }
        switch (expected.ignoreWhiteSpace) {
            case 'leading':
                applyReplace(/^[ \t]+/mg, '');
                break;
            case 'trailing':
                applyReplace(/[ \t]+$/gm, '');
                break;
            case true:
                applyReplace(/[ \t]+/gm, ' ');
                applyReplace(/^[ \t]/gm, '');
                applyReplace(/[ \t]+$/gm, '');
                break;
            default:
        }
        if (expected.equals !== undefined) {
            expect(compare, message).to.equal(expected.equals);
        }
        if (expected.contains !== undefined) {
            expect(compare, message).to.contain(expected.contains);
        }
        if (expected.doesNotContain !== undefined) {
            expect(compare, message).not.to.contain(expected.doesNotContain);
        }
    } else {
        expectText(actual, {
            equals: expected,
            ignoreLineBreaks: true,
            ignoreWhiteSpace: true
        }, message);
    }
}