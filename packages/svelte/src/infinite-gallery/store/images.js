import { writable } from 'svelte/store';
const delay = (ms) => new Promise((resolve) =>
    setTimeout(resolve, ms)
);
const createStore = (apiBaseUrl) => {
    let page = 0;
    let loading = null;
    const { subscribe, update, set } = writable({
        data: [],
        loading: null
    });
    const api = {
        subscribe,
        setApiBaseUrl: (url) => {
            if (url !== apiBaseUrl) {
                apiBaseUrl = url;
                loading = null;
                set({data:[], loading});
                api.loadMore();
            }
        },
        loadMore: async () => {
            if (loading) {
                return;
            }
            loading = delay(Math.random() * 2000).then(() => fetch(`${apiBaseUrl}/page-${page++}.json`));
            update(store => ({ ...store, loading }));
            const pageData = await (await loading).json();
            update(store => ({ loading: null, data: [...store.data, ...pageData] }));
            loading = null;
        }
    };
    return api;
}

export default createStore;