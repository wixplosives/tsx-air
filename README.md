# tsx-air
thoughts on a new system of rendering

while tsx now compiles into something very similiar to the source other outputs can be thought of.

Consider the following simple tsx stateless component:
##### Original:
```tsx
export const ChildComp = TSXAir((props: { name: string }) => <div>hello {props.name} <div>)
export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
      hello {props.name}
      <ChildComp name={props.name}/>
    <div>
  )
)
```
##### Transpiled
```js
export const ParentComp = TSXAir({
  toString: (props) => `<div>
    hello ${props.name}
    ${ChildComp.toString({name: props.name})}
  </div>`
})
```
This transpilation is useful for server-side and static rendering but for interactivity we need a little more

```js
export const ParentComp = TSXAir({
  toString: (props)=>`<div>
    hello <!-- start text1 -->${props.name}
    ${ChildComp.toString({name: props.name})}
  </div>`,
  hydrate: (element, instance) => ({
    text1: element.children[1],
    ChildComp1: hydrate(ChildComp, element.children[2], {name: instance.props.name})
  }),
  update: (props, instance)=>{
    if(props.name !== instance.props.name){
      instance.context.text1.setInnerText(props.name);
      instance.context.ChildComp1.update({'name': props.name});
    }
  },
  unmount: (instance)=>{
    instance.context.ChildComp.unmount()
  }
})

```

A component that handles children:
```tsx
export const BigBrotherComp = TSXAir((props: {children: TSXAirNode[]}) => (
  <div>
  {children}
  <div>
))
```
```tsx
export const ParentComp = TSXAir((props: {name: string}) => (
  <BigBrotherComp />
    <span>{props.name}</span>
  <BigBrotherComp />
))

```


```js
const span1Key = 1564456;
export const ParentComp = TSXAir({
  toString: (props) => `${BigBrotherComp.toString( `<span>${props.name}</span>`),
  hydrate:(element)=>{
    return {
      BigBrotherComp1: hydrate(BigBrotherComp, element, {children: [{
        key: span1Key,
      }])
    }
  },
  update: (props, instance)=>{
    if(props.name===!instance.props.name){
      instance.elements.BigBrotherComp1.getByKey(instance.element, span1Key).setInnerHtml(props.name)
    }
  }
});

```
```js
export const BigBrotherComp = TSXAir({
  toString: (props) => `<div>${serializeChildren(props.children)}</div>`),
  hydrate:(element, instance)=>{
    return {
      children: hydrateChildren(element.children, props.children)
    }
  },
  update:(element)=>{

  }
});
```

A component that manipulates children:
```tsx
export const ChildManipulator = TSXAir((props: {children: TSXAirNode[]}) => (
  <div>
  {children.map(item=>tsxAir.clone(item, {style: {background: 'blue'}}))}
  <div>
))
```


```js
export const ChildManipulator = TSXAir({
  toString: (props, computations) => (
  `<div>
  ${serializeChildren(computations.children)}
  <div>`
  ))
  hydrate:(element, instance)=>{
    return {
      children: hydrateChildren(element.children, computations.mapChildren)
    }
  },
  update: (props, instance)=>{
    if(props.name===!instance.props.name){
      instance.elements.BigBrotherComp1.getByKey(instance.element, span1Key).setInnerHtml(props.name)
    }
  },
  computations:(props, instance)=>{
    return {
      mapChildren: props.children === instance.props.children ? instance.computations.mapChildren: props.children.map(item=>tsxAir.clone(item, {style: {background: 'blue'}})
    }
  }

});

```
```js
export const BigBrotherComp = TSXAir({
  toString: (props) => `<div>${serializeChildren(props.children)}</div>`),
  hydrate:(element)=>{
    return {
      div1: element
      children: element.children
    }
  }
});

```
# Using computations in the template
```tsx
export const AnotherComp = TSXAir((props: {fName: string, lName: string}) => {
  const fullName = props.fName + ' ' + props.lName
  return <div>{fullName}<div>
});

```

```js

export const AnotherComp = TSXAir({
  toString: (props) => {
    const fullName = props.fName + ' ' +props.lName
    return `<div>${fullName}<div>`
  },
  hidrate: (element) => { },
  update: [{
    props: ['fName', 'lName'],
    update :(props, context) => {
      const fullName = props.fName + ' ' +props.lName
      context.root.setInnerHtml(fullName)
    }
  }]
})
```

# state
```tsx
export const AnotherComp = TSXAir((props: {fName: string, lName: string}) => {
  const [counter, updateCounter] = useState('counter', 0);
  return (
    <div onClick={()=>updateCounter(counter++)}>{counter}<div>
  )
});

```

```js
export const AnotherComp = TSXAir({
  toString: (props) => {
    const state = AnotherComp.initalState(props);
    return `<div>${state.counter}<div>`
  },
  initalState: (props) => ({
    counter: 0
  }),
  hidrate: (element, props, state) => {
    element.addEventListener('click', () =>
      updateUtil.updateState(element, AnotherComp, {counter: state.counter++})
    )
    return { state: AnotherComp.initalState(props) }
  },
  update: [{
    state: ['counter'],
    update :(props, context) => context.root.setInnerHtml(context.state.counter)
  }]
})
```

repeaters can be handled similiarly:
## an example with a simple repeater

```tsx
export const AnotherComp = (props: {names: string[]}) => (
  <div>
    {names.map((name)=> AComp({name}))}
  </div>
)
```

```js

export const AnotherComp = (props)=>`<div>
  ${names.map((name)=>(
    AComp({name})
   )}
</div>`

AComp.update = {
  names: (root, value) => {
    value.map((name, index) => (
       AComp.update.name(root.childNodes[index], value)
    )
  }
}
```

we can also choose to support partial property update:
```js
AComp.update_partial = {
  names: (root, patch) => {
    switch(patch.kind) {
      case 'update'
        AComp.update.name(patch.index, patch.value)
      break;
      case 'add'
        root.appendChildAt(patch.index, createElement(AComp({name})))
      break;
      case 'update'
        root.removeChildAt(patch.index)
      break;
    }
  }
}
```
## a computation in the render function


```tsx
export interface Product {
  name: string
  category: string
}

export const AnotherComp = (props: {products: Product[], selectedCategory: string}) => {
  const filteredProducts = props.products.filter((product)==>product.category===props.selectedCategory)
  return (
    <div>
      <div>Category: {props.selectedCategory}</div>
      {filteredProducts.map((name => AComp({name}))}
    </div>
  )
}
```
