import React from 'react';
import { intersperse } from '../../utils';
import { ISchemaViewProps } from '../../schema-view';
import { Schema } from '../../schema';
import { isVoid } from '../../schema-predicates';
import { BaseView } from '../base';
import { style, classes } from './type.st.css';

export const FunctionTypeView: React.FunctionComponent<ISchemaViewProps> = props => {
    const { schema } = props;
    const required = schema.requiredArguments || [];
    const args = schema.arguments.map((arg: Schema) => {
        const optional = required.includes(arg.name) ? '' : '?';
        const argName = arg.name + optional;
        return [
            argName + ': ',
            <BaseView
                key="view"
                schemaRegistry={props.schemaRegistry}
                viewRegistry={props.viewRegistry}
                schema={arg}
            />,
            arg.hasOwnProperty('default')
                ? ` = ${JSON.stringify(arg.default)}`
                : arg.hasOwnProperty('initializer')
                ? ` = ${arg.initializer}`
                : ''
        ];
    });
    const restArg = schema.restArgument;
    if (restArg) {
        args.push([
            `...${restArg.name}: `,
            <BaseView
                key="restArgView"
                schemaRegistry={props.schemaRegistry}
                viewRegistry={props.viewRegistry}
                schema={restArg}
            />
        ]);
    }
    const commaSeparatedArgs = React.Children.toArray(intersperse(args, ', '));
    return (
        <div className={style(classes.root, { category: 'function' }, props.className)}>
            ({commaSeparatedArgs}) =>{' '}
            {isVoid(schema.returns) ? (
                'void'
            ) : (
                <BaseView
                    schemaRegistry={props.schemaRegistry}
                    viewRegistry={props.viewRegistry}
                    schema={schema.returns}
                />
            )}
        </div>
    );
};
