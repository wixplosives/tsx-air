import { readFileSync } from 'fs';
import ts from 'typescript';
import { trimCode } from './general.utils';
import { use } from 'chai';
import { printAst } from '@tsx-air/compiler-utils';
import chalk from 'chalk';
use(plugin);

export default function plugin(chai: any, utils: Chai.ChaiUtils) {
    utils.addMethod(chai.Assertion.prototype, 'eqlCode', function (this: Chai.AssertionPrototype, text: string) {
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
        const target: string = trimCode(printAst(this._obj));
        expected = trimCode(typeof expected === 'string'
            ? expected
            : printAst(expected));
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

    utils.addMethod(chai.Assertion.prototype, 'contentOf', function (this: Chai.AssertionPrototype, filePath: string) {
        const target: string = trimCode(this._obj);
        const expected = trimCode(readFileSync(filePath, 'utf8'));
        new chai.Assertion(target).is.a('string');
        this.assert(
            target === expected,
            `expected ${target.replace(/\n.*/gs, '...')} to be like ` + chalk.cyanBright(`<source: ${filePath}>`),
            `expected ${target.replace(/\n.*/gs, '...')} not to be like ` + chalk.cyanBright(`<source: ${filePath}>`),
            expected,
            target
        );
        return this;
    });
}