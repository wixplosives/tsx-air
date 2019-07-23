import { writable } from 'svelte/store';

const createTower = (initialSize, id) => ({
    id,
    blocks: [...Array(initialSize).keys()].map(i => i + 1),
    isSelected: false
});

const initStoreData = (size) => ({
    size,
    towers: [size, 0, 0].map(createTower),
    selectedTower: null,
    error: null,
    errorTimeout: null,
});

const withFirst = (tower, item) => ({ ...tower, blocks: [item, ...tower.blocks] });
const withoutFirst = (tower) => ({
    ...tower,
    blocks: tower.blocks.slice(1)
});
const withSelected = (store, index) => {
    return {
        ...store,
        selectedTower: index,
        towers: store.towers.map((c, i) => ({
            ...c,
            isSelected: (i === index)
        }))
    }
}
const withError = (store, update, error) => {
    store.errorTimeout && store.errorTimeout.cancel();
    const C = error && setTimeout(() => {
        update && update(s => ({ ...s, error: null, errorTimeout: null }));
    }, 1000);
    return { ...store, error, errorTimeout };
}
const withNoError = (store) => withError(store, null, null);

const createStore = (size) => {
    const { subscribe, update, set } = writable(initStoreData(size));

    return {
        subscribe,
        setSize: (newSize) => newSize !== size
            ? set(initStoreData(newSize))
            : null,
        selectTower: (index) => update(store => {
            const { selectedTower, towers } = store;
            const firstBlock = (index) => towers[index].blocks[0] || Number.MAX_VALUE;
            const moveFirst = (from, to) => towers.map((c, i) => {
                if (i === from) return withoutFirst(c);
                if (i === to) return withFirst(c, towers[from].blocks[0]);
                return c;
            });
            const tower = towers[index];

            if (index === null) {
                return withSelected(store, null);
            }

            if (selectedTower === null) {
                return tower.blocks.length > 0
                    ? withSelected(store, index)
                    : withError(store, update, `Maybe try a higher tower`);
            }

            if (selectedTower === index) {
                return withSelected(store, null)
            }

            const itemToMove = firstBlock(selectedTower);
            if (firstBlock(index) > itemToMove) {
                return withNoError(withSelected({
                    ...store,
                    towers: moveFirst(selectedTower, index),
                }, null));
            }
            return withError(withSelected(
                store,
                null), update,
                `You can't put it there (that's what she said)`
            );
        })
    }
};

export const towers = createStore(5);