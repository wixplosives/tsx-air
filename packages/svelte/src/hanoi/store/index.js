import createTowers from './towers';
import createMessages from './messages';
import createTimer from './timer';
import { get } from 'svelte/store';

const createStore = () => {
    const initialSize = 5;
    const subStores = {
        towers: createTowers(initialSize),
        messages: createMessages(),
        timer: createTimer(initialSize)
    }
    const { towers, messages, timer } = subStores;
    let warnAt = 10;

    timer.onTimeOver(() => {
        messages.addMessage(`Too slow, loser`);
    });
    setInterval(() => {
        if (timer.getTime() <= 0) {
            return;
        }
        if (timer.getTime() < warnAt * 1000) {
            warnAt--;
            messages.addMessage(warnAt, 'time');
        }

        const store = get(towers);
        const partyTile = (Math.random() * store.size + 1) | 0;
        if (partyTile === store.selectedTower) {
            return;
        }
        const type = 'bonus';
        if (Math.random() < 0.03) {
            messages.addMessage(`Quick! click the party tile!`, 'party');
            towers.setPartyBlock(partyTile, type);
            timeouts[partyTile] = setTimeout(() => {
                towers.setPartyBlock(partyTile, null);
            }, Math.random() * 2000 + 500);
        }
    }, 100);

    const timeouts = {};

    return {
        ...subStores,
        setSize: (size) => {
            timer.setSize(size);
            towers.setSize(size);
            warnAt = 10;
            messages.clear();
            messages.addMessage(`Level ${size}`, 'new game');
        },
        selectTower: (index) => {
            if (timer.getTime() > 0) {
                const { error, bonus, win } = towers.selectTower(index);
                if (win) {
                    timer.pause();
                    messages.addMessage(`You actually won ;(`, 'system');
                    return;
                }
                if (error) {
                    messages.addMessage(`-1 Second: ${error}`, 'error');
                    timer.addTime(-1000);
                    towers.selectTower(null);
                } else {
                    timer.start();
                    if (bonus) {
                        messages.addMessage(`+1 Second: ${bonus}`, 'bonus');
                        timer.addTime(1000);
                    }
                }
            } else {
                messages.addMessage(`Game over dumb-dumb`, 'error');
            }
        },
        partyTileClicked: (id) => {
            towers.setPartyBlock(id, null);
            messages.addMessage(`+1 Second: Party tiled clicked!`, 'bonus');
            timer.addTime(1000);
            clearTimeout(timeouts[id]);
        }
    }
}

export default createStore();