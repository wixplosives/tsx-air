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
    const onClickA = () => state.counter++;
    return <div onClick={onClick}>{state.count}</div>;
});
```

### Caveats

-   Changing a store in a return statement will fail

```tsx
const InvalidStateChange = TSXAir(() => {
    const state = store({ counter: 0 });
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

- Destructuring a store will make prevent re-rendering upon change

```tsx
const  = TSXAir(() => {
    const { counter } = store({ counter:0 });
    const onClickA = () => counter++;
    // will show 0 and never be updated
    return <div onClick={onClick}>{count}</div>;
});
```

## Triggering Rendering

There are 4 ways to trigger a render:
- Changes to component properties
- Changes to a store defined in the component
- Changes to a [when](# Using "memo":) /memo dependency
- Calling `invalidate`

## Using "when"
`when` is a TSXAir api that re-renders the component and runs a function when some dependencies change.
```tsx
export const ImagePreloader = TSXAir((props: { url: string }) => {
    const state = store({ imageLoaded: false, history:[props.url]});
    // when props.url changes, set state.imageLoaded to false
    when(props.url, () => { state.imageLoaded = false; });

    // when props.url changes, update history (the depenecies are implied)
    when(() => { state.history = [props.url, ...state.history] });
    
    return <div className="thumb" >
        <div className="history">{history.join(', ')}</div>
        {state.imageLoaded ? '' : <div className="preloader" />}
        <img src={props.url} onLoad={() => state.imageLoaded = true} 
            style={{ display: state.imageLoaded ? 'block' : 'none' }} />
    </div>;
});
```
## Using "memo":
```tsx
const Memo = TSXAir((props: { digits: number, title:string}) => {
    // will be evalutated only when props.digits change
    let pi = when(() => calcPi(props.digits));
    // will be updated when either props.digits OR props.title change
    return <div>{title}{pi}</div>;
});
```
