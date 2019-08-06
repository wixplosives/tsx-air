# Client frameworks: The next generation 
## What do we want?
- A minimal, simple, light component based framework
- Compile time optimization with *minimal runtime*
- Declarative component syntax, ideally TSX/JSX
- TypeScript support

## Who should care and why?
Large front-end heavy apps have lines of code in the millions, hundreds of contributors in distributed teams.
If that doesn't ring a bell, you should totally check out [Svelte](https://svelte.dev/). However, large teams present new challenges:
- *Communicating APIs and standards* is a constant challenge which TypeScript helps a lot with.
- Performance is harder to maintain with many contributors. A light framework and isolated components made this challenge more manageable.
- Re-training gets easier with familiar concepts and syntax (All our developers are flaunt in React/JSX)

## Some other requirements
- Great tooling, autocomplete for code and templates, including props and events
- As close to vanilla as possible
- As close to W3C standard as possible
- No virtual DOM
- A smooth transition from React
- SSR
- Code splitting
- Highly optimized, based on data volatility (ie, if the attributes are fixed, pure functional component can be replaced by a string/template)

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

### So why not just use Svelte?
Svelte is awesome [(as this analysis shows)](./svelte.md) however it is not tuned to our needs.  
- Syntax - JSX/TSX syntax is preferable, as our developers are familiar with react 
- Style reuse (i.e. skinable/stylable component)

## What next?
- Standard app as a base for comparing frameworks
- Performance test

