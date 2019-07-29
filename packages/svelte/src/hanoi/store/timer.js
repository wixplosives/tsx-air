import { writable, get } from 'svelte/store';

const initialStore = (size) => ({
    size,
    time: (size * size + 200) * 1000 | 0,
    timerInterval: null
});

const createStore = (size) => {
    const store = writable(initialStore(size));
    const { update, subscribe } = store;
    const callbacks = [];

    const changeInterval = (timerInterval) => update(store => {
        clearInterval(store.timerInterval);
        return { ...store, timerInterval };
    });

    return {
        subscribe,
        start: () => {
            if (!get(store).timerInterval)
                changeInterval(setInterval(() => update(
                    store => {
                        if (store.time <= 0) {
                            changeInterval(null);
                            callbacks.forEach(fn => fn());
                            return store;
                        } else {
                            return { ...store, time: store.time - 100 | 0 }
                        }
                    }
                ), 100))
        },
        pause: () => changeInterval(null),
        reset: () => {
            changeInterval(null);
            update(store => initialStore(store.size));
        },
        setSize: (size) => {
            changeInterval(null);
            update(_ => initialStore(size));
        },
        addTime: (diffMs) => update(s => ({
            ...s, time: s.time + diffMs | 0
        })),
        onTimeOver: (callback) => {
            callbacks.push(callback);
        }, 
        getTime: () => get(store).time
    };
}

export default createStore;