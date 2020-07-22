# TsxAir advisory board

## Forum Goals
- Get feedback on the concept, motivations and features of TsxAir
- Engage with relevant decision-makers
- Discover further people that may be relevant to the success of the project in and out of Wix
[Discussion points](discussion.point.md)

## Participants

### Advisors
- Shahar Talmi
- Avi Marcus
- Eliran Hezkia
- Ofir Dagan

### Contributors
- Nadav Avrahami
- Tal Gadot
- Omry Nachman

## Meetings Summaries

### Kickoff (25/6/2020)
The project was presented to the advisory board and others, who raised the following points:
- Testing compilation of existing Wix components 
- Using React tests
- Switching to Babel (instead of TS) for compilation

### The state of state (23/7/2020)
#### Discussion point: state changes in user code
Consider the following code, in which the variables are volatile:
```tsx
const Volatile = TSXAir(() => {
    const divs = [0, 1].map(i => <div>{i}</div>);
    return <div>{divs[0]}{divs[1]}</div>;
});
```
As opposed to the following, in which a **store** is used
```tsx
const StateDilemma = TSXAir(() => {
    const state = store({ counter: 0 });
    const div0 = <div>{state.counter++}</div>;
    const div1 = <div>{state.counter++}</div>;
    return <div onClick={()=>state.counter++}>{div0}{div1}</div>;
});
```
Should this be allowed? what should the output be? what should the output be after a click?
