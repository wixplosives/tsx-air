import { setInstance, Runtime } from '..';
import { JSDOM } from 'jsdom';
import { expect } from 'chai';
import sinon from 'sinon';
import { Component, Displayable, VirtualElement } from '../types';

export function testRuntimeApi<P extends typeof Component, C extends typeof Component>(getCompiled: () => [any, any]) {
    describe('interacting with framework runtime (internal API)', () => {
        let Parent: P;
        let Child: C;
        let runtime: Runtime;
        let onNextFrame: FrameRequestCallback[] = [];
        const domOf = <T extends Displayable>(c: T) => (c.domRoot as HTMLElement).outerHTML.replace(/>\s{2,}</g, '><');

        beforeEach(() => {
            onNextFrame = [];
            const { window } = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
            runtime = new Runtime(window, (fn: FrameRequestCallback) => (onNextFrame.push(fn), onNextFrame.length));
            setInstance('default', runtime);
            [Parent, Child] = getCompiled();
        });

        describe('render', () => {
            it(`returns an instance with populated DOM`, () => {
                const instance = runtime.renderer.render(VirtualElement.root(Child, { ca: 1, cb: -1 }));
                expect(domOf(instance)).to.eql(`<div><!--$0X0-->1<!--$0X0--> <!--$0X1-->-1<!--$0X1--></div>`);
            });
            it(`renders child components`, () => {
                const instance = runtime.renderer.render(VirtualElement.root(Parent, { a: 10 }));
                expect(domOf(instance)).to.eql(`<div><!--$20X0-->10<!--$20X0--> <!--$20X1-->1<!--$20X1--></div>`);
            });
            it(`runs the user code, conditionally returning a fragments`, () => {
                const instance = runtime.renderer.render(VirtualElement.root(Parent, { a: -1 }));
                expect(domOf(instance)).to.eql(
                    `<span><!--$0C0--><div><!--$000X0-->-1<!--$000X0--> <!--$000X1-->1<!--$000X1--></div><!--$0C0--><!--$0X0-->-1<!--$0X0--></span>`);
            });
            it(`handles valid recursive output`, () => {
                const instance = runtime.renderer.render(VirtualElement.root(Parent, { a: 0 }));
                expect(domOf(instance)).to.eql(`<div><!--$1111120X0-->5<!--$1111120X0--> <!--$1111120X1-->1<!--$1111120X1--></div>`);
            });
            it(`throws when components tree depth is over runtime.maxDepth`, () => {
                runtime.renderer.maxDepth = 3;
                expect(() => runtime.renderer.render(VirtualElement.root(Parent, { a: 0 })))
                    .to.throw(/Component tree too deep/);
            });
            it(`doesn't request another animation frame`, () => {
                runtime.renderer.render(VirtualElement.root(Parent, { a: 10 }));
                expect(onNextFrame).to.have.length(0);
            });
        });

        describe('updating existing components', () => {
            let instance: Component;
            beforeEach(() => {
                instance = runtime.renderer.render(VirtualElement.root(Parent, { a: 10 })) as Component;
            });

            it(`changes the view on the next animation frame`, () => {
                const initialHtml = domOf(instance);
                instance.stores.$props.a = 0;
                expect(domOf(instance)).to.equal(initialHtml);
                expect(onNextFrame).to.have.length(1);
                onNextFrame[0](0);
                expect(domOf(instance)).to.eql(`<div><!--$1111120X0-->5<!--$1111120X0--> <!--$1111120X1-->1<!--$1111120X1--></div>`);
                onNextFrame = [];
                instance.stores.$props.a = 4;
                expect(onNextFrame).to.have.length(1);
                onNextFrame[0](0);
                expect(domOf(instance)).to.eql(`<div><!--$120X0-->5<!--$120X0--> <!--$120X1-->2<!--$120X1--></div>`);
            });

            it(`changes the view over a few frames if maxDepthPerUpdate is excised`, () => {
                instance = runtime.renderer.render(VirtualElement.root(Parent, { a: 0 })) as Component;
                runtime.renderer.maxDepthPerUpdate = 3;
                instance.stores.$props.a = 1;
                expect(onNextFrame).to.have.length(1);
                onNextFrame[0](0);
                expect(onNextFrame, `number of frames requested`).to.have.length(2);
                onNextFrame[1](0);
                expect(onNextFrame, `number of frames it took to update`).to.have.length(2);
                expect(domOf(instance)).to.eql(`<div><!--$111120X0-->5<!--$111120X0--> <!--$111120X1-->2<!--$111120X1--></div>`);
            });

            it(`updated inner components`, () => {
                // setup
                instance.stores.$props.a = -5;
                onNextFrame[0](0);
                expect(domOf(instance)).to.equal(`<span><!--$0C0--><div><!--$000X0-->-5<!--$000X0--> <!--$000X1-->5<!--$000X1--></div><!--$0C0--><!--$0X0-->-5<!--$0X0--></span>`);
                // test
                instance.stores.$props.a = -1;
                onNextFrame[1](0);
                expect(domOf(instance)).to.equal(`<span><!--$0C0--><div><!--$000X0-->-1<!--$000X0--> <!--$000X1-->1<!--$000X1--></div><!--$0C0--><!--$0X0-->-1<!--$0X0--></span>`);
            });

            it(`doesn't replace outer elements instances when inner html changes`, () => {
                const initialDom = instance.domRoot;
                instance.stores.$props.a = 11;
                onNextFrame[0](0);
                expect(instance.domRoot).to.equal(initialDom);
            });

            describe(`multiple changes in the same frame`, () => {
                it(`runs preRender (user code) at most once per frame`, () => {
                    instance.stores.$props.a = 0;
                    instance.stores.$props.a = 1;
                    expect(onNextFrame).to.have.length(1);
                    sinon.spy(instance, 'preRender');
                    onNextFrame[0](0);
                    // @ts-ignore
                    expect(instance.preRender.calledOnce).to.equal(true);
                });
            });
        });
    });
}