import { imported as local } from './local.imports/a';
import isFunction from 'lodash/isFunction';
import { when } from '@tsx-air/framework';

(window as any).imports = {
    local,
    packageDependency: !isFunction(local),
    monorepoPackage: isFunction(when)
};