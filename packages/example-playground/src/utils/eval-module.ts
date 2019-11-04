
const initRequirable = async () => ({
    '../../framework/runtime': await import('../framework/runtime'),
    '../../framework/runtime/utils': await import('../framework/runtime/utils'),
    '../../framework/types/component': await import('../framework/types/component')
});


let requirable: Record<string, any> | null = null;



export const evalModule = async (src: string) => {
    const exp = window.exports = {};
    if (!requirable) {
        requirable = await initRequirable();
    }
    window.require = ((path: string) => {
        if (!requirable![path]) {
            console.error(path + ' is not registered for require');

        }
        return requirable![path];
    }) as any;

    eval(src);
    window.exports = {};
    return exp as any;
};