# Contributing
![Supereasy](./supereasy.jpeg)

## The basics
TsxAir is an abstract compiler and framework (and an implementation of them)

This project contains:
- API definition and tests
- Powerful tooling for creating compiler+runtime pairs
- An implementation of such a pair: [astBasedCompiler](src/ast-based-compiler/index.ts) and [runtime](../packages/runtime)
## Structure
### Abstract and generic modules
Used to run and test a TsxAir compatible compilers
- [framework](../packages/framework): framework mock types and adapters for pre-compilation code completion support
- [builder](../packages/builder): CLI and yarn compile/build tasks
- [compiler utils](../packages/compiler-utils): compilation utils, types and analyser for TsxAir code structure. Widely used in compiler (and future compilers)
- [examples](../packages/examples): Examples used for the playground and testing
- [playground](../packages/playground): live editing playground (with [examples](../packages/examples) as base code)
- [testing](../packages/testing): testing utilities and tools
- [types](../packages/types): monorepo cross package common types
- [utils](../packages/utils): general service utils and helpers

### TsxAir implementation
- [compilers](../packages/compilers): compiler implementation fot TsxAir, in the future may be swapped by other implementations 
- [runtime](../packages/runtime): compiled code runtime (replaces [framework](../packages/framework)) in compiled code

## How compilation work
1. The [builder's](../packages/builder)  [compile/compileAndEval](../packages/builder/src/compile.ts) functions run a ts transpilation using a [compiler](../packages/types/src/compiler.ts)
2. The [compiler](../packages/types/src/compiler.ts) defines ts transformers
3. The [included astBasedCompiler compiler ](../packages/compilers/src/ast-based-compiler/index.ts) wraps the transformers code with  [transformerApiProvider](../packages/compiler-utils/src/ast-utils/generators/transformer-api-provider.ts) which provides a single pass code [analysis](../packages/compiler-utils/src/analyzers/analyze.ts), post compilation/linking API etc, it wraps the actual compilation code. 
4. The transformers define a node visitor
5. The visitor uses [transformerApiProvider](../packages/compiler-utils/src/ast-utils/generators/transformer-api-provider.ts) to find nodes of interest (components, hooks) and returns a modified node
