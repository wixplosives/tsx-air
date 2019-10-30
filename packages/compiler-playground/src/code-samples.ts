export const sampleTypescriptFilePath = '/index.tsx';
export const sampleTypescriptFile = `
import { TSXAir, render } from '../../framework';

export const ChildComp = TSXAir((props: { name: string }) => <div>Greetings {props.name} from child</div>);

export const ParentComp = TSXAir((props: { name: string }) => (
    <div>
        Hello {props.name} from parent
        <ChildComp name={props.name} />
    </div>
));
`;


// `
// // this is not from an actual file....
// import React from 'react';
// import TSXAir from 'tsx-air';

// export const Internal = TSXAir((props: {title: string})=> {
//   return (
//     <div>
//       <span id="aa">{props.title}</span>
//       <span>{props.title}</span>
//       <div>{props.title}</div>
//     </div>
//   );
// });
// export const Checkbox = TSXAir((props: {title: string, gaga: string})=> {
//   const b = <div />;
//   const c = <><div /></>;

//   return (
//     <div>
//       <Internal title="aa"/>
//       <span>{props.title}</span>
//       <div>{props.title}</div>
//     </div>
//   );
// });

// `.trimLeft();
