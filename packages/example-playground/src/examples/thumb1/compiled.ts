import { render, CompiledComponent } from '../../framework/runtime';
import { hasChanged, assignOrCreate, changedValues, handlePropsUpdate, handleStateUpdate } from '../../framework/runtime-helpers';



const Thumb: CompiledComponent<
    { url: string },
    { img: HTMLImageElement, imageLoaded: boolean },
    { img1: HTMLImageElement, div1: HTMLDivElement, div2: HTMLDivElement }
> = {
    unique: Symbol('Thumb'),
    // all derived from the code by the compiler
    initialState: _props => ({
        img: new Image(),
        imageLoaded: false
    }),
    toString: (_props, state) => `<div className="thumb">
        ${
        // This is problematic on SSR, yet require for this implementation
        state.imageLoaded ? state.img.outerHTML : '<div className="preloader" />'}
    </div>`,
    hydrate: (element, instance) => {
        const context = {
            // here is where the string generation approach starts to smell funny
            // depending of the state, one of those would have to be created
            img1: assignOrCreate(
                element.children[0].childNodes[0],
                HTMLImageElement, { src: instance.props.url }),
            div1: element.children[0] as HTMLDivElement,
            div2: assignOrCreate(
                element.children[0].childNodes[0],
                HTMLDivElement, { className: 'preloader' })

        };

        // Note that "state" is not referenced in the source, rather, it is inferred by the compiler
        // img is (potentially) injected to the DOM, therefore it should exist in the context as well as state
        instance.state.img = context.img1;

        return context;
    },
    update: (props, state, instance) => {
        const { context: { div1, div2, img1 } } = instance;
        handlePropsUpdate(props, instance, {
            'url': value => img1.src = value
        });
        handleStateUpdate(state, instance, {
            imageLoaded: value => div1.innerHTML = value ? img1.outerHTML : div2.outerHTML,
            img: _value => { throw new Error('img is defined as a const'); }
        });
    }
};


export const runExample = (element: HTMLElement) => {
    render(element, Thumb, { url: 'https://i.imgur.com/2Feh8RD.jpg' });
};