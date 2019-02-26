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

this output is usefull for serverside rendering and initial component rendering. but it fails as a means of update.
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


```tsx
export const AnotherComp = (props: {names: string[]})=>(
  <div>
    {names.map((name)=>(
      <AComp name={name}/>)
     )}
  <div>
)
```

```js

export const AnotherComp = (props)=>`<div>
  ${names.map((name)=>(
      <AComp name={name}/>)
     )}
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

