import { createMemoryFs } from '@file-services/memory';
import { Loader } from './examples.index';
import { Compiler } from './../compilers';
import { build } from './build';
import { expect } from 'chai';

describe('build', () => {
    const compiler: Compiler = {
        compile: async (source, _path) => {
            return source;
        },
        label: 'copier'
    };
    const mockFs = createMemoryFs({
        '/data.js': `
            export const b='b'`,
        '/src': {
            'examples':{
                'ex1':{
                    'source.js': `
                        import { Component, Dom } from '../../framework/types/component';
                        export class TestComp extends Component {
                        }`
                },
                'ex2': {
                    'source.js': `
                    import {TSXAir} from '../../framework';
                    export const air = TSXAir;`
                }
            },
            'main.js': `
                import {a} from './a';
                import {b} from '../data'
                export const c = {a,b};`,
            'a.js': `
                import {val} from './inner/a';
                export const a=val`,
            'inner': {
                'a.js': `
                import {b} from '../../data';
                export const val = 'a'+b;`
            }
        }
    });

    const load: Loader = async path => {
        console.log(path, mockFs.fileExistsSync(path));
        return mockFs.readFileSync(path, 'utf8');
    };

    it('should evaluate a module with no imports', async () => {
        const res = await build(compiler, load, '/data');
        const mod = await res.module;
        expect(res.error).to.equal(undefined);
        expect(mod).to.deep.equal({
            b: 'b'
        });
    });
    it('should evaluate a module with imports', async () => {
        const res = await build(compiler, load, '/src/main');
        expect(res.error).to.equal(undefined);
        expect(await res.module).to.deep.equal({
            c: {
                a: 'ab',
                b: 'b'
            }
        });
    });
    it('should evaluate a module that uses the framework', async () => {
        const res = await build(compiler, load, '/src/examples/ex2/source');
        expect(res.error).to.equal(undefined);
        expect((await res.module as any).air).to.be.instanceOf(Function);
    });
    it('should have access to preloaded modules', async () => {
        const res = await build(compiler, load, '/src/examples/ex1/source');
        expect(res.error).to.equal(undefined);
        expect((await res.module as any).TestComp).to.be.instanceOf(Function);
        expect(((await res.module as any).TestComp)).to.be.instanceOf(Function);
    });
});