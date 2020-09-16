// import { ExampleSuiteApi, Features, feature } from '@tsx-air/types';
// import { htmlMatch } from '@tsx-air/testing';
// import { expect } from 'chai';

// export const features: Features = [
//     feature('dynamic', 'children'),
// ];

// export function suite(api: ExampleSuiteApi) {
//     it('loaded all the images', async () => {
//         const page = await api.afterLoading;
//         await htmlMatch(page, {
//             cssQuery: 'img',
//             pageInstances: 4
//         });
//         const src = await Promise.all(
//             (await page.$$('img'))
//                 .map(img => img.getProperty('src').then(s => s.jsonValue())));
//         const { baseUrl } = api.server;
//         expect(src).to.eql([
//             baseUrl + '/images/bunny.jpg',
//             baseUrl + '/images/gradient.jpg',
//             baseUrl + '/images/pretty-boy.jpg',
//             baseUrl + '/images/weird.jpg',
//         ]);
//     });

//     xit(`each button removes an image`, async () => {
//         const page = await api.afterLoading;
//         await htmlMatch(page, {
//             cssQuery: 'button',
//             textContent: 'Remove',
//             pageInstances: 4,
//         });
//         const buttons = await page.$$('button');
//         await (Promise.all([
//             buttons[0].click(),
//             buttons[2].click(),
//             buttons[3].click(),
//         ]));
//         await htmlMatch(page, {
//             cssQuery: 'button',
//             textContent: 'Remove',
//             pageInstances: 0,
//         });
//         await htmlMatch(page, {
//             cssQuery: 'button[disabled]',
//             textContent: 'Remove',
//             pageInstances: 1,
//         });
//     });
// }