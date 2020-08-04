import { Component, Displayable, VirtualElement, ExpressionDom } from '../types';
import { Runtime } from '..';
import isArray from 'lodash/isArray';

export class Renderer {
    get isHydrating(){
        return !!this.hydrating;
    }
    maxDepth = 100;
    private hydrating = 0;
    
    constructor(readonly runtime: Runtime) { }
    hydrate = (vElm: VirtualElement<any>, dom: HTMLElement) => this.renderOrHydrate(vElm, dom);
    render = (vElm: VirtualElement) => this.renderOrHydrate(vElm);

    toString = (x: any): string => {
        if (isArray(x)) {
            return x.map(i => this.toString(i)).join('');
        }
        if (VirtualElement.is(x)) {
            return this.runtime.updater.getUpdatedInstance(x).toString();
        }
        return x?.toString() || '';
    };

    attr = (name: string, value: any): string => {
        if (name === 'style') {
            return `style="${this.spreadStyle(value)}"`;
        }
        if (value === !!value) {
            return value ? name : '';
        }
        return `${name}="${value}"`;
    };

    hydrateExpression = (value: any, start: Comment): ExpressionDom => {
        value = isArray(value) ? value : [value];
        let hydratedDomNode: Node = start;
        const hydrated = value
            .filter((i: any) => i !== undefined && i !== null && i !== '')
            .map((i: any) => {
                hydratedDomNode = hydratedDomNode.nextSibling!;
                if (VirtualElement.is(i)) {
                    return this.runtime.renderer.hydrate(i, hydratedDomNode as HTMLElement);
                }
                return i.toString();
            });
        if (!(hydratedDomNode.nextSibling instanceof
            // @ts-ignore
            this.runtime.Comment)) {
            throw new Error(`Hydration error: Expression does not match data. (no ending comment)`);
        }
        return {
            start,
            end: hydratedDomNode.nextSibling as Comment,
            value: hydrated
        };
    };



    private spreadStyle(styleObj: string | object): string {
        if (typeof styleObj === 'string') {
            return styleObj;
        }
        let style = '';
        for (const [key, value] of Object.entries(styleObj)) {
            style = style + `${key}:${isNaN(Number(value)) ? value : (value | 0) + 'px'};`;
        }
        return style;
    }

    private renderOrHydrate(vElm: VirtualElement<any>, dom?: HTMLElement): Displayable {
        const { key, props, type, parent } = vElm;
        if (Component.isType(type)) {
            const comp = this.hydrateComponent(key!, parent, dom, type, props);
            if (vElm.parent && key) {
                vElm.parent.ctx.components[key] = comp;
            }
            return comp;
        }
        const instance = new type(vElm.key!, vElm, this.runtime);
        if (!dom) {
            this.runtime.mockDom.innerHTML = instance.toString();
            dom = this.runtime.mockDom.children[0] as HTMLElement;
        }
        instance.hydrate(vElm, dom);
        if (vElm.parent && key) {
            vElm.parent.ctx.components[key] = instance;
        }
        return instance;
    }

    private hydrateComponent<Comp extends Component>(
        key: string,
        parent: Displayable | undefined,
        domNode: HTMLElement | undefined,
        type: typeof Component,
        props: any
    ): Comp {
        this.hydrating++;
        const instance = (parent?.ctx.components[key] || new type(key, parent, props, this.runtime)) as Comp;
        const preRender = instance.preRender();
        // prerender already expressed in view ny toString
        this.runtime.updater.validate(instance);
        instance.ctx.root = this.renderOrHydrate(preRender, domNode);
        this.hydrating--;
        return instance;
    }
}
