import React from 'react';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const StringTypeView: React.FunctionComponent<ISchemaViewProps> = props => (
    <div className={style(classes.root, { category: 'string' }, props.className)}>string</div>
);
