export class RuntimeConfig {
    public window:Window = globalThis.window;
    public document:Document = globalThis.window?.document;
}