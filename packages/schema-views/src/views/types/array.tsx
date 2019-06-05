import React from 'react';
import { BaseView } from '../base';
import { isSimpleType } from '../../schema-predicates';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './type.st.css';

export const ArrayTypeView: React.FunctionComponent<ISchemaViewProps> = props => {
    const itemSchema = props.schema.items;

    const itemJsx = (
        <BaseView schemaRegistry={props.schemaRegistry} viewRegistry={props.viewRegistry} schema={itemSchema} />
    );

    const arrayJsx = isSimpleType(itemSchema) ? (
        <>{itemJsx}[]</>
    ) : (
        <>
            Array{'<'}
            {itemJsx}
            {'>'}
        </>
    );

    return <div className={style(classes.root, { category: 'array' }, props.className)}>{arrayJsx}</div>;
};
