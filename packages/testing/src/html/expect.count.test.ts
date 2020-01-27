import { expect } from 'chai';
import { expectCount } from './expect.count';

describe('expectCount', () => {
    it('should assert range', () => {
        expect(() => {
            expectCount(4, { above: 0 }, 'above only');
            expectCount(4, { below: 42 }, 'below only');
            expectCount(4, { above: 2, below: 5 }, 'within');
        }).not.to.throw();
        expect(() => expectCount('x', { above: 0 }, 'X')).to.throw(`X: expected 'x' to be a number`);
        expect(() => expectCount(4, { above: 5 }, 'Above')).to.throw(`Above: expected 4 to be above 5`);
        expect(() => expectCount(4, { below: 0 }, 'Below')).to.throw(`Below: expected 4 to be below 0`);
        expect(() => expectCount(4, {}, 'Invalid')).to.throw(`Invalid: range must be a number or have above/below: expected {} to be a number`);
    });
    it('should assert numeric value', () => {
        expect(() => expectCount(4, 4)).not.to.throw();
        expect(() => expectCount('x', 4)).to.throw();
        expect(() => expectCount(5, 4)).to.throw();
    });
});