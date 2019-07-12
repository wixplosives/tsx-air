# Analysis: [Svelte.js](https://github.com/sveltejs/svelte)
 ![Svelte logo](https://svelte.dev/svelte-logo-horizontal.svg "Svelte.js")
<p>
  <a href="https://www.npmjs.com/package/svelte">
    <img src="https://img.shields.io/npm/dw/svelte.svg" alt="npm version">
  </a>

  <a href="https://www.npmjs.com/package/svelte">
    <img src="https://img.shields.io/npm/v/svelte.svg" alt="npm version">
  </a>

  <a href="https://packagephobia.now.sh/result?p=svelte">
    <img src="https://packagephobia.now.sh/badge?p=svelte" alt="install size">
  </a>

  <a href="https://travis-ci.org/sveltejs/svelte">
    <img src="https://api.travis-ci.org/sveltejs/svelte.svg?branch=master"
         alt="build status">
  </a>

  <a href="https://github.com/sveltejs/svelte/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/svelte.svg" alt="license">
  </a>
</p>

## Overview
Svelte is a component base framework that optimizes components at buildtime.
Each component is represented as a single file that contains the code, HTML & style.
It provides a lightweight modular runtime for component lifecycle management as well as reactive binding, stores etc.

### Advantages 👍
- Compact, declarative input (typically smaller than React, in some cases significantly)
- Small output with minimal (framework) runtime code
- Active, growing  community ( ![Contributors badge](https://img.shields.io/github/contributors/sveltejs/svelte.svg "Contributors") )

### Disadvantages 👎
- No typescript support (although the framework itself it written in TS 🤔)
- Proprietary templating syntax (with rich yet limited capabilities)
- Far from being a standard - at the time of writing, 20k starred on github (Angular: 49k, React: 132K, Vue: 143K)
- Less mature

## In depth review
### TypeScript Support
There is a non-trivial gap with TS support. There have been [discussions](https://github.com/sveltejs/svelte/issues/418) and [open issues](https://github.com/sveltejs/svelte/issues/1639) but no real progress. <br />
[This repo is a notable effort](https://github.com/pyoner/svelte-typescript) to include TS support in the script tag, but is not perfect and does not make an attempt to include the HTML template yet.
#### The TS gap
- The Svelte compiler offers a preprocessing hook that seems to be a good place to transpile TS => JS, however this approach is lacking some regards, especially in the HTML template.
- LSP is a challenge (which at the moment no one seems to be taking on, as no real TS support exists)

### Features Comparison (vs React)
+ Svelte is a more structured and less flexible than react (which has advantages and disadvantages) which encourages developers to create simpler components.
+ Svelte offers built in features that react lacks:
    - View binding (making much of the state management code redundant)
    - Reactive and derived values (making the code more compact at the expanse of more framework-dependent code)
    - Built in stores
+ Manipulation of children, reparenting etc is possible but less straightforward than React
+ SSR is well supported as a compile output, a [NextJs](https://nextjs.org/)-like project called [Sapper](https://github.com/sveltejs/sapper) is being developed but is not production ready.


### Syntax
Simple, full featured template engine with loops, conditionals etc.
Less flexible than TSX
Takes some getting used to and has a learning curve: things that are vanilla like in JSX (conditional rendering, iterating) require a proprietary syntax.
While techniques and approaches differ, *Svelte seems to cover all necessary usecases* **Needs further verification**
