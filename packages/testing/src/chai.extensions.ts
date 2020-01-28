import ts from 'typescript';
import { trimCode } from './general.utils';
import { use } from 'chai';
import { printAst } from '@tsx-air/compiler-utils';
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

    utils.addMethod(chai.Assertion.prototype, 'astLike', function (this: Chai.AssertionPrototype, expected: string | ts.Node) {
        const target: string = trimCode(printAst(this._obj), true);
        expected = trimCode(typeof expected === 'string'
            ? expected
            : printAst(expected), true);
        new chai.Assertion(target).is.a('string');
        this.assert(
            target === expected,
            `expected #{act} to be #{exp}`,
            `expected #{act} not to be #{exp}`,
            expected,
            target
        );
        return this;
    });
}