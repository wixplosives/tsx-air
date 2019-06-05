const React = {} as any  
export const AComp = (props: {name: string})=>(
  <div>
    hello
    {props.name}
  </div>
)

// a different js output for it could be:

export const AComp1 = props => `<div>
  hello
  ${props.name}
 </div>
`;

// this output is usefull for server-side rendering and initial component rendering. but it fails as a means of update.
// for updating we need some additional code.


export const AComp2 = (props)=>`<div>
  hello
  <!-- aComp text1 -->
  ${props.name}
 </div>
`
AComp.mutations = [
  {
    props: ['name'],
    mutator: (root, {name})=>{
      root.childNodes[1].innerText = name.newValue
    }
  }
]

// when working with more complex components we repeat the same strategy:

export const AnotherComp = (props: {name1: string, name2: string})=>(
  <div>
    <AComp name={props.name1}/>
    <AComp name={props.name2}/>
  </div>
)

export const AnotherComp1 = props => `<div>
  ${AComp(props.name1)}
  ${AComp(props.name2)}
 </div>
`;
AnotherComp.mutations = [
  {
    props: ['name1'],
    mutator: (root, {name1})=>{
      applyMutations(AComp, root.childNodes[0], {name: name1})
    }
  },
  {
    props: ['name2'],
    mutator: (root, {name2})=>{
      applyMutations(AComp, root.childNodes[1], {name: name2})
    }
  }
];

// repeaters can be handled similiarly:

// ## an example with a simple repeater

export const CompWithRepeater = (props: {names: string[]})=>(
  <div>
    {props.names.map((name)=>AComp({name}))}
  </div>
)

export const CompWithRepeater1 = (props)=>`<div>
  ${props.names.map((name)=>(
      AComp({name})
     ))}
 </div>`


// with partial update in a jsonpatch format:

CompWithRepeater1.mutations = [
{
  props: ['names'],
  mutator: (root, {names})=>{
    switch(names.kind){
      case 'update':
        applyMutations(AComp, names.index, {name: names.patch})
        break;
       case 'add':
        root.appendChildAt(names.index, createElement(AComp({name: names.patch.value})))
        break;
       case 'remove':
        root.removeChildAt(names.index)
        break;
    }
  }
}]

// ## a computation in the render function

export interface Product{
  name: string
  category: string
}
export const AnotherComp = (props: {products: Product[], selectedCategory: string})=>{
  const filteredProducts = props.products.filter((product)=>product.category===props.selectedCategory)
  return <div>
    <div>Category: {props.selectedCategory}</div>
    {filteredProducts.map((product)=>(
      AComp({name: product.name})
     ))}
  </div>
}

export const AnotherComp = (props: {products: Product[], selectedCategory: string})=>{
  const filteredProducts = props.products.filter((product)=>product.category===props.selectedCategory)
  return `<div>
    <div>Category: ${props.selectedCategory}</div>
    ${filteredProducts.map((product)=>(
      AComp({name: product.name})
     ))}
  </div>`
}

AnotherComp.mutations = [
{
  props: ['products', 'selectedCategory'],
  mutator: (root, {products, selectedCategory})=>{
    let arrayPatch
    if(selectedCategory.isChanged){
      const arrayPatch = props.products.filterChanged(product ==>product.category===props.selectedCategory.newValue.
      ,product ==>product.category===props.selectedCategory.oldValue)
    }
    const arrayPatch = props.products.filterItem((product ==>product.category===props.selectedCategory.newValue)
    for(const patch of arrayPatch){
      switch(patch.kind){
        case 'update'
          AComp.update.name(patch.index, patch.value)
          break;
        case 'add'
          root.appendChildAt(patch.index, createElement(AComp({patch.newValue}))>
          break;
        case 'remove'
          root.removeChildAt(patch.index)
          break;
      }
    }
  }
}]
AnotherComp.update = {
  products: (root, patch)=>{
    switch(patch.kind){
      case 'update'
        AComp.update.name(patch.index, patch.value)
        break;
       case 'add'
        root.appendChildAt(patch.index, createElement(AComp({name}))>
        break;
       case 'remove'
        root.removeChildAt(patch.index)
        break;
    }
  }
}