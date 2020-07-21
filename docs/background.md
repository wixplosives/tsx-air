# Client frameworks: The next generation 

## Background
In recent years, a new generation of frontend frameworks have been emerging. They are relying on build time code manipulation to reduce runtime code, without dropping elegance of declarative code. Svelte, marko js and others have been gaining limited traction and show superior performance over React, Vue and Angular. 
Interest in the developers community, slow adoption and superior performance present a unique opportunity to be a dominant player in the next gen front end framework space.

## Who should care and why?
Large front-end heavy apps have lines of code in the millions, hundreds of contributors in distributed teams.
If that doesn't ring a bell, you should totally check out [Svelte](https://svelte.dev/). However, large teams present new challenges:
- *Communicating APIs and standards* is a constant challenge which TypeScript helps a lot with.
- Performance is harder to maintain with many contributors. A light framework and isolated components made this challenge more manageable.
- Re-training gets easier with familiar concepts and syntax (All our developers are flaunt in React/JSX)

## Notable build time optimized frameworks:
- [SvelteJS](https://svelte.dev/)
    An awesome framework that cover most of our needs, however:
    + Does not support TS
    + A super set of HTML (as apposed to JSX, a super set of JS)
    + Opinionated about style encapsulation (making [stylable](https://github.com/wix/stylable) like ideas go against the grain)

- [StencilJS (created by ionic)](https://stenciljs.com/) 
    WebComponents based, minimal, typed, support JSX/TSX, however:
    + Development seems slow, issues and PRs take a long time to be processed
    + Makes use of VDOM, (within every component)

- [MarkoJS (created by eBay)](https://markojs.com/) very similar to Svelte, with nicer docs and less adoption

## TsxAir Advantages

### React
- Control over framework and tooling
- Meaningful improvements in performance (total size, FPS, memory etc)
- Seamless support of multiple concurrent versions 
- Standalone components

### [Svelte](./svelte.md)
- TypeScript support (and possibly improved compilation of)
- Similar Syntax and concepts to React (TSX/JSX, functional components)
- Easy migration path
- No proprietary format, syntax or paradigm
- Highly compatible with existing tooling
- Style reuse (i.e. skinable/stylable component)

## What next?
- Standard app as a base for comparing frameworks
- Performance test
