# tsx-air
thoughts on a new system of rendering


while tsx now compiles into something very similiar to the source other outputs can be thought of.

consider a simple tsx stateless component:

```tsx
export const aComp = (props: {name: string})=>(
  <div>
    hello
    {props.name}
  <div>
)
```

a different js output for it could be:

```js

export const AComp = (props)=>`<div>
  hello
  ${props.name}
 </div>
`
```

this output is usefull for server-side rendering and initial component rendering. but it fails as a means of update.
for updating we need some additional code.



```js

export const AComp = (props)=>`<div>
  hello
  <!-- aComp text1 -->
  ${props.name}
 </div>
`
AComp.update = {
  name: (root, value)=>{
    root.childNodes[1].innerText = value
  }
}
```

when working with more complex components we repeat the same strategy:


```tsx
export const AnotherComp = (props: {name1: string, name2: string})=>(
  <div>
    <AComp name={name1}/>
    <AComp name={name2}/>
  <div>
)
```

```js

export const AnotherComp = (props)=>`<div>
  ${AComp(props.name1)}
  ${AComp(props.name2)}
 </div>
`
AComp.update = {
  name1: (root, value)=>{
    AComp.update.name(root.childNodes[0], value)
  },
  
  name2: (root, value)=>{
    AComp.update.name(root.childNodes[0], value)
  }
}
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
