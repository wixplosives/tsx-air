import { trimCode } from './general.utils';
import { use } from 'chai';
use(plugin);

export default function plugin(chai: any, utils: Chai.ChaiUtils) {
    utils.addMethod(chai.Assertion.prototype, 'similarText', function (this: Chai.AssertionPrototype, text: string) {
        const target: string = trimCode(this._obj);
        text = trimCode(text);
        new chai.Assertion(target).is.a('string');
        this.assert(
            target.trim() === text.trim(),
            `expected #{act} to be #{exp}`,
            `expected #{act} not to be #{exp}`,
            text,
            target
        );
        return this;
    });
}