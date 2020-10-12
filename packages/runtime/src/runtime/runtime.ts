import { Renderer } from './renderer';
import { ComponentServices } from './component.services';
import { ViewUpdater } from './view.updater';
import { Component, Reactive, Hook, Store } from '../reactive';
import { Registry } from '../internals/registry';

export class Runtime {
    readonly renderer = new Renderer(this);
    readonly api = new ComponentServices(this);
    readonly updater = new ViewUpdater(this);
    readonly stores = new Registry<Store>((instance: Reactive, id: string, store: Store) => {
        if (instance.stores) {
            instance.stores[id] = store;
        }
        store.$subscribe(instance.storeChanged);
    });
    readonly hooks = new Registry<Hook>((instance: Reactive, id: string, hook: Hook) => {
        instance.hooks[id] = hook;
    });

    readonly document: Document;
    readonly mockDom: HTMLElement;
    readonly HTMLElement: typeof HTMLElement;
    readonly Text: typeof Text;
    readonly Comment: typeof Comment;
    private readonly hooksCache = new Map<Hook, any>();

    constructor(
        readonly window: Window = globalThis.window!,
        readonly requestAnimationFrame: (callback: FrameRequestCallback) => any = cb => globalThis.requestAnimationFrame(cb),
    ) {
        this.document = window.document;
        // @ts-ignore
        this.HTMLElement = window.HTMLElement;
        // @ts-ignore
        this.Text = window.Text;
        // @ts-ignore
        this.Comment = window.Comment;
        this.mockDom = window.document.createElement('div');
    }

    preRender(comp: Component) {
        return comp.userCode();
    }

    getHookValue(hook: Hook) {
        if (this.hooksCache.has(hook)) {
            return this.hooksCache.get(hook);
        } else {
            const val = hook.userCode();
            this.hooksCache.set(hook, val);
            return val;
        }
    }

    removeHookCache(hook: Hook) {
        this.hooksCache.delete(hook);
    }
}