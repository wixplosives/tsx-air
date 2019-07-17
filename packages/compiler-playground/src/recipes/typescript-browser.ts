import { IDirectoryContents } from '@file-services/types';

export const typescriptRecipe: IDirectoryContents = {
    node_modules: {
        typescript: {
            lib: {
                'lib.dom.d.ts': require('typescript/lib/lib.dom.d.ts').default,
                'lib.es2015.collection.d.ts': require('typescript/lib/lib.es2015.collection.d.ts').default,
                'lib.es2015.core.d.ts': require('typescript/lib/lib.es2015.core.d.ts').default,
                'lib.es2015.d.ts': require('typescript/lib/lib.es2015.d.ts').default,
                'lib.es2015.generator.d.ts': require('typescript/lib/lib.es2015.generator.d.ts').default,
                'lib.es2015.iterable.d.ts': require('typescript/lib/lib.es2015.iterable.d.ts').default,
                'lib.es2015.promise.d.ts': require('typescript/lib/lib.es2015.promise.d.ts').default,
                'lib.es2015.proxy.d.ts': require('typescript/lib/lib.es2015.proxy.d.ts').default,
                'lib.es2015.reflect.d.ts': require('typescript/lib/lib.es2015.reflect.d.ts').default,
                'lib.es2015.symbol.d.ts': require('typescript/lib/lib.es2015.symbol.d.ts').default,
                'lib.es2015.symbol.wellknown.d.ts': require('typescript/lib/lib.es2015.symbol.wellknown.d.ts').default,
                'lib.es2016.array.include.d.ts': require('typescript/lib/lib.es2016.array.include.d.ts').default,
                'lib.es2016.d.ts': require('typescript/lib/lib.es2016.d.ts').default,
                'lib.es2016.full.d.ts': require('typescript/lib/lib.es2016.full.d.ts').default,
                'lib.es2017.d.ts': require('typescript/lib/lib.es2017.d.ts').default,
                'lib.es2017.full.d.ts': require('typescript/lib/lib.es2017.full.d.ts').default,
                'lib.es2017.intl.d.ts': require('typescript/lib/lib.es2017.intl.d.ts').default,
                'lib.es2017.object.d.ts': require('typescript/lib/lib.es2017.object.d.ts').default,
                'lib.es2017.sharedmemory.d.ts': require('typescript/lib/lib.es2017.sharedmemory.d.ts').default,
                'lib.es2017.string.d.ts': require('typescript/lib/lib.es2017.string.d.ts').default,
                'lib.es2017.typedarrays.d.ts': require('typescript/lib/lib.es2017.typedarrays.d.ts').default,
                'lib.es5.d.ts': require('typescript/lib/lib.es5.d.ts').default
            }
        }
    }
};
