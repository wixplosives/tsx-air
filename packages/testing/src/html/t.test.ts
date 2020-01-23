import { expect } from 'chai';
import { delay } from '@tsx-air/utils';
xdescribe('fsf', () => {
    let c = 0;
    before(function (){
        this.currentTest?.retries(15);
        this.currentTest?.timeout(90);
    });
   
    beforeEach(function (){
        // this.currentTest?.retries(15);
        // this.currentTest?.timeout(90);
        console.log(this.currentTest?.timeout(500));
    });

    it('should mostly fail', async () => {
        await(delay(100));
        expect(c++).to.be.above(10);
    });

    afterEach(function(){
        if(this.currentTest?.timedOut) {
            console.log('Timed out....');
            this.currentTest.timeout(800);
            this.test?.ctx?.retries(1);
        }
    });
});