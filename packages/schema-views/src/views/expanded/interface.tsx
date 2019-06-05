import React from 'react';
import { BaseView } from '../base';
import { ISchemaViewProps } from '../../schema-view';
import { style, classes } from './table.st.css';
import { Schema } from '../../schema';

export const InterfaceView: React.SFC<ISchemaViewProps> = props => {
    const { schema } = props;

    const requiredProps: string[] = schema.required || [];
    const properties: Schema[] = schema.properties || [];

    const entries = Object.entries(properties).map(([propName, propSchema]) => {
        const name = propName;
        const description = propSchema.description || '';
        const isRequired = requiredProps.includes(propName);
        const type = (
            <BaseView schemaRegistry={props.schemaRegistry} viewRegistry={props.viewRegistry} schema={propSchema} />
        );

        return { name, isRequired, type, description };
    });

    return (
        <table className={style(classes.root, props.className)}>
            <thead>
                <tr>
                    <th className={classes.header}>Name</th>
                    <th className={classes.header}>Type</th>
                    <th className={classes.header}>Description</th>
                </tr>
            </thead>
            <tbody>
                {entries.map(({ name, isRequired, type, description }) => (
                    <tr key={name}>
                        <td className={classes.propName}>
                            {name}
                            {isRequired ? '' : '?'}
                        </td>
                        <td className={classes.propType}>{type}</td>
                        <td className={classes.propDescription}>{description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
