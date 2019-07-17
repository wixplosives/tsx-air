export const sampleTypescriptFilePath = '/index.tsx';
export const sampleTypescriptFile = `
import React from 'react';
import TSXAir from 'tsx-air';

export const Checkbox = TSXAir((props: {title: string, gaga: string})=> {
  return (
    <div>
      <span id="aa" data-something={props.gaga}>{props.title}</span>
      <span>{props.title}</span>
      <div>{props.title}</div>
    </div>
  );
});

`.trimLeft();
