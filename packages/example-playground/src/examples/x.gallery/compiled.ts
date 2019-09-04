import { createElement, CompiledComponent, render, performStateUpdate, performAll, emptyCompiled, TsxAirNode, IDOMRepeatContext, updateChildList, childrenListToString, hydrateChildList, renderToString, CompiledComponentInstance, hydrate, styleToString } from '../../framework/runtime/runtime2';
// tslint:disable: no-bitwise

// Inferred from the TSX all possible return values 



const SlideShow: CompiledComponent<{ children: TsxAirNode[], currentSlide: number, style: any }, {}, { root: HTMLElement, root_children: IDOMRepeatContext }> = {
    ...emptyCompiled,
    propsMap: {
        children: 1 << 1,
        currentSlide: 1 << 2,
        style: 1 << 3
    },
    stateMap: {
    },
    calcOperations: 0,
    performCalc(_props, _state, changed, _dependencies) {

        return changed;
    },
    performRender(instance, changed) {
        if (changed & (this.propsMap.children | this.propsMap.currentSlide)) {
            updateChildList(instance.dom.root, [instance.props.children[instance.props.currentSlide]], instance.dom.root_children);
        }
        if (changed & this.propsMap.style) {
            instance.dom.root.setAttribute('style', styleToString(instance.props.style));
        }
    },
    performEffect(_instance) {
        //
    },
    renderToString(props) {
        return `
        <div style="${styleToString(props.style)}">
            ${childrenListToString([props.children[props.currentSlide]])}
        </div>`;
    },
    hydrate(comp, element) {
        const ctx = {
            root: element as HTMLElement,
            root_children: hydrateChildList(element, [comp.props.children[comp.props.currentSlide]], comp.depth + 1)
        };
        return ctx;
    }
};
const Gallery: CompiledComponent<{ urls: string[] }, { currentSlide: number, infered_slideshow1_children: TsxAirNode[] }, { root: Element, slideshow1: CompiledComponentInstance<any>, button1: HTMLButtonElement, button2: HTMLButtonElement }> = {
    ...emptyCompiled,
    propsMap: {
        urls: 1 << 1,
    },
    stateMap: {
        currentSlide: 1 << 2,
        infered_slideshow1_children: 1 << 3
    },
    calcOperations: 1,
    performCalc(props, state, changed) {
        // console.log(`
        // changed: ${printChangeMap(changed, { props: this.propsMap, state: this.stateMap })}
        // dependencies: \n\t${dependencies.map(dep => printChangeMap(dep, { props: this.propsMap, state: this.stateMap })).join('\n\t')}


        // `);
        if (changed === performAll) {
            state.currentSlide = 0;
            changed = changed | this.stateMap.currentSlide;
        }
        if (changed & this.propsMap.urls) {
            state.infered_slideshow1_children = props.urls.map(url => createElement(Gallery.fragments!.img1, { url }, url))
                .concat(createElement(Gallery.fragments!.div1, {}, 'generatedUniqueKey'));
        }

        return changed;
    },
    performRender(instance, changed) {
        if (changed & this.stateMap.infered_slideshow1_children | Gallery.stateMap.infered_slideshow1_children) {
            instance.dom.slideshow1.update({ children: instance.state.infered_slideshow1_children, currentSlide: instance.state.currentSlide });
        }
        if (changed & this.stateMap.currentSlide) {
            instance.dom.button1.disabled = instance.state.currentSlide === 0;
        }
        if (changed & (this.stateMap.currentSlide | this.propsMap.urls)) {
            instance.dom.button2.disabled = instance.state.currentSlide >= instance.props.urls.length - 1;
        }
    },
    performEffect(_instance) {
        //
    },
    renderToString(props, state) {
        return `<div>
        ${renderToString(SlideShow, {
            currentSlide: state.currentSlide,
            children: state.infered_slideshow1_children,
            style: Gallery.constants.slideShow1_style
        })}
        <button ${state.currentSlide === 0 ? 'disabled ' : ''}>Prev !</button>
        <button ${state.currentSlide >= props.urls.length - 1 ? 'disabled ' : ''}>Next !</button>
    </div>`;
    },
    hydrate(comp, element) {
        const ctx = {
            root: element,
            slideshow1: hydrate(element.children[0] as HTMLElement, SlideShow, {
                currentSlide: comp.state.currentSlide,
                children: comp.state.infered_slideshow1_children,
                style: Gallery.constants.slideShow1_style
            }, comp.depth + 1),
            button1: element.children[1] as HTMLButtonElement,
            button2: element.children[2] as HTMLButtonElement
        };
        ctx.button1.addEventListener('click', () => {
            performStateUpdate(comp, {
                currentSlide: comp.state.currentSlide! - 1
            });
        });
        ctx.button2.addEventListener('click', () => {
            performStateUpdate(comp, {
                currentSlide: comp.state.currentSlide! + 1
            });
        });
        return ctx;
    },
    fragments: {
        img1: {
            ...emptyCompiled,
            propsMap: {
                url: 0 << 1
            },
            renderToString(props) {
                return `<img src=${props.url} style="width: 100%; height: 100%"/>`;
            },
            performRender(instance, changed) {
                if (changed & this.propsMap.url) {
                    instance.dom.root.setAttribute('src', instance.props.urls);
                }
            }
        },
        div1: {
            ...emptyCompiled,
            renderToString() {
                return `<div>Thanks for viewing</div>`;
            }
        }
    },
    constants: {
        slideShow1_style: { width: '500px', height: '500px', padding: '10px', background: 'gray' }
    }
};



export const runExample = (element: HTMLElement) => {
    render(element, Gallery, {
        urls: ['https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
            'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
            'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
            'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg']
    });

};