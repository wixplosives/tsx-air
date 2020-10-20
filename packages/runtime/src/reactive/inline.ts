import { store, WithUserCode } from '.';
import { Component } from './component';
import { Displayable } from './displayable';
import { Fragment } from './fragment';

export function inline(instance: Component, id: string, InlineType: new (p: Component, key: string) => Inline, args: any[]) {
    const { $rt } = instance;
    let $inline: Inline = $rt.inline.get(instance, id);
    if (!$inline) {
        if (!Inline.isType(InlineType)) {
            throw new Error(`Invalid 'use': argument must be a Hook`);
        }
        $inline = new InlineType(instance, id);
        $rt.inline.register(instance, id, $inline);
    }
    $inline.stores.$args.$set(args);
    return $inline.userCode();
}

export class Inline<T extends Displayable = Fragment> extends Displayable implements WithUserCode<T> {
    static is(x: any): x is Inline {
        return x && x instanceof Inline;
    }
    static isType(x: any): x is typeof Inline {
        return x && x.prototype && x.prototype instanceof Inline;
    }
    volatile: any;

    constructor(key: string, parent: Component) {
        super(key, parent, parent.$rt);
        this.stores.$props = this.owner!.stores.$props;
        this.stores.$props.$subscribe(this.storeChanged);
        this.stores.$args = store(this, '$args', {});
        this.volatile = parent.volatile;
    }

    updated() {
        this.modified = new Map();
    }

    userCode(): T {
        throw new Error(`inline "userCode" not implemented: ` + this.constructor.name);
    }

    mounted() {
        super.mounted();
        this.updated();
    }
}