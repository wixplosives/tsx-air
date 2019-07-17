export const sampleTypescriptFilePath = '/index.tsx';
export const sampleTypescriptFile = `
import React from 'react';
import TSXAir from 'tsx-air';

export const Checkbox = TSXAir((props: {title: string})=> {
  return (
    <div><span>{props.title}</span></div>
  );
});
`.trimLeft();
