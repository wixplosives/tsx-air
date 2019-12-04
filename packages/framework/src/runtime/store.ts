import { Setter, Getter, ChangeBitmask } from './../types/type-utils';


export class ReactiveStore<T> {
    public data:T;
    public readonly changeBitmask:ChangeBitmask<T>;

    constructor(initialData: T, changeBitmask?: ChangeBitmask<T>) {
        this.data = initialData;
        this.changeBitmask = changeBitmask || Object.keys(initialData).sort().reduce((acc:any, key:string, index:number) => {
            acc[key] = 1 << index;
            return acc;
        }, {} as ChangeBitmask<T>);
    }

    public $set: Setter<T> = (key, val) => {        
        this.data[key] = val;
        return this.changeBitmask[key];
    };
    
    public $get: Getter<T> = key => this.data[key];
}