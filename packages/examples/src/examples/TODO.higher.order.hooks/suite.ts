import { ExampleSuiteApi, Features, feature } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';
import { expect } from 'chai';

export const features: Features = [
    feature('hook')
];

export function suite(api: ExampleSuiteApi) {
    it('follows the mouse cursor', async () => {
        const page = await api.afterLoading;
        await page.mouse.move(0,0);
        
        
    });
}