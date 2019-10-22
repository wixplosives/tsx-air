import { TSXAir, store } from '../../framework';
import { Shop, ShopItem } from '../simple.stores/source';

export const ShopWithApi = TSXAir((props: { api: string }) => {
    /*
        data is a derived store, so it WILL be reactive, that's sugar for:
            const data = fetch(props.api).then(data => data.json());
            when(props.api, () => data = fetch(props.api).then(data => data.json()));
     */
    const data = store.derived(fetch(props.api).then(({ json }) => json() as Promise<ShopItem[]>));

    /*
        async store and assigns the resolved value onto the store, making the promise resolution reactive
        It adds the AsyncStoreApi to the store: $pending, $rejected, $promise, $resolved (=store iff resolved)
    */
    const items = store.async(store.derived(data));

    if (items.$pending) {
        return <div className="preloader" />;
    }

    if (items.$rejected) {
        return <div className="error">{items.$rejected}</div>;
    }

    return <Shop {...{ items }} />;
});