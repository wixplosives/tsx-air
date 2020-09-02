import { Renderer } from './renderer';
import { ComponentServices } from './component.services';
import { StoresRegistry } from '../stores/stores.registry';
import { ViewUpdater } from './view.updater';

export class Runtime {
    readonly renderer = new Renderer(this);
    readonly api = new ComponentServices(this);
    readonly updater = new ViewUpdater(this);
    readonly stores = new StoresRegistry();

    readonly document: Document;
    readonly mockDom: HTMLElement;
    readonly HTMLElement: typeof HTMLElement;
    readonly Text: typeof Text;
    readonly Comment: typeof Comment;

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
}