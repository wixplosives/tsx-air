# tsx-air
thoughts on a new system of rendering


while tsx now compiles into something very similiar to the source other outputs can be thought of.

consider a simple tsx stateless component:

```tsx
export const AComp = TSXAir((props: {name: string})=>(
  <div>
    hello
    {props.name}
  <div>
))
```

a different js output for it could be:

```js

export const AComp = TSXAir({
  toString: (props)=>`<div>
  hello
  ${props.name}
 </div>
`})
```


with an included component it will look like this:


```js


export const AComp = TSXAir({
  toString: (props)=>`<div>
    hello
    ${props.name}
    ${AnotherComp.toString({name: props.title})}
  </div>
  `})
```

this output is usefull for server-side rendering and initial component rendering. but it fails as a means of update.
for updating we need some additional code.



```js

export const AComp = TSXAir({
  toString: (props)=>`<div>
  hello
  <!-- aComp text1 -->
  ${props.name}
  <span style=${props.spanStyle}>hello</span>
 </div>
`,
  hidrate: (element)=>{
    return {
      text1: element.children[1]
      span1: element.children[2]
    }
  },
  update: [{
    props: ['name'],
    update :(props, context)=>{
      context.text1.setInnerText(props.name);
    }
  },{
    props: ['spanStyle'],
    update :(props, context)=>{
      context.span1.setAttribute('style', props.spanStyle);
    }
  }]
});

```

when working with more complex components we repeat the same strategy:


```tsx
export const AnotherComp = TSXAir((props: {name1: string, name2: string})=>(
  <div>
    <AComp name={name1}/>
    <AComp name={name2}/>
  <div>
))
```

```js

export const AnotherComp = TSXAir({
  toString: (props)=>`<div>
    ${AComp.toString({name: props.name1})}
    ${AComp.toString({name: props.name2})}
  </div>
    `),
  hidrate: (element)=>{
    return {
      AComp1: element.children[0]
      AComp2: element.children[1]
    }
  },
  update: [{
    props: ['name1'],
    update :(props, context)=>{
      updateUtil.performUpdate(context.AComp1, AComp, {name: props.name1})
    }
  },{
    props: ['name2'],
    update :(props, context)=>{
      updateUtil.performUpdate(context.AComp2, AComp, {name: props.name2})
    }
  }]
})
```


a component that handles children:


```tsx
export const AnotherComp = TSXAir((props: {children: TSXAir[]})=>(
  <div>
    {props.title ? <span>{props.title}</span> : null}
    {...children}
  <div>
));

export const UsingComp = TSXAir((props: {name: string, children: TSXAir[] })=>(
  <AnotherComp>
    {props.name ? <span>{props.name}</span> : null}
    {...children}
  <AnotherComp>
));
```


```js

export const AnotherComp = TSXAir({
  toString: (props)=>`<div>
    ${props.title ? AnotherComp.fragment1(props) : '<!-- fragment1 -->'}
    ${props.children}
  </div>
    `),
  hidrate: (element)=>{
    return {
      fragment1: element.children[0];
    }
  }
  getSlots: (element)=>{
    return {
      children: element.children.slice(1)
    }
  },
  update: [{
    props: ['title'],
    update :(props, context)=>{
      props.title ? removeIfExiting(context.span1) : ensureExists('fragment11', props)
    }
  }],
  fragments: {
    fragment1: {
      toString: (props)=>`<span>${props.title}</span>`,
      update: {
        props: ['title'],
        update :(props, element)=>{
          element.setInnerHtml(props.title)
        }
      }
    }
  }
});

export const UsingComp = TSXAir({
  toString: (props)=>AnotherComp.toString({`
    ${props.name ? 1<span>{props.name}</span> : '<!-- fragment1 -->'}
    ${props.children}`
  })),
  hidrate: (element)=>{
    return {
      fragment1: AnotherComp.getSlots(element).children[0]
    }
  },
  update: [{
    props: ['name'],
    update :(props, context)=>{
      props.title ? removeIfExiting(context.span1) : ensureExists('fragment11', props)
    }
  }],
  getSlots: (element)=>{
    return {
      children: AnotherComp.getSlots(element).slice(1)
    }
  },
  fragments: {
    fragment1: {
      toString: (props)=>`<span>${props.name}</span>`,
      update: {
        props: ['name'],
        update :(props, element)=>{
          element.setInnerHtml(props.name)
        }
      }
    }
  }
})
```

# using computations in the template
```tsx
export const AnotherComp = TSXAir((props: {fName: string, lName: string})=>{
  const fullName = props.fName + ' ' +props.lName
  return <div>
    {fullName}
  <div>
});

```

```js


export const AnotherComp = TSXAir({
  toString: (props)=>{
    const fullName = props.fName + ' ' +props.lName
    return `<div>
      ${fullName}
    <div>`
  },
  hidrate: (element)=>{

  },
  update: [{
    props: ['fName', 'lName'],
    update :(props, context)=>{
      const fullName = props.fName + ' ' +props.lName
      context.root.setInnerHtml(fullName)
    }
  }]
})
```

# state
```tsx
export const AnotherComp = TSXAir((props: {fName: string, lName: string})=>{
  const [counter, updateCounter] = useState('counter', 0);
  return <div onClick={()=>updateCounter(counter++)}>
    {counter}
  <div>
});

```

```js


export const AnotherComp = TSXAir({
  toString: (props)=>{
    const state = AnotherComp.initalState(props);
    return `<div>
      ${state.counter}
    <div>`
  },
  initalState: (props)=>{
    return {
      counter: 0
    }
  }
  hidrate: (element, props, state)=>{
    element.addEventListener('click', ()=>{
         updateUtil.updateState(element, AnotherComp, {counter: state.counter++})
    })
    return {
      state: AnotherComp.initalState(props);
    }
  },
  update: [{
    state: ['counter'],
    update :(props, context)=>{
      
      context.root.setInnerHtml(context.state.counter)
    }
  }]
})
```

repeaters can be handled similiarly:
## an example with a simple repeater

```tsx
export const AnotherComp = (props: {names: string[]})=>(
  <div>
    {names.map((name)=>(
      AComp({name})
     )}
  <div>
)
```

```js

export const AnotherComp = (props)=>`<div>
  ${names.map((name)=>(
      AComp({name})
     )}
 </div>
`
AComp.update = {
  names: (root, value)=>{
    value.map((name, index)=>(
       AComp.update.name(root.childNodes[index], value)
    )
  }
}
```

we can also choose to support partial property update:
```js
AComp.update_partial = {
  names: (root, patch)=>{
    switch(patch.kind){
      case 'update'
        AComp.update.name(patch.index, patch.value)
        break;
       case 'add'
        root.appendChildAt(patch.index, createElement(AComp({name}))>
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
export interface Product{
  name: string
  category: string
}
export const AnotherComp = (props: {products: Product[], selectedCategory: string})=>{
  const filteredProducts = props.products.filter((product)==>product.category===props.selectedCategory)
  return <div>
    <div>Category: {props.selectedCategory}</div>
    {filteredProducts.map((name)=>(
      AComp({name})
     )}
  <div>
}
```
