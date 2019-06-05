import React from 'react';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const NumberTypeView: React.FunctionComponent<ISchemaViewProps> = props => (
    <div className={style(classes.root, { category: 'number' }, props.className)}>number</div>
);
