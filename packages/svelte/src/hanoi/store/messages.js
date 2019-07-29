import { writable } from 'svelte/store';

const initialStore = () => ({
    messages: [],
});

let _id = 0;
const messageDelay = 2000;

const createMessage = (message, type, remove) => {
    const id = `message-${_id++}`;
    const messageTimeout = setTimeout(() => remove(id), messageDelay);
    return {
        message, type, id
    };
}

const createStore = () => {
    const { subscribe, update } = writable(initialStore());

    const removeMessage = (id) => update(s => ({
        ...s,
        messages: s.messages.filter(m => m.id !== id)
    }));

    return {
        subscribe,
        addMessage: (message, type) => {
            update(s => {
                return {
                    ...s,
                    messages: [...s.messages, createMessage(message, type, removeMessage)]
                }
            });
        },
        clear: () => update(s => initialStore())
    }
}

export default createStore;