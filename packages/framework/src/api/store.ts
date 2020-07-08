import { StoreData } from '../runtime/store';

export const store = <T extends StoreData>(item: T) => item;
