# tsx-air [<-- insert better name here]
Thoughts on a new system of rendering

## Motivation
Existing view rendering frameworks such as React, Vue, Angular etc relay on virtual DOM and other runtime solution that run large amounts of code. <br/>
Much of that can be replaced by buildtime optimization, coupled with a lean, granular runtime environment.
The ideal replacement will have:
- Tiny runtime
- Output that closely resembles the input code
- TypeScript support
- Familiar **declarative** syntax (Ideally TSX)
- SSR optimization
- Node specific optimization at build time (Example: component with fixed props can be streamlined to its output value, the logic is not required as the input can't change)

## Design principals
### Support existing toolset and Typescript in particular
apart from adding a tsConfig compilation transformer the user can use his normal build with no additional build steps

### Create Imperative and readable code
impertive code is much faster, but readability matters
[We should discuss this]

### optimize per entry point in the build
data that is not changed in the client.
components that are not recreated

all can result in massive amounts of the code that are unneeded

## Way Forward
Currently we're looking into the following alternatives:
- Create a new framework [See TSX-Air proposal](docs/tsx-air.md):
  + Describe usecases (input and transpiled output)
  + Create a minimal runtime for the suggested output
  + Write a transpiler
  + Open source transpiler and engage with dev community
- Modify an existing framework to meet the needs described in this document:
  + Look into candidates
  + Analyse gaps ([See analysis of Svelte](docs/svelte.md))
  + Propose solutions
  + Write an MVP / Partial solution, Ideally as an open source, community engaged effort
  + Develope a full solution, tooling etc. and push it as the next version of selected framework
  + Commitment to the selected framework:
    * Taking a leadership role in the community
    * Promoting the popularity and community adoption
    * Provide long term support and contribution to the codebase