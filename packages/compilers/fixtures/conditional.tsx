import { TSXAir, store, runtime } from "@tsx-air/framework";
import { result, merge } from "lodash";
import { compClass } from "../src/string-based-compiler/component-class";

export const Const = TSXAir((p: { a: number }) => {
    let lang = 'en';
    const s = store({ b: p.a });
    s.b++;
    let innerJsx = <div lang={lang} />;
    if (s.b < 0) {
        return <div>sub zero {s.b}</div>
    }
    if (s.b > 10) {
        return innerJsx;
    }
    lang = 'he';
    return <div>{innerJsx}{p.a > 0 ? innerJsx : s.b}{lang}</div>;
});

export const Comp = TSXAir((p: { a: number, b:any }) => {
    let innerJsx = <div x-count={p.a} />;
    if (p.a < 0) {
        return <div>sub zero {p.a}</div>
    }
    if (p.a < 1 ) {
        return innerJsx;
    }

    return <div>{innerJsx}{p.a < 2 ? innerJsx : p.b}</div>;
});



class VElm {
    static shallowMode = false;
    constructor(public key: string, public props: any, public state: any, public tyPe: any) {

    }
    toString(_ignore: 10, parentKey: string, index: number) {
        return VElm.shallowMode
            ? `[->~<-]${this.getKey(parentKey, index)}`
            : this.tyPe.toString(10, `${this.getKey(parentKey, index)}`, this.props)

    }
    getKey(parentKey: string, index: number) {
        return `${parentKey}_${this.key}$${index}`;
    }
    getExpressions() {
        VElm.shallowMode = true;
        this.tyPe.expressions
        VElm.shallowMode = false;
    }
    hydrate(root) {
        return this.tyPe.hydrate(root, this.props, this.state);
    }
    render(parentKey: string, index: number) {
        const wrapper = globalThis?.document?.createElement('div');
        wrapper.innerHTML = this.toString(10, parentKey, index);
        return this.hydrate(wrapper.children[0]);
    }
}

abstract class Base {
    constructor(public key: any, public root: any, public props: any, public state: any) {
        this.context = { root };
    }
    volatile: any;
    updateContent(elm: any, bits: number, value: any) {
        if (elm.$updateView) {
            TSXAir.runtime.updateProps(elm, (p) => {
                merge(p, value);
                return bits;
            });
        } else {
            elm.textContent = value;
        }
    }
    getChildRef(value: any, index: number, _default: HTMLElement | Text) {
        const key = value.getKey && value.getKey(this.key, index);
        return key
            ? this.context.root.$(`[key="${key}"]`)
            : _default;
    }
    context: any;
    onStage = true;
    changeBits = {};

    setContextNotOnStage() {
        for (const elm of this.context) {
            elm.onStage = false;
        }
    }

    abstract preRender(): Base | VElm;
}

class Frag extends Base {
    constructor(key: any, root: any, props: any, public changeBits: any) {
        super(key, root, props, {});
    }
    preRender() { return this };
}

class Comp extends Base {
    constructor(key: any, root: any, props: any, state: any) {
        super(key, root, props, state);
        this.context = { root };
        this.changeBits = Comp.changeBits;
    }

    preRender() {
        const p = this.props;
        const { s } = this.state;

        let lang = 'en';
        TSXAir.runtime.updateState(this, s => (s.b++, Comp.changeBits['s.b']));
        const innerJsx = new VElm(`${this.key}_${0}`, { lang }, {}, Frag0);
        if (s.b < 0) {
            return new VElm(`${this.key}_${1}`, { 's.b': s.b }, {}, Frag1)
        }
        if (s.b > 10) {
            return innerJsx // ie. VElm(Frag0, {$key: 0}, { lang: lang });
        }
        lang = 'he';
        this.volatile = { lang };
        return new VElm(`${this.key}_${2}`, { innerJsx, 's.b': s.b, 'p.a': p.a }, {}, Frag2)
    }

    static render(key: string, p: any, s: any) {
        const instance = new Comp(key, null, p, s);
        const result = instance.preRender();
        // instance.setContextNotOnStage();
        const wrapper = globalThis?.document?.createElement('div');
        wrapper.innerHTML = result.toString(10, key, 0);
        instance.context.root = wrapper.children[0];
        instance.context[result.key] = result.tyPe.hydrate(instance.context.root, p, s);
        return instance;
    }


    // used by server only
    static toString(_ignore: 10, key: string, p: any, s: any) {
        const instance = new Comp(key, null, p, s);
        const result = instance.preRender();
        return result.toString(10, key, 0);
    }

    // used by client only, and only after SSR
    static hydrate(root: any, p: any, s: any) {
        const key = root.getAttribute('key');
        const instance = new Comp(key, root, p, s);
        const result = instance.preRender();
        instance.setContextNotOnStage();
        instance.context[result.key] = result.hydrate(root);
        return instance
    }

    $updateView(p, s, changeBits, frag: VElm) {
        const fKey = frag.getKey(this.key, 0);
        // const newDom = frag.toString(10, this.key, 0);
        frag.shallowExpressions() =>

        {
            exp1: () => {`${innerJsx}`}
        }








        for (const ctx of this.context) {
            if (ctx.onStage && newDom.indexOf(ctx.key) === -1) {
                ctx?.root?.remove();
            }
        }

        this.setContextNotOnStage();
        if (this.context[fKey]) {
            this.updateContent(this.context[fKey], changeBits, p);
        } else {
            this.context[fKey] = frag.render(this.key, 0);
            this.root.innerHTML = '';
            this.root.append(this.context[fKey].root);
        }
    }

