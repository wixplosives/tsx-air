const extname = (path:string) => {
    const  p = path.match(/.*(\.[^.]+)/);
    return p && p[1] || '';
};

const validExt = new Set(['.tsx', '.ts', '.js', '.json']);
export const withoutExt = (path: string) => {
    const ext = extname(path);
    if (validExt.has(ext)) {
        return path.replace(new RegExp(`${extname(path)}$`), '');
    }
    return path;
};

export const asJs = (path: string) => `${withoutExt(path)}.js`;
export const asTs = (path: string) => `${withoutExt(path)}.ts`;
export const asTsx = (path: string) => `${withoutExt(path)}.tsx`;
export const isJs = (path: string) => extname(path) === 'js';
export const isTs = (path: string) => extname(path) === 'ts';
export const isTsx = (path: string) => extname(path) === 'tsx';