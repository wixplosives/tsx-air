import { asTsx, asJs, removeBuilt, createCjs } from './build.helpers';
import cloneDp from 'lodash/cloneDeep';
import { BuiltCode, Snippets } from './types';
import isEqual from 'lodash/isEqual';
import { build, preloads } from './build';
import { Compiler } from '@tsx-air/types';

export async function rebuild(built: BuiltCode, overridesSources: Record<string, string>, injects: Snippets = {}): Promise<BuiltCode> {
    const { _cjsEnv, _usedBuildTools: { loader, compiler }, path } = built;
    for (const [src, source] of Object.entries(overridesSources)) {
        const oldVersion = _cjsEnv.sources.readFileSync(asTsx(src), { encoding: 'utf8' });
        if (oldVersion !== source) {
            removeBuilt(_cjsEnv, src);
            _cjsEnv.sources.writeFileSync(asTsx(src), source);
        }
    }
    for (const [src] of [...Object.entries(injects), ...Object.entries(built._injected)]) {
        if (!isEqual(built._injected[src], injects[src])) {
            removeBuilt(_cjsEnv, src);
        }
    }
    return build(compiler, loader, path, injects, _cjsEnv);
}

export async function reCompile(built: BuiltCode, newCompiler: Compiler): Promise<BuiltCode> {
    const { _cjsEnv, _usedBuildTools: { loader }, path, _injected } = built;
    const modules = await createCjs(preloads);
    modules.sources = _cjsEnv.sources;
    return build(newCompiler, loader, path, _injected, modules);
}

export async function addBreakpoint(built: BuiltCode, path: string, line: number): Promise<BuiltCode> {
    const injects = cloneDp(built._injected);
    path = asJs(path);
    injects[path] = { ...injects[path], [line]: 'debugger;' };
    return rebuild(built, {}, injects);
}

export async function removeBreakpoint(built: BuiltCode, path: string, line: number): Promise<BuiltCode> {
    const injects = cloneDp(built._injected);
    path = asJs(path);
    if (injects[path]) {
        delete injects[path][line];
    }
    return rebuild(built, {}, injects);
}
