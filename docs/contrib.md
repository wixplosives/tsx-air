# Contributing
![Supereasy](./supereasy.jpeg)

## Structure
- [builder](../packages/builder): CLI and yarn compile/build tasks
- [compilers](../packages/compilers): compiler implementation fot TsxAir, in the future may be swapped by other implementations 
- [compiler utils](../packages/compiler-utils): compilation utils, types and analyser for TsxAir code structure. Widely used in compiler (and future compilers)
- [examples](../packages/examples): Examples used for the playground and testing
- [framework](../packages/framework): framework mock types and adapters for pre-compilation code completion support
- [runtime](../packages/runtime): compiled code runtime (replaces [framework](../packages/framework)) in compiled code
- [playground](../packages/playground): live editing playground (with [examples](../packages/examples) as base code)
- [testing](../packages/testing): testing utilities and tools
- [types](../packages/types): monorepo cross package common types
- [utils](../packages/utils): general service utils and helpers

## Getting started
The heart of the code is in a [compiler](../packages/types/src/compiler.ts) which is leveraged by the [builder](../packages/builder). 
A good entry point to follow the compilation flow is the [compile/compileAndEval](../packages/builder/src/compile.ts) functions.
A compiler defines the TS transformers that include the actual code, a list of supported features and a label.
The included compiler uses the [transformerApiProvider](../packages/compiler-utils/src/ast-utils/generators/transformer-api-provider.ts) which provides a single pass code analysis, post compilation/linking API etc, it wraps the actual compilation code. 
transformerApiProvider is the place to see the pre-compilation [analyzers in action](../packages/compiler-utils/src/analyzers)

## The main event
