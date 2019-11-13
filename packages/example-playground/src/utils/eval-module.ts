
const initRequirable = async () => ({
    '../../framework': await import('../framework'),
    './helper': await import('../examples/04.zoom/helper'),
    '../../framework/runtime': await import('../framework/runtime'),
    '../../framework/runtime/utils': await import('../framework/runtime/utils'),
    '../../framework/types/component': await import('../framework/types/component')
});


let requirable: Record<string, any> | null = null;

window.require = ((relativePath: string) => {
    if (!requirable![relativePath]) {
        console.error(relativePath + ' is not registered for require');
    }
    return requirable![relativePath];
}) as any;

export const evalModule = async (src: string, path: string) => {
    const exports = {};
    if (!requirable) {
        requirable = await initRequirable();
    }

    // tslint:disable-next-line: no-eval
    eval(src);
    requirable[path] = exports;
    return exports as any;
};