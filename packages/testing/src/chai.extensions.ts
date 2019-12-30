import { trimCode } from '@tsx-air/builder/src/test.utils';
import { ElementHandle } from 'puppeteer';
import { util, Assertion } from 'chai';

util.addMethod(Assertion.prototype, 'similarText', function (this: Chai.AssertionPrototype, text: string) {
    const target: string = trimCode(this._obj);
    text = trimCode(text);
    new Assertion(target).is.a('string');
    this.assert(
        target.trim() === text.trim(),
        `expected #{act} to be #{exp}`,
        `expected #{act} not to be #{exp}`,
        text,
        target
    );
    return this;
});

util.addMethod(Assertion.prototype, 'text', async function (this: Chai.AssertionPrototype, text: string) {
    const target: ElementHandle = await this._obj;
    new Assertion(target, 'Not a puppeteer ElementHandle').has.property('evaluate');
    const actual = await target.evaluate(n => n.textContent);
    if (util.flag(this, 'negate')) {
        new Assertion(actual).not.similarText(text);
    } else {
        new Assertion(actual).similarText(text);
    }
    return this;
});

util.addMethod(Assertion.prototype, 'one', async function (this: Chai.AssertionPrototype, cssQuery: string) {
    const target: ElementHandle = await this._obj;
    new Assertion(target, 'Not a puppeteer ElementHandle').has.property('$$');
    const found = await target.$$(cssQuery);
    this.assert(
        found.length === 1,
        `expected '#{exp}' to match once, found #{act}`,
        `expected '#{exp}' not to match once`,
        cssQuery,
        found.length
    );
    return this;
});

export default true;