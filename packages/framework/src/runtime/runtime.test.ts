import { Displayable } from "../types";
import { Parent, MockChild } from "./runtime.mocks";
import { Runtime } from "./runtime";
import { JSDOM } from 'jsdom';
import { expect } from "chai";
import { TSXAir } from "../api/types";
import sinon from "sinon";
import { VirtualElement } from "../types/virtual.element";

describe('framework runtime (internal API)', () => {
    let runtime: Runtime;
    let onNextFrame: FrameRequestCallback[] = [];
    const domOf = <T extends Displayable>(c: T) => (c.getDomRoot() as HTMLElement).outerHTML;

    beforeEach(() => {
        onNextFrame = [];
        const { window } = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
        runtime = new Runtime(window, (fn: FrameRequestCallback) => (onNextFrame.push(fn), onNextFrame.length));
        TSXAir.runtime = runtime;
    });

    describe('render', () => {
        it(`returns an instance with populated DOM`, () => {
            const instance = runtime.render(VirtualElement.root(MockChild, { ca: 1, cb: -1 }));
            expect(domOf(instance)).to.eql(`<div><!--exp0-->1<!--/exp0--> <!--exp1-->-1<!--/exp1--></div>`);
        });
        it(`renders child components`, () => {
            const instance = runtime.render(VirtualElement.root(Parent, { a: 10 }));
            expect(domOf(instance)).to.eql(`<div><!--exp0-->10<!--/exp0--> <!--exp1-->1<!--/exp1--></div>`);
        });
        it(`runs the user code, conditionally returning a fragments`, () => {
            const instance = runtime.render(VirtualElement.root(Parent, { a: -1 }));
            expect(domOf(instance)).to.eql(`<span><!--exp0-->-1<!--/exp0--></span>`);
        });
        it(`handles valid recursive output`, () => {
            const instance = runtime.render(VirtualElement.root(Parent, { a: 0 }));
            expect(domOf(instance)).to.eql(`<div><!--exp0-->5<!--/exp0--> <!--exp1-->1<!--/exp1--></div>`);
        });
        it(`doesn't request another animation frame`, () => {
            runtime.render(VirtualElement.root(Parent, { a: 10 }));
            expect(onNextFrame).to.have.length(0);
        });
    });

    describe('updating existing components', () => {
        let instance: Parent;
        beforeEach(() => {
            instance = runtime.render(VirtualElement.root(Parent, { a: 10 })) as Parent;
        });
        it(`changes the view on the next animation frame`, () => {
            const initialHtml = domOf(instance);
            runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
            expect(domOf(instance)).to.equal(initialHtml);
            expect(onNextFrame).to.have.length(1);
            onNextFrame[0](0);
            expect(domOf(instance)).to.eql(`<div><!--exp0-->5<!--/exp0--> <!--exp1-->1<!--/exp1--></div>`);
            runtime.updateProps(instance, (p) => (p.a = 4, instance.changesBitMap['props.a']));
            onNextFrame[0](0);
            expect(domOf(instance)).to.eql(`<div><!--exp0-->5<!--/exp0--> <!--exp1-->2<!--/exp1--></div>`);
        });

        it(`doesn't replace outer elements instances when inner html changes`, () => {
            const initialDom = instance.getDomRoot();
            runtime.updateProps(instance, (p) => (p.a = 11, instance.changesBitMap['props.a']));
            onNextFrame[0](0);
            expect(instance.getDomRoot()).to.equal(initialDom);
        });


        describe(`multiple changes in the same frame`, () => {
            it(`runs $preRender (user code) at most once per frame`, () => {
                runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
                runtime.updateProps(instance, (p) => (p.a = 1, instance.changesBitMap['props.a']));
                expect(onNextFrame).to.have.length(1);
                sinon.spy(instance, '$preRender');
                onNextFrame[0](0);
                // @ts-ignore
                expect(instance.$preRender.calledOnce).to.equal(true);
            });
        });
    });
});