import React from 'react';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const UndefinedTypeView: React.FunctionComponent<ISchemaViewProps> = props => (
    <div className={style(classes.root, { category: 'undefined' }, props.className)}>undefined</div>
);
