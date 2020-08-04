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

There are 3 ways to trigger a render:
- Changes to component properties
- Changes to a store defined in the component
- Calling `invalidate`

## "when" and "memo"
`when` and `memo` allow running parts of the component logic only when a specific dependency has changed.
### Diffrences between when and memo:
- a `when` action may return an "undo" function that will be called before the action is called again ( due to dependency change ) and when the component is about to be unmounted
```tsx
when(() => { 
    const update = ()=>{ /* do something...*/};
    props.dataSource.subscribe(update);    
    // will be executed when props.dataSource changes (before this action is executed again)
    return ()=>props.dataSource.unsubscribe(update);
});
```
- `memo` returns the returned value
```tsx
let pi = memo(() => calcPi(props.digits));
```
- a `when` action may update a store
```tsx
    // when props.url changes, set state.imageLoaded to false
    when(props.url, () => { state.imageLoaded = false; });
```

### Using "when"
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
### Using "memo":
```tsx
const Memo = TSXAir((props: { digits: number, title:string}) => {
    // will be evalutated only when props.digits change
    let pi = memo(() => calcPi(props.digits));
    // will be updated when either props.digits OR props.title change
    return <div>{title}{pi}</div>;
});
```

## Component Lifecycle
### afterMount
```tsx
const GoogleMaps = TSXAir(()=>{
    afterMount(ref => new google.maps.Map(ref, { center: { lat: -34.397, lng: 150.644 }, zoom: 8}));
    return <div />;
});
```

### afterUpdate
```tsx
const InfiniteMeasure = TSXAir(() => {
    const state = store({area:0, ref:{} as RefHolder<HTMLDivElement>});   
    afterDomUpdate([], ()=>{
        const {width, height} = state.ref.element!.getClientRects()[0];
        state.area = width * height;
    });
    return <div ref={state.ref}>{state.area}</div>;
});
```

### beforeUnmount

```tsx
// @omry, this is an example of why you want to return a dispose function from afterMount
// will save the extra render in this implementation  ( caused by saving the interval )
const Clock = TSXAir(() => {
    const state = store({time:'', intervalId:-1});   
    afterMount(()=>{
        state.intervalId = window.setInterval(()=>state.time = new Date().toTimeString(), 1000);        
    });
    beforeUnmount(()=>{
        clearInterval(state.intervalId);
    });  
    return <div>{state.time}</div>;
});
```
