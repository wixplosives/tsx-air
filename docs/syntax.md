# Syntax

TsxAir uses standard JSX/TSX syntax, which is compiled to the vanilla JS equivalent.

## Component Definition

```tsx
import { TSXAir } from '@tsx-air/framework';
// Components are TSX functions wrapped by TSXAir call
export const ChildComp = TSXAir((props: { name: string }) => <div className="child">Child: {props.name}</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div className="parent">
        Parent: {props.name}
        <ChildComp name={props.name} />
    </div>
));
```

## Stateful Components

The `store` function defines a persistent state, with initial values. When the store changes the view will be updated. Multiple stores can be used in a component

```tsx
import { TSXAir, store } from '@tsx-air/framework';
export const StatefulComp = TSXAir(() => {
    const state = store({ counter: 0 });
    return <div onClick={() => state.counter++}>{state.count}</div>;
});
```

### Caveats

-   Updating the store is allowed only in event listeners and "when/afterMount"

```tsx
const InvalidStateChange = TSXAir(() => {
    const state = store({ counter: 0 });
    // This will fail
    return <div>{state.count++}</div>;
});
```

-   Stores may be defined **only** in the component body

```tsx
const InvalidStoreDefinition = TSXAir(() => {
    const func = () => {
        const invalidStore = store({ willFail: 'compilation' });
    };
    return <div />;
});
```

-   Destructuring a store will make prevent re-rendering upon change

```tsx
const  = TSXAir(() => {
    const { counter } = store({ counter:0 });
    const onClickA = () => counter++;
    // will show 0 and never be updated
    return <div onClick={onClick}>{count}</div>;
});
```

## Triggering Rendering

There are 3 ways to trigger a render:

-   Changes to component properties
-   Changes to a store defined in the component
-   Calling `invalidate`

## "when" and "memo"

`when` and `memo` allow running parts of the component logic only when a specific dependency has changed.

### Diffrences between when and memo:

-   a `when` action may return an "undo" function that will be called before the action is called again ( due to dependency change ) and when the component is about to be unmounted

```tsx
when(() => {
    const update = () => {
        /* do something...*/
    };
    props.dataSource.subscribe(update);
    // will be executed when props.dataSource changes (before this action is executed again)
    return () => props.dataSource.unsubscribe(update);
});
```

-   `memo` returns the returned value

```tsx
let pi = memo(() => calcPi(props.digits));
```

-   a `when` action may update a store

```tsx
// when props.url changes, set state.imageLoaded to false
when(props.url, () => {
    state.imageLoaded = false;
});
```

### Using "when"

```tsx
export const ImagePreloader = TSXAir((props: { url: string }) => {
    const state = store({ imageLoaded: false, history: [props.url] });
    // when props.url changes, set state.imageLoaded to false
    when(props.url, () => {
        state.imageLoaded = false;
    });

    // when props.url changes, update history (the depenecies are implied)
    when(() => {
        state.history = [props.url, ...state.history];
    });

    return (
        <div className="thumb">
            <div className="history">{history.join(', ')}</div>
            {state.imageLoaded ? '' : <div className="preloader" />}
            <img
                src={props.url}
                onLoad={() => (state.imageLoaded = true)}
                style={{ display: state.imageLoaded ? 'block' : 'none' }}
            />
        </div>
    );
});
```

### Using "memo":

```tsx
const Memo = TSXAir((props: { digits: number; title: string }) => {
    // will be evalutated only when props.digits change
    let pi = memo(() => calcPi(props.digits));
    // will be updated when either props.digits OR props.title change
    return (
        <div>
            {title}
            {pi}
        </div>
    );
});
```

## Component Lifecycle

### afterMount

```tsx
const GoogleMaps = TSXAir(() => {
    afterMount(ref => new google.maps.Map(ref, { center: { lat: -34.397, lng: 150.644 }, zoom: 8 }));
    return <div />;
});
```

Optionally, afterMount may return a function that will be called after the component is unmounted

```tsx
const Clock = TSXAir(() => {
    const state = store({ time: 'Not set' });
    afterMount(() => {
        const intervalId = window.setInterval(() => (state.time = new Date().toTimeString()), 1000);
        return () => clearInterval(intervalId);
    });
    return <div>{state.time}</div>;
});
```

### afterDomUpdate

```tsx
const InfiniteMeasure = TSXAir(() => {
    const state = store({ area: 0 });
    afterDomUpdate((consecutiveUpdatedFrames, domElement) => {
        if (consecutiveUpdatedFrames < 10) {
            const { width, height } = domElement.getClientRects()[0];
            state.area = Math.round(width * height);
        }
    });
    return <div ref={state.ref}>{/* the area will be updated up to 10 times */ state.area} px²</div>;
});
```

## Hooks

Hooks can be viewed as a viewless component, it can define `store`s, will trigger a render when updated, as well as define `afterMount`, `when` etc.
Hooks are used to create reusable component code such as connecting to a data source, logging, measuring etc. It is possible to create high order hooks (i.e. hooks that use other hooks) as seen in the following example:

```tsx
const mouseLocation = Hook(() => {
    const mouse = store({
        x: -1,
        y: -1
    });

    afterMount(() => {
        const handler = (e: Mou) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    });

    return mouse;
});

const mouseAngle = Hook(() => {
    const mouse = use(mouseLocation);
    const state = store({ angle: 0 });

    afterDomUpdate((_, domElement) => {
        const { left, right, top, bottom } = domElement.getClientRects()[0];
        const center = [(left + right) / 2, (top + bottom) / 2];
        state.angle = center[0] == 0 ? Math.PI / 2 : Math.atan(center[1] / center[0]);
    });
    return state;
});

export const GooglyEye = TSXAir(() => {
    const mouse = use(mouseAngle);
    return <img src="eye.png" style={{ rotate: mouse.angle + 'rad' }} />;
});
```
