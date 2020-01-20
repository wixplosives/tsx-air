import { expect } from 'chai';
import { safely } from './safely';
describe('safeDo', () => {
    describe('when there is no exception', () => {
        it('should return the execution result', () => {
            expect(safely(()=>'ok', 'not ok')).to.equal('ok');
        });
    });
    describe('when fn throws an error', () => {
        it('should throw a custom error message', () => {
            expect(() => safely(() => { throw new Error('original'); }, 'custom')).to.throw('custom');
        });
        it('should not include the utils in the stack trace', () => {
            try {
                safely(() => { throw new Error('original'); }, 'custom');
                expect.fail('Error was not thrown');
            } catch (e) {
                expect(e.stack).not.to.include('safe.do.ts');
            }
        });
        it('should throw a custom error message for async errors', async () => {
            try {
                await safely(() => new Promise(() => { throw new Error('original'); }), 'custom');
                expect.fail('Error was not thrown');
            } catch (e) {
                expect(e).to.be.instanceOf(Error);
                expect(e.message).to.include('custom');
            }
        });
    });
});