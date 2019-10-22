type Predicate = () => boolean;
export interface Bind {
    init: <T>(value: T) => T;
    when: (predicate: Predicate | Predicate[], action: () => (void | Promise<void>)) => void;
    wasChanged: (value: any) => () => boolean;
}


export const bind: Bind = {
    init: <T>(value: T) => value,
    when: (_predicate, _action) => void (0),
    wasChanged: (_value: any) => () => true
};