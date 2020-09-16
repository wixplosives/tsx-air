import { BarakGL } from './index.source';

export const runExample = (target: HTMLElement) => {
    BarakGL.render({}, target, 'append');
};

export { BarakGL as Component };