# Reactive views

## Leading principals

- From a developer perspective, all the code that can be affected by a change to state/store/prop runs synchronously and sequentially, meaning when change tree branches, should execute as it would if not reactive
- Only affected code should run as a reaction to change
- It should be clear to the developer which parts of the code are reactive and which aren't

### types of variables

#### Persistent vars

- props defined by the parent component or via component API
- state defined and initiated by the component
- stores can be shared between components

These are all persistent: they keep the value from previous render cycles and only changed explicitly by the developer. Changing them will trigger a render.

They are not reactive by default
(consider making them reactive in case of stores, but it should be explicitly so)

#### Derived values

- `const a = props.a`
- `const b = props.a + store.a + state.a`

#### Issues with derived values

##### Volatile derivation

`let a = props.a + '1';`
what happens when `onClick=() => a = 'a'`?
Since this is ambiguous:

- Set a='a' and make a not be derived from props.a anymore
- Set a='a' and set it to props.a+'1' when props.a changes

Therefore derived values must be defined as const, or have a value definition that is equivalent to one.
In any case, changes outside the main render flow, such as event handlers, timeout etc.
should fail at compile time

##### Self reactive vars

```jsx
const count = initState(0);
return <div>{--count}</div>;
```

Meaning

1. create or reuse `count`
2. add 1 to `count`
3. render

The state and view are in sync, nothing to do.
This is different from:

```jsx
const count = initState(0);
return <div>{count++}</div>;
```

which will

1. create or reuse `count`
2. render
3. add 1 to `count`
4. the view does not represent the state, needs render
5. rinse, repeat ad infinitum

Since this is always leads to am infinite loops, it should not be allowed.
In other words,  state changes at the return statement should fail at compile time
