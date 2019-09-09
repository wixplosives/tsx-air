# Context

Context is a shared store that can be accessed by any component down the tree of the component that set it.

## API

getContext - get the context set by the closest ancestor
setChildrenContext - set the context for descendant components -  and be used with store.derived to create a derived/partial context
 with store.derived to create a derived/partial context
