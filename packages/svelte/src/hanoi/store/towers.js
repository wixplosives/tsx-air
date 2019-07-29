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
    lastMove: null,
    specialTiles: {
    },
    win: false
});

const withFirst = (tower, item) => ({ ...tower, blocks: [item, ...tower.blocks] });
const withoutFirst = (tower) => ({
    ...tower,
    blocks: tower.blocks.slice(1)
});

const withSelected = (store, index) => {
    const { specialTiles } = store;
    const selectedTile = store.towers[index] && store.towers[index].blocks[0];
    Object.keys(specialTiles).forEach(tileSize => {
        if (specialTiles[tileSize] === 'selected') {
            delete specialTiles[tileSize];
        }
    });
    selectedTile && (specialTiles[selectedTile] = 'selected');
    return {
        ...store,
        selectedTower: index,
        specialTiles
    };
}

const createStore = (size) => {
    const { subscribe, update, set } = writable(initStoreData(size));

    return {
        subscribe,
        setSize: (newSize) => newSize !== size
            ? set(initStoreData(newSize))
            : null,
        selectTower: (index) => {
            let error = null;
            let bonus = null;
            let win = false;
            update(store => {
                const { selectedTower, towers } = store;
                const firstBlock = (index) => towers[index].blocks[0] || Number.MAX_VALUE;
                const moveFirst = (from, to) => towers.map((c, i) => {
                    if (i === from) return withoutFirst(c);
                    if (i === to) return withFirst(c, towers[from].blocks[0]);
                    return c;
                });
                const tower = towers[index];
                const highest = towers.reduce((res, t) => res && res.blocks.length > t.blocks.length ? res : t);

                if (index === null) {
                    return withSelected(store, null);
                }

                if (selectedTower === null) {
                    if (tower.blocks.length > 0) {
                        return withSelected(store, index);
                    } else {
                        error = `Maybe try a higher tower`;
                        return store;
                    }
                }

                if (selectedTower === index) {
                    return withSelected(store, null)
                }

                const itemToMove = firstBlock(selectedTower);
                if (firstBlock(index) > itemToMove) {
                    if (selectedTower === highest.id) {
                        bonus = `Shortened highest tower`;
                    }
                    if (index === highest.id) {
                        bonus = `Built highest tower`;
                    }
                    if (store.lastMove === `${index}->${selectedTower}`) {
                        bonus = null;
                        error = `No regrets!`;
                    }

                    const ret = withSelected({
                        ...store,
                        lastMove: `${selectedTower}->${index}`,
                        towers: moveFirst(selectedTower, index),
                    }, null);
                    if (ret.towers[1].blocks.length === store.size) {
                        bonus = `Move the tower! (to the wrong place)`;
                    }
                    win = ret.towers[2].blocks.length === store.size;
                    return { ...ret, win };
                }

                error = `You can't put it there (that's what she said)`;
                return store;
            });

            return { error, bonus, win };
        },
        setPartyBlock: (index, type) =>
            update(store => store.specialTiles[index] === 'selected' ? store : {
                ...store,
                specialTiles: {
                    ...store.specialTiles,
                    [index]: type
                }
            })
    }
};

export default createStore;