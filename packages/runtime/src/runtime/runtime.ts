import { Renderer } from './renderer';
import { ComponentServices } from './component.services';
import { StoresRegistry } from '../stores/stores.registry';

export class Runtime {
    readonly renderer: Renderer;
    readonly componentServices: ComponentServices;
    readonly stores = new StoresRegistry();
    
    readonly document: Document;
    readonly mockDom: HTMLElement;
    readonly HTMLElement: typeof HTMLElement;
    readonly Text: typeof Text;
    readonly Comment:typeof Comment;

    constructor(
        readonly window: Window = globalThis.window!,
        readonly requestAnimationFrame: (callback: FrameRequestCallback) => any = globalThis.requestAnimationFrame,
    ) {
        this.document = window.document;
        // @ts-ignore
        this.HTMLElement = window?.HTMLElement;
        // @ts-ignore
        this.Text = window.Text;
        // @ts-ignore
        this.Comment = window.Comment;
        this.mockDom = window.document.createElement('div');
        this.renderer = new Renderer(this);
        this.componentServices = new ComponentServices(this);
    }
}