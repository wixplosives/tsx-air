// source 1 simple example
// export const source = (props: { a: Children }) => {
//     return <div>{props.a}</div>;
// };
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
                        children: hydrateChildren(el, props.children, 0)
                    },
                    props,
                    type: target.templates.div1,
                    key,
                    element: el
                };
                return res;
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified & target.templates.div1.bits.props_children) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children,
                        instance.context.children as HydrateChildrenRecord,
                        0
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

// source 2 multiple roots
// export const source2 = (props: { useShort: boolean; description: string; shortDescription: string }) => {
//     const item = props.useShort ? <span>{props.shortDescription}</span> : <span>{props.description}</span>;
//     return (
//         <div>
//             {item}
//             {item}
//         </div>
//     );
// };
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
                if (modified & target2.templates.span1.bits.props_children) {
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
                if (modified & target2.templates.span2.bits.props_children) {
                    (instance.context.root as Element).innerHTML = props.children;
                }
            }
        },
        div1: {
            toString(props: { children: Children }) {
                return `<div>${childrenToString(props.children)}</div>`;
            },
            bits: {
                props_children: 0x1
            },
            hydrate(props: any, el: Element, key: any) {
                return {
                    context: {
                        root: el,
                        children: hydrateChildren(el, props.children, 0)
                    },
                    props,
                    type: target2.templates.div1,
                    key,

                    element: el
                };
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified & target2.templates.div1.bits.props_children) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children,
                        instance.context.children as HydrateChildrenRecord,
                        0
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

// source 3 conditional root
// export const source3 = (props: { useShort: boolean; title: string }) => {
//     const title = <h1>{props.title}</h1>;
//     if (props.useShort) {
//         return title;
//     }
//     return (
//         <div>
//             {title}
//             <hr />
//             {title}
//         </div>
//     );
// };
export const target3: Component = {
    templates: {
        div1: {
            toString(props: { children1: Children; children2: Children }) {
                return `<div>
                <!-- startExp -->${childrenToString(props.children1)}<!-- endExp -->
                <hr />
                <!-- startExp -->${childrenToString(props.children2)}<!-- endExp -->
            </div>`;
            },
            bits: {
                props_children1: 0x1,
                props_children2: 0x2
            },
            hydrate(props: any, el: Element, key: any) {
                const children1 = hydrateChildren(el, props.children1, 0);
                const children2 = hydrateChildren(el, props.children2, children1.countChildNodes + 1);
                const res: FragmentInstance = {
                    context: {
                        root: el,
                        children1,
                        children2
                    },
                    props,
                    type: target3.templates.div1,
                    key,
                    element: el
                };
                return res;
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified & target3.templates.div1.bits.props_children1) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children1,
                        instance.context.children1 as HydrateChildrenRecord,
                        2 // text node and comment to insure separation between expression and text
                    );
                }
                if (modified & target3.templates.div1.bits.props_children2) {
                    updateChildren(
                        instance.context.root as Element,
                        props.children2,
                        instance.context.children2 as HydrateChildrenRecord,
                        (instance.context.children1 as HydrateChildrenRecord).countChildNodes + 7
                    );
                }
            }
        },
        h11: {
            toString(props: { children: string }) {
                return `<h1>${props.children}</h1>`;
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
                    type: target3.templates.h11,
                    key,
                    element: el
                };
            },
            update(props: any, modified: number, instance: FragmentInstance) {
                if (modified & target3.templates.h11.bits.props_children) {
                    (instance.context.root as Element).innerHTML = props.children;
                }
            }
        }
    },
    bits: {
        props_title: 0x1
    },
    userCode(props: any, modified: number) {
        const title = virtualEl(
            target3.templates.h11,
            { children: props.title },
            modified & target3.bits.props_title ? target3.templates.h11.bits.props_children : 0
        );
        if (props.useShort) {
            return title;
        }
        return virtualEl(
            target3.templates.div1,
            { children1: title.withKey('u1'), children2: title.withKey('u2') },
            (modified & target3.bits.props_title ? target3.templates.div1.bits.props_children1 : 0) |
                (modified & target3.bits.props_title ? target3.templates.div1.bits.props_children2 : 0)
        );
    }
};

/** start framework code */
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
export type ChildrenInstances = Record<string, ComponentInstance | FragmentInstance>;
export interface HydrateChildrenRecord {
    countChildNodes: number;
    instances: ChildrenInstances;
}

