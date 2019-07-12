# Proposal: TSX-Air

### Example
while tsx now compiles into something very similar to the source other outputs can be thought of.

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

more examples can be found in packages/example-playground/src