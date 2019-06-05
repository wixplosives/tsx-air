import React from 'react';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const AnyTypeView: React.FunctionComponent<ISchemaViewProps> = props => (
    <div className={style(classes.root, { category: 'any' }, props.className)}>any</div>
);
