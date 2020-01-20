import { expect } from 'chai';
import { isRange, Count } from './page.matcher.types';


export function expectCount(actual: any, expected: Count, message?: string) {
    expect(actual).to.be.a('number', message);
    if (isRange(expected)) {
        if (expected.above !== undefined && expected.below !== undefined) {
            expect(actual, message).to.be.within(expected.above, expected.below);
        } else {
            if (expected.above !== undefined) {
                expect(actual, message).to.be.above(expected.above);
            } else {
                expect(actual, message).to.be.below(expected.below!);
            }
        }
    } else {
        expect(expected, `${message ? message + ': ' : ''}range must be a number or have above/below`).to.be.a('number');
        expect(actual, message).to.equal(expected);
    }
}