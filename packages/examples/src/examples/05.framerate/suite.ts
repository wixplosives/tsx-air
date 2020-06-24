import { ExampleSuiteApi, Features, feature } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { delay } from '@tsx-air/utils';

export const features: Features = [
    feature('high', 'framerate'),
];

export function suite (api: ExampleSuiteApi) {
    it('compile', async ()=>{
        await api.afterLoading;
        console.log();
    });
}

