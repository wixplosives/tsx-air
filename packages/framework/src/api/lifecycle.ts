export function when(_action: () => void): void;
export function when(_predicate: any | any[], _action: () => void): void;
export function when(_a1: any | any[], _a2?: () => void) {/* */ }

export function memo(_action: () => any): any;
export function memo(_predicate: any | any[], _action: () => any): any;
export function memo(_a1: any | any[], _a2?: () => void): any {/* */ }

export function invalidate():void {/* */ }

export function afterMount(_cb: (rootRef: HTMLElement) => void|(()=>void)) {/* */ }

export function afterDomUpdate(action: () => void):void;
export function afterDomUpdate(predicate:any|any[], action: () => void):void;
export function afterDomUpdate(_predicate: any , _cb?: () => void) {/* */ }
