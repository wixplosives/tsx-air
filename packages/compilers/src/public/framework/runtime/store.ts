import { Setter, Getter, ChangeBitmask } from './../types/type-utils';


class ReactiveStore<T> {
    data:T;
    readonly changeBitmask:ChangeBitmask<T>;

    constructor(initialData: T, changeBitmask?: ChangeBitmask<T>) {
        this.data = initialData;
        this.changeBitmask = changeBitmask || Object.keys(initialData).sort().reduce((acc, key, index) => {
            acc[key] = 1 << index;
            return acc;
        }, {} as ChangeBitmask<T>);
    }

    $set: Setter<T> = (key, val) => {        
        this.data[key] = val;
        return this.changeBitmask[key];
    };
    
    $get: Getter<T> = key => this.data[key];
}