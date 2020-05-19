import React from 'react';

export const source = (props: { a: Children }) => {
    return <div>{props.a}</div>;
};

export const target: Component = {
    templates: {
        div1: {
            toString(props: { children: Children }) {
                return `<div>${childrenToString(props.children)}</div>`;
            },
            bits: {
                props_children: 0x1
            },
            hydrate(props: any, el: Element, key: any) {
                const res: FragmentInstance = {
                    context: {
                        root: el,
                        children: hydrateChildren(el, props.children)
                    },
                    props,
                    type: target.templates.div1,
                    key,
                    element: el
                };
                return res;
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified | target.templates.div1.bits.props_children) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children,
                        instance.context.children as Record<string, FragmentInstance | ComponentInstance>
                    );
                }
            }
        }
    },
    bits: {
        props_a: 0x1
    },
    userCode(props: { a: string }, modified: number) {
        return virtualEl(
            target.templates.div1,
            { children: props.a },
            modified & target.bits.props_a ? target.templates.div1.bits.props_children : 0
        );
    }
};

export const source2 = (props: { useShort: boolean; description: string; shortDescription: string }) => {
    const item = props.useShort ? <span>{props.shortDescription}</span> : <span>{props.description}</span>;
    return (
        <div>
            {item}
            {item}
        </div>
    );
};
export const target2 = {
    templates: {
        span1: {
            toString(props: { children: string }) {
                return `<span>${props.children}</span>`;
            },
            bits: {
                props_children: 0x1
            },
            hydrate(props: any, el: Element, key: any) {
                return {
                    context: {
                        root: el
                    },
                    props,
                    type: target2.templates.div1,
                    key,
                    element: el
                };
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified | target2.templates.span1.bits.props_children) {
                    (instance.context.root as Element).innerHTML = props.children;
                }
            }
        },
        span2: {
            toString(props: { children: string }) {
                return `<span>${props.children}</span>`;
            },
            bits: {
                props_children: 0x1
            },
            hydrate(props: any, el: Element, key: any) {
                return {
                    context: {
                        root: el
                    },
                    props,
                    type: target2.templates.div1,
                    key,
                    element: el
                };
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified | target2.templates.span2.bits.props_children) {
                    (instance.context.root as Element).innerHTML = props.children;
                }
            }
        },
        div1: {
            toString(props: { children: VirtualElement }) {
                return `<div>${props.children.type.toString(props.children.props)}</div>`;
            },
            bits: {
                props_children: 0x1
            },
            hydrate(props: any, el: Element, key: any) {
                return {
                    context: {
                        root: el,
                        children: hydrateChildren(el, props.children)
                    },
                    props,
                    type: target2.templates.div1,
                    key,

                    element: el
                };
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified | target2.templates.div1.bits.props_children) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children,
                        instance.context.children as Record<string, FragmentInstance | ComponentInstance>
                    );
                }
            }
        }
    },
    bits: {
        props_shortDescription: 0x1,
        props_description: 0x2,
        props_useShort: 0x3
    },
    userCode(props: { useShort: boolean; description: string; shortDescription: string }, modified: number) {
        const item = props.useShort
            ? virtualEl(
                  target2.templates.span1,
                  { children: props.shortDescription },
                  modified & target2.bits.props_shortDescription ? target2.templates.span1.bits.props_children : 0
              )
            : virtualEl(
                  target2.templates.span2,
                  { children: props.description },
                  modified & target2.bits.props_description ? target2.templates.span2.bits.props_children : 0
              );
        return virtualEl(
            target2.templates.div1,
            { children: [item.withKey(0), item.withKey(0)] },
            modified &
                (target2.bits.props_useShort | target2.bits.props_shortDescription | target2.bits.props_description)
                ? target2.templates.div1.bits.props_children
                : 0
        );
    }
};
export interface VirtualElement {
    type: Fragment | Component;
    props: any;
    key: any;
    modified: number;
    withKey: (key: any) => VirtualElement;
}
export interface Component {
    templates: Record<string, Fragment>;
    bits: Record<string, number>;
    userCode: (props: any, modified: number) => VirtualElement;
}
export interface Fragment {
    bits: Record<string, number>;
    toString(props: any): string;
    hydrate(props: any, element: Element, key: any): FragmentInstance;
    update(props: any, modified: number, instance: FragmentInstance): void;
}

export interface FragmentInstance {
    type: Fragment;
    props: any;
    context: Context;
    key: any;
    element: Element;
}

export interface ComponentInstance {
    type: Component;
    props: any;
    root: FragmentInstance | ComponentInstance;
    key: any;
    element: Element;
}

export type Context = Record<
    string,
    FragmentInstance | Element | ComponentInstance | Record<string, ComponentInstance | FragmentInstance>
>;
export const virtualEl = (type: Fragment, props: any, modified = 0, key = 0) => {
    const res: VirtualElement = {
        type,
        props,
        modified,
        key,
        withKey(k) {
            return virtualEl(type, props, modified, k);
        }
    };
    return res;
};

export type Child = string | VirtualElement;
export type Children = Child | Child[];

export const childrenToString = (children: Children) => {
    if (isArray(children)) {
        return children.map(childToString).join('');
    }
    return childToString(children);
};
export const childToString = (child: Child) => {
    if (typeof child === 'string') {
        return child;
    }
    return child.type.toString(child.props);
};
export const hydrateChildren = (parentElement: Element, children: Children) => {
    const hydratableChildren = (isArray(children) ? children : [children]).filter(
        c => typeof c !== 'string'
    ) as VirtualElement[];
    return hydratableChildren.reduce((accum, child, idx) => {
        accum[child.key] = hydrateVElement(parentElement.children[idx], child);
        return accum;
    }, {} as Record<string, ComponentInstance | FragmentInstance>);
};

export function hydrateVElement(element: Element, virtualEl: VirtualElement): ComponentInstance | FragmentInstance {
    const elType = virtualEl.type;

    if (isFrag(elType)) {
        return elType.hydrate(virtualEl.props, element, virtualEl.key);
    }
    const rootElement = elType.userCode(virtualEl.props, -1);

    const instance: ComponentInstance = {
        root: hydrateVElement(element, rootElement),
        props: virtualEl.props,
        type: virtualEl.props,
        key: virtualEl.key,
        element
    };
    return instance;
}

export const updateChildren = (
    parentElement: Element,
    children: Children,
    instances: Record<string, ComponentInstance | FragmentInstance>
) => {
    const updatableChildren = (isArray(children) ? children : [children]).filter(
        c => typeof c !== 'string'
    ) as VirtualElement[];

    for (let i = 0; i < updatableChildren.length; i++) {
        const child = updatableChildren[i];
        if (child) {
            const oldChild = instances[child.key];
            if (!oldChild || oldChild.type !== child.type) {
                // create child
            } else {
                updateInstance(oldChild, child);
            }
        }
    }
    // remove unused and sort in html
};

export const updateInstance = (instance: ComponentInstance | FragmentInstance, virtualEl: VirtualElement) => {
    const elType = virtualEl.type;

    if (isFrag(elType)) {
        elType.update(virtualEl.props, virtualEl.modified, instance as FragmentInstance);
    } else {
        const rootEl = elType.userCode(virtualEl.props, virtualEl.modified);
        updateInstance((instance as ComponentInstance).root, rootEl);
    }
};

export function isArray(item: any): item is any[] {
    if (item && item.filter) {
        return true;
    }
    return false;
}

export function isFrag(item: any): item is Fragment {
    if (item && item.hydrate) {
        return true;
    }
    return false;
}
