import { ExampleSuiteApi } from '@tsx-air/types';
import { htmlMatch } from '@tsx-air/testing';

export default function (api: ExampleSuiteApi) {
    it.only('should load the {url} image in two size', async () => {
        const page = await api.afterLoading;
        await htmlMatch(page, {
            cssQuery:'.zoom',
            children: [
                2,
                { cssQuery:'.zoomedIn', pageInstances:1},
                { cssQuery:'.zoomedOut', pageInstances:1},
            ]
        });
    });
}