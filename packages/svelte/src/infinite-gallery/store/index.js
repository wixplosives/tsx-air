import { derived } from 'svelte/store';
import createImages from './images';

import createMenu from './menu';

const createStore = () => {
    const menu = createMenu();
    const images = createImages(menu.getSelected().animal);


    const stores = { images, menu };

    return { ...stores };
}

const store = createStore();
export const { menu } = store;
export const { images } = store; 
