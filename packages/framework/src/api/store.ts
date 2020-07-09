import { StoreData } from '@tsx-air/runtime';

export const store = <T extends StoreData>(item: T) => item;
