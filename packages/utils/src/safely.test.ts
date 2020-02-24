import { expect } from 'chai';
import { safely } from './safely';
describe('safely', () => {
    describe('when there is no exception', () => {
        it('should return the execution result', () => {
            expect(safely(() => 'ok', 'safe execution failed')).to.equal('ok');
            expect(safely(() => undefined, 'safe execution failed')).to.equal(undefined);
        });
        it('should throw if assertion is provided and returns false', () => {
            expect(() => safely(
                () => 'ok', 'safe execution failed', () => false))
                .to.throw('safe execution failed');
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
                expect(e.stack).not.to.include('safely.ts');
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