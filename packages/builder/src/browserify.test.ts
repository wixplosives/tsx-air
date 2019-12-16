import { createMemoryFs } from '@file-services/memory';
import { expect } from 'chai';
import { browserify } from './browserify';
import { join } from 'path';
// tslint:disable-next-line: no-eval
const execute = (code: string, window: any = {}) => eval(`(window) => {${code};
    return window;}`)(window);
describe('browserify', () => {
    it('should package esm files to a single browserified file', async () => {
        const fs = createMemoryFs({

            'main.js': `
                import data from './data';
                window.wasBrowserified = data.wasImported;`,
            'data.js': `export default { wasImported: true };`
            // }
        });
        const result = execute(await browserify(fs, 'main.js', __dirname));
        expect(result).to.eql({ wasBrowserified: true });
    });
    it(`should resolve modules from node_modules`, async () => {
        const fs = createMemoryFs({
            'main.js': `
                import { isFunction } from 'lodash';
                window.wasBrowserified = isFunction(()=>true);`,
        });
        const result = execute(await browserify(fs, 'main.js', __dirname));
        expect(result).to.eql({ wasBrowserified: true });
    });

});
