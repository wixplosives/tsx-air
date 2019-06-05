import React from 'react';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const BooleanTypeView: React.FunctionComponent<ISchemaViewProps> = props => (
    <div className={style(classes.root, { category: 'boolean' }, props.className)}>boolean</div>
);
