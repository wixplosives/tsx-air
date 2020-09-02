# Stateless parent/child components

A stateless parent (red) containing a stateless child (green) component

## Showcases

- Using imperative component API to update props *TBD*
- Update propagation from parent to child

## Notes

- The components are defined] declaratively using TSX
- At runtime, the parent updates the child's props using the framework runtime.update (changes are aggregated and applied next frame)
- Props update is **async**, collected by the framework, aggregated and applied next frame
