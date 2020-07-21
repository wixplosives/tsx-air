# Welcome to TsxAir

[![Build Status](https://travis-ci.com/wixplosives/tsx-air.svg?branch=master)](https://travis-ci.com/wixplosives/tsx-air)

## TsxAir is a highly optimized frontend framework and compiler
- Code is written in functional Jsx/Tsx, similar to React FunctionalComponent.
- Most of the heavy lifting is done in build time, making the VDom/Reconciliation minimal or redundant.
- Minimal (~ 1-10k) runtime framework code
- Highly reactive: synchronous data updates, an optional 1 frame delay in DOM update @60 FPS
- Minimal changes to developer code
- SSR, TypeScript and standalone components from day 0
- Supports multiple concurrent runtime versions

## [Syntax Code Sample](docs/syntax.md)
```tsx
import { TSXAir, store } from '@tsx-air/framework';
export const ClickBait = TSXAir((p:{initial:number}) => {
    // will not change when p.initial changes
    const state = store({ counter: p.count });
    const onClickA = () => state.counter++;
    return <div onClick={onClick}>
        click count: {state.count}        
        initial: {/* will change with p.initial */props.initial}    
    </div>;
});
```

## Wh Questions

- [Why? (Background)](docs/background.md)
- [What? (Goals)](docs/goals.md)
- [Who? (Advisory board)](docs/advisory.board/advisory.board.md)
- [Ha? (Original Proposal)](docs/original.proposal.md)
- [How (Syntax)](docs/syntax.md)

## Getting started
### Prerequisite
- Git
- Yarn
- NodeJs
`git clone https://github.com/wixplosives/tsx-air.git`
(for ssh lovers: `git@github.com:wixplosives/tsx-air.git`)

### Running Local Playground 
`yarn start`

The playground is where you can edit interactive examples [showcasing the syntax and features](docs/syntax.md). 
You can change compilers to compare the generated code with native implementation.

### Testing
`yarn test` or `DEBUG=true yarn test`

The examples available at the playground are used to test the compiler (i.e that the compiled code behaves and performs as the native code)

The list of tested examples can be [here](packages/examples/src/examples/index.ts)

### CLI (under construction)
in package `browserify` use `yarn compile`

## Project Structure
- The project is organized in [packages as a monorepo](https://github.com/wixplosives/sample-monorepo)
- Code execution is using NodeJs (14.5+) with [ts-tools](https://github.com/AviVahl/ts-tools)
