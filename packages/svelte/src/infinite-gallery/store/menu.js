import { writable, get } from 'svelte/store'
const options = [
    {
        label: 'Animal',
        value: 'animal',
        options: [
            { desc: 'Cats', value: '/data/cats' },
            { desc: 'Dogs', value: '/data/dogs' }
        ]
    },

    {
        label: 'Scroll type',
        value: 'scroll',
        options: [{ value: 'Infinite' }, { value: 'Paged' }]
    },

    {
        label: 'Zoom type',
        value: 'zoom',
        options: [{ value: 'Inline' }, { value: 'Modal' }, { value: 'Full page' }]
    }
];

const selected = {
    animal: options[0].options[0].value,
    scroll: options[1].options[0].value,
    zoom: options[2].options[0].value,
};

const createStore = () => {
    const store = writable({ options, selected });
    const { subscribe, update } = store;
    return {
        subscribe,
        setSelected: (selected) => update(store => ({ ...store, selected })),
        getSelected: () => get(store).selected
    }
}

export default createStore;