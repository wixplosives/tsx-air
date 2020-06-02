import { VirtualElement, Displayable } from "../types";
import { MockParent, MockChild } from "./runtime.mocks";
import { Runtime } from "./runtime";
import { JSDOM } from 'jsdom';
import { expect } from "chai";
import { TSXAir } from "../api/types";
import sinon from "sinon";

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
            const instance = runtime.render(new VirtualElement(
                MockChild, undefined, 'root', undefined, { ca: 1, cb: -1 }
            ));
            expect(domOf(instance)).to.eql(`<div><!--exp0-->1<!--/exp0--> <!--exp1-->-1<!--/exp1--></div>`);
        });
        it(`render child components`, () => {
            const instance = runtime.render(new VirtualElement(
                MockParent, undefined, 'root', undefined, { a: 10 }
            ));
            expect(domOf(instance)).to.eql(`<div><!--exp0-->10<!--/exp0--> <!--exp1-->1<!--/exp1--></div>`);
        });
        it(`doesn't request another animation frame`, () => {
            runtime.render(new VirtualElement(MockParent, undefined, 'root', undefined, { a: 10 }));
            expect(onNextFrame).to.have.length(0);
        });
    });

    describe('updating existing components', () => {
        let instance: MockParent;
        beforeEach(() => {
            instance = runtime.render(new VirtualElement(
                MockParent, undefined, 'root', undefined, { a: 10 }
            )) as MockParent;
        });
        it(`changes the view on the next animation frame`, () => {
            const initialHtml = domOf(instance);
            runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
            expect(domOf(instance)).to.equal(initialHtml);
            expect(onNextFrame).to.have.length(1);
            onNextFrame[0](0);
            expect(domOf(instance)).to.eql(`<div><!--exp0-->0<!--/exp0--> <!--exp1-->2<!--/exp1--></div>`);
        });

        it(`doesn't replace outer elements instances when inner html changes`, () => {
            const initialDom = instance.getDomRoot();
            runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
            onNextFrame[0](0);
            expect(instance.getDomRoot()).to.equal(initialDom);
        });

        describe(`multiple changes in the same frame`, () => {
            it(`runs $preRender (user code) once per change`, () => {
                runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
                runtime.updateProps(instance, (p) => (p.a = 1, instance.changesBitMap['props.a']));
                expect(onNextFrame).to.have.length(1);
                sinon.spy(instance, '$preRender');
                onNextFrame[0](0);
                // @ts-ignore
                expect(instance.$preRender.calledOnce).to.equal(true);
            });
            it(`update the view only once with the all the aggregated changes`, () => {
                runtime.updateProps(instance, (p) => (p.a = 0, instance.changesBitMap['props.a']));
                runtime.updateProps(instance, (p) => (p.a = 1, instance.changesBitMap['props.a']));
                expect(onNextFrame).to.have.length(1);
                sinon.spy(instance, '$updateView');
                onNextFrame[0](0);
                // @ts-ignore
                expect(instance.$updateView.calledOnce).to.equal(true);
            });
        });
    });
});