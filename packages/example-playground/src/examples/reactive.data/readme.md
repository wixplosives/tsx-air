# Reactive views

## User guide

- Props, state and stores are not reactive
- All other vars and code are reactive
- A reactive var may not be set outside the render cycle (at events, timeouts etc)
- State change in the return statement are forbidden
- Assignment to input.value creates a 2-way (reactive) bind

## The why - leading principals

- From a developer perspective, all the code that can be affected by a change to state/store/prop runs synchronously and sequentially, meaning when change tree branches, should execute as it would if not reactive
- Only affected code should run as a reaction to change
- It should be clear to the developer which parts of the code are reactive and which aren't
- It should be as easy to learn, understand and debug as possible

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

#### Issues with ambiguous derived values

Derived values can be ambiguous (for the developer). In order to make learning the system easy, the following cases they will fail at compilation with a clear message:

##### Volatile derivation

`let a = props.a + '1';`
what happens when `onClick=() => a = 'a'`?
Since this is ambiguous:

- Set a='a' and make a not be derived from props.a anymore
- Set a='a' and set it to props.a+'1' when props.a changes
- Set a='a', then render, and re-estate the derived value, making the `a='a'` meaningless with a render side-effect

Therefore derived values must be defined as const, or have a value definition that is equivalent to one.
In any case, changes outside the main render flow, such as event handlers, timeout etc.
should fail at compile time

##### Self reactive vars

```jsx
const count = initState(0);
return <div>{count++}</div>;
```

Can mean

1. create or reuse `count`
2. render
3. add 1 to `count`
4. the view does not represent the state, needs render
5. rinse, repeat ad infinitum

Since this is always leads to am infinite loops, it should not be allowed.


Another interpretation of the same code can be

1. create or reuse `count`
2. render
3. add 1 to `count`
4. don't render again

in which case the behavior is non-reactive (the state change will not be shown until another reactive value changes)

#### Non-self reactive vars

```jsx
const count = initState(0);
return <div>{++count} - {count}</div>;
```

Meaning

1. create or reuse `count`
2. add 1 to `count`
3. render

While not ambiguous, it does not allow for an async evaluation as it is part of the return statement. It is also very close to the perviously discussed case, making understanding the API more nuanced


To avoid all of these delicate edge cases, we opt to enforce a simple rule:
**No state changes allowed in the return statement**