export type Context = Record<string, FragmentInstance | Element | ComponentInstance | HydrateChildrenRecord>;
export const virtualEl = (type: Fragment | Component, props: any, modified = 0, key = 0) => {
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
export function childToString(child: Child): string {
    if (typeof child === 'string') {
        return child;
    }
    const elType = child.type;
    if (isFrag(elType)) {
        return child.type.toString(child.props);
    }
    const rootVel = elType.userCode(child.props, 0);
    return childToString(rootVel);
}
export const hydrateChildren = (parentElement: Element, children: Children, delta: number) => {
    const hydratableChildren = (isArray(children) ? children : [children]).filter(
        c => typeof c !== 'string'
    ) as VirtualElement[];
    const instances = hydratableChildren.reduce((accum, child, idx) => {
        accum[child.key] = hydrateVElement(parentElement.children[idx + delta], child);
        return accum;
    }, {} as ChildrenInstances);
    return {
        countChildNodes: isArray(children) ? children.length : 1,
        instances
    } as HydrateChildrenRecord;
};

export function hydrateVElement(element: Element, v: VirtualElement): ComponentInstance | FragmentInstance {
    const elType = v.type;

    if (isFrag(elType)) {
        return elType.hydrate(v.props, element, v.key);
    }
    const rootElement = elType.userCode(v.props, -1);

    const instance: ComponentInstance = {
        root: hydrateVElement(element, rootElement),
        props: v.props,
        type: v.props,
        key: v.key,
        element
    };
    return instance;
}

export const updateChildren = (
    parentElement: Element,
    children: Children,
    hydrateRes: HydrateChildrenRecord,
    delta: number
) => {
    const normalizedChildren = isArray(children) ? children : [children];
    const { instances } = hydrateRes;
    const unused = new Set(Array.from(parentElement.childNodes).slice(delta, delta + hydrateRes.countChildNodes));
    for (let i = 0; i < normalizedChildren.length; i++) {
        const child = normalizedChildren[i];
        const domChild = parentElement.childNodes[i + delta];
        if (typeof child === 'string') {
            if (domChild instanceof Text) {
                domChild.textContent = child;
                unused.delete(domChild);
            } else {
                const newText = document.createTextNode(child);
                appendBeforeIdx(parentElement, newText, i + 1);
            }
        } else {
            const oldChild = instances[child.key];
            if (!oldChild || oldChild.type !== child.type) {
                instances[child.key] = render(child);
                appendBeforeIdx(parentElement, instances[child.key].element, i + 1);
            } else {
                updateInstance(oldChild, child);
                if (domChild !== oldChild.element) {
                    appendBeforeIdx(parentElement, instances[child.key].element, i + 1);
                }
                unused.delete(oldChild.element);
            }
        }
    }
    unused.forEach(node => parentElement.removeChild(node));
};

export const updateInstance = (instance: ComponentInstance | FragmentInstance, v: VirtualElement) => {
    const elType = v.type;

    if (isFrag(elType)) {
        elType.update(v.props, v.modified, instance as FragmentInstance);
    } else {
        const rootEl = elType.userCode(v.props, v.modified);
        if (rootEl.type !== (instance as ComponentInstance).root.type) {
            const newFrag = render(rootEl);
            const oldEl = (instance as ComponentInstance).root.element;
            oldEl.parentElement!.insertBefore(newFrag.element, oldEl);
            (instance as ComponentInstance).root = newFrag;
            oldEl.parentElement!.removeChild(oldEl);
        } else {
            updateInstance((instance as ComponentInstance).root, rootEl);
        }
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

export function appendBeforeIdx(parentElement: Element, child: Node, idx: number) {
    if (parentElement.children[idx]) {
        parentElement.insertBefore(child, parentElement.children[idx]);
    } else {
        parentElement.appendChild(child);
    }
}
const templateNode = document.createElement('div');
export function render(vEl: VirtualElement) {
    templateNode.innerHTML = childToString(vEl);
    const inst = hydrateVElement(templateNode.firstElementChild!, vEl);
    templateNode.removeChild(templateNode.firstElementChild!);
    return inst;
}

export const renderRoot = (parent: HTMLElement, vEl: VirtualElement) => {
    const inst = render(vEl);
    let currentProps = vEl.props;
    parent.appendChild(inst.element);
    return {
        update(props: any) {
            currentProps = { ...currentProps, ...props };
            const updatedVel = virtualEl(
                vEl.type,
                currentProps,
                Object.keys(props).reduce((acc, key) => {
                    return acc | vEl.type.bits['props_' + key];
                }, 0)
            );
            updateInstance(inst, updatedVel);
        },
        instance: inst
    };
};

/** run example */
window.document.body.innerHTML = '<div></div><div></div><div></div>';
/** target 1 */
const runTarget1 = () => {
    const vEl = virtualEl(target, { a: 'a' });
    let val = 'b';
    const { instance, update } = renderRoot(window.document.body.children[0] as HTMLDivElement, vEl);
    instance.element.addEventListener('click', () => {
        val += '.';
        update({ a: val });
    });
};
// props: { useShort: boolean; description: string; shortDescription: string }

/** target 2 */
const runTarget2 = () => {
    let val2 = true;
    const vEl = virtualEl(target2, { description: 'gaga bafasasd', shortDescription: 'daga', useShort: val2 });
    const { instance, update } = renderRoot(window.document.body.children[1] as HTMLDivElement,  vEl);
    instance.element.addEventListener('click', () => {
        val2 = !val2;
        update({
            description: 'gaga bafasasd',
            shortDescription: 'daga',
            useShort: val2
        });
    });
};
/** target 3 */
const runTarget3 = () => {
    let title = 'b';
    let useShort = false;
    const vEl = virtualEl(target3, { title, useShort });
    const { update } = renderRoot(window.document.body.children[2] as HTMLDivElement, vEl);

    const changeTitle = document.createElement('button');
    changeTitle.innerHTML = 'Change title';

    window.document.body.appendChild(changeTitle);
    changeTitle.addEventListener('click', () => {
        title += '.';
        update({ title });
    });

    const toggleView = document.createElement('button');
    toggleView.innerHTML = 'toggle view';

    window.document.body.appendChild(toggleView);
    toggleView.addEventListener('click', () => {
        useShort = !useShort;
        update({ useShort });
    });
};

runTarget1();
runTarget2();
runTarget3();
