export const sampleTypescriptFilePath = '/index.tsx';
export const sampleTypescriptFile = `
// this is not from an actual file....
import React from 'react';
import TSXAir from 'tsx-air';

export const Internal = TSXAir((props: {title: string})=> {
  return (
    <div>
      <span id="aa">{props.title}</span>
      <span>{props.title}</span>
      <div>{props.title}</div>
    </div>
  );
});
export const Checkbox = TSXAir((props: {title: string, gaga: string})=> {
  const b = <div />;
  const c = <><div /></>;

  return (
    <div>
      <Internal title="aa"/>
      <span>{props.title}</span>
      <div>{props.title}</div>
    </div>
  );
});

`.trimLeft();