    static changeBits = {
        's.b': 1,
        'props.a': 2,
        'lang': 4
    }
}

class Frag0 extends Frag {
    constructor(public key: string, root: any, public props: any) {
        super(key, root, props, {});
        this.context.elm0 = root;
    }
    static toString(key, p) { return `<div key="${key}" lang="${p.lang}" />` }
    static hydrate(key, root, p) { return new Frag0(key, root, p); }
    $updateView(p: any, changeBits: number) {
        if (changeBits & this.changeBits['lang']) {
            this.context.elm0.setAttribute('lang', p.lang);
        }
    }
}

class Frag1 extends Frag {
    constructor(public key: string, root: any, public props: any) {
        super(key, root, props, Comp.changeBits);
        this.context.exp0 = this.getChildRef(props['s.b'], 0, root?.child[0]?.childNode[1]);
    }
    static toString(key, p) { return `<div key=${key}>sub zero ${p.s_b}</div>` }
    static hydrate(root, p) { return new Frag1(root.getAttribute('key'), root, p); }
    $updateView(p, changeBits) {
        if (changeBits & this.changeBits['s.b']) {
            this.updateContent(this.context.elm0, this.changeBits['s.b'], p['s.b']);
        }
    }
}

class Frag2 extends Frag {
    constructor(public key: string, root: any, public props: any) {
        super(key, root, props, Comp.changeBits);
        this.context.exp0 = root?.child[0]?.childNode[1];

        this.context.elm0 = this.getChildRef(props['innerJsx'], 0, root?.child[0]?.childNode[1]);
        this.context.elm1 = this.getChildRef(props['innerJsx'], 1, root?.child[0]?.childNode[4]);
        this.context.elm2 = this.getChildRef(props['lang'], 2, root?.child[0]?.childNode[6]);
        this.context.elm3 = this.getChildRef(props['p.a'], 3, root?.child[0]?.childNode[9]);
        this.context.elm3 = this.getChildRef(props['s.b'], 4, root?.child[0]?.childNode[12]);
    }

    context: any;
    static toString(key, p) {
        return `<div key="${key}">${
            p.innerJsx.toString(10, key, 0)}${
            p['p.a'] > 0
                ? p.innerJsx.toString(10, key, 1)
                : p['s.b'].toString(10, key, 2)
            }${
            p.lang.toString(10, key, 3)
            }</div>`
    }
    static hydrate(key, root, p) { return new Frag2(key, root, p); }
    $updateView(p, changeBits) {
        if (changeBits & this.changeBits['innerJsx']) {
            this.updateContent(this.context.elm0, this.changeBits['innerJsx'], p.innerJsx);
        }
        if (changeBits & (this.changeBits['innerJsx'] | this.changeBits['p.a'] | this.changeBits['s.b'])) {
            this.updateExpression
            this.updateContent(this.context.elm0, this.changeBits['innerJsx'], p.innerJsx);
        }
        if (changeBits & this.changeBits['lang']) {
            this.updateContent(this.context.elm2, this.changeBits['lang'], p.lang);
        }
        if (changeBits & this.changeBits['p.a']) {
            this.updateContent(this.context.elm2, this.changeBits['p.a'], p['p.a']);
        }
        if (changeBits & this.changeBits['s.b']) {
            this.updateContent(this.context.elm3, this.changeBits['lang'], p['s.b']);
        }
    }
}


// runtime.handleStateChange
const


// export const Const_ = (_p: {}) => {
//     const displayedFragments: string[] = [];
//     const fInstance = {};

//     let lang;
//     // used in place of components
//     let $comp: (type: any, name: string, props: any) => string;


//     const prerender = (expandComplements: boolean, hydrateSelf: boolean, hydrateChildren: boolean) => {
//         $comp = expandComplements
//             // TODO add x-frag
//             ? (type, _name, props) => type['factory'].toString(props)
//             : (_type, name, _props) => `<div x-placeholder></div>`;

//             lang = 'en';
//             const innerJsx = {
//                 toString: () => {
//                     const key = fInstance[`innerJsx`] = (fInstance[`innerJsx`] || 0) + 1
//                     displayedFragments.push(`innerJsx${key}`);
//                     return `<div x-frag="innerJsx${key}" />`;
//                 }
//             };

//             lang = 'he';


//             const root0 = {
//                 toString: () => {
//                     displayedFragments.push(`r1`);
//                     return `<div x-frag="r1">${x > 3 ? innerJsx.toString(5) : spanFrag.toString(6)}</div>`;
//                 }
//             };


//         const html = (() => {
//             /// user code with the following replacements:
//             // - jsx => fragment from above
//             // - no var declarations
//             // - no functions declarations
//             // - 
//             return root0.toString();
//         })();

//         return {
//             html, displayedFragments, volatile: { vol1, vol2, vol3 }
//         };
//     };

//     const toString = (props:{}) => {

//         return prerender().html;
//     }
// };

export const ShallowConditional = TSXAir((p: { count: number }) => <div>{p.count > 0 ? <div>+</div> : <span>-</span>}</div>);
