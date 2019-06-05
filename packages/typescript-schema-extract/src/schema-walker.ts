import { ICodeSchema, isFunctionSchema, IFunctionSchema, isInterfaceSchema, IInterfaceSchema, isClassSchema, IClassSchema } from './json-schema-types';
export type ISchemaChildrenMap<SCHEMA extends ICodeSchema> = {
    [key in keyof SCHEMA]?: 'array' | 'object' | 'single' | 'single/array';
};
const commonFields: ISchemaChildrenMap<ICodeSchema> = {
    items: 'single/array',
    additionalItems: 'single',
    contains: 'single',
    // objects
    properties: 'object',
    patternProperties: 'object',
    additionalProperties: 'single',
    dependencies: 'object',
    propertyNames: 'single',
    // conditionals
    if: 'single',
    then: 'single',
    else: 'single',
    // type operations
    allOf: 'array',
    anyOf: 'array',
    oneOf: 'array',
    not: 'single'
};
export function getSchemaChildren<SCHEMA extends ICodeSchema>(schema: SCHEMA): ISchemaChildrenMap<SCHEMA> {
    if (isFunctionSchema(schema)) {
        const res: ISchemaChildrenMap<IFunctionSchema> = {
            ...commonFields,
            arguments: 'array',
            restArgument: 'single',
            returns: 'single'
        };
        return res as ISchemaChildrenMap<SCHEMA>;
    }
    if (isInterfaceSchema(schema)) {
        const res: ISchemaChildrenMap<IInterfaceSchema> = {
            ...commonFields,
            extends: 'array'
        };
        return res as ISchemaChildrenMap<SCHEMA>;
    }
    if (isClassSchema(schema)) {
        const res: ISchemaChildrenMap<IClassSchema> = {
            ...commonFields,
            extends: 'single',
            implements: 'array',
            constructor: 'single',
            staticProperties: 'object'
        };
        return res as unknown as ISchemaChildrenMap<SCHEMA>;
    }
    return commonFields as ISchemaChildrenMap<SCHEMA>;
}

export function walkSchema(schema: ICodeSchema, cb: (schema: ICodeSchema) => void, exclude: string[]) {
    const fields = getSchemaChildren(schema);
    cb(schema);
    for (const field of (Object.keys(fields) as Array<keyof typeof fields>)) {
        if (!schema[field] || exclude.includes(field)) {
            continue;
        }
        let fieldType = fields[field];
        if (fieldType === 'single/array') {
            if (typeof (schema[field] as any).splice === 'function') {
                fieldType = 'array';
            } else {
                fieldType = 'single';
            }
        }
        if (schema[field]) {
            switch (fieldType) {
                case 'single':
                    walkSchema(schema[field] as ICodeSchema, cb, exclude);
                    break;
                case 'array':
                    for (const innerSchema of schema[field] as ICodeSchema[]) {
                        walkSchema(innerSchema, cb, exclude);
                    }
                    break;
                case 'object':
                    const fieldAsObject = schema[field] as Record<string, ICodeSchema>;
                    for (const innerSchemaKey of Object.keys(fieldAsObject)) {
                        walkSchema(fieldAsObject[innerSchemaKey], cb, exclude);
                    }
                    break;

            }
        }
    }
}

export type modifySchemaCB<T extends ICodeSchema> = (schema: T) => T;
export function modifySchema<SCHEMA extends ICodeSchema>(schema: SCHEMA, cb: modifySchemaCB<ICodeSchema>): SCHEMA {
    const fields = getSchemaChildren(schema);
    let schemaOrCopy = schema;
    for (const field of (Object.keys(fields) as Array<keyof typeof fields>)) {
        if (!schema[field]) {
            continue;
        }
        let fieldType = fields[field];
        if (fieldType === 'single/array') {
            if (typeof (schema[field] as any).splice === 'function') {
                fieldType = 'array';
            } else {
                fieldType = 'single';
            }
        }
        if (schema[field]) {
            switch (fieldType) {
                case 'single':
                    const fieldRes = modifySchema(schema[field] as ICodeSchema, cb);
                    if (fieldRes !== schema[field]) {
                        schemaOrCopy = {
                            ...schemaOrCopy,
                            [field]: fieldRes
                        };
                    }
                    break;
                case 'array':
                    const arr = schema[field] as unknown as ICodeSchema[];
                    let arrOrCopy = arr;
                    for (let i = 0; i < arr.length; i++) {
                        const innerRes = modifySchema(arr[i], cb);
                        if (innerRes !== arr[i]) {
                            arrOrCopy = [...arrOrCopy];
                            arrOrCopy[i] = innerRes;
                        }
                    }
                    if (arrOrCopy !== arr) {
                        schemaOrCopy = {
                            ...schemaOrCopy,
                            [field]: arrOrCopy
                        };
                    }
                    break;
                case 'object':
                    const fieldAsObject = schema[field] as unknown as Record<string, ICodeSchema>;
                    let fieldsOrCopy = fieldAsObject;
                    for (const innerSchemaKey of Object.keys(fieldAsObject)) {
                        const propertyRes = modifySchema(fieldAsObject[innerSchemaKey], cb);
                        if(propertyRes!==fieldAsObject[innerSchemaKey]){
                            fieldsOrCopy = {
                                ...fieldsOrCopy,
                                [innerSchemaKey]: propertyRes
                            };
                        }
                    }
                    if(fieldsOrCopy !== fieldAsObject){
                        schemaOrCopy = {
                            ...schemaOrCopy,
                            [field]: fieldsOrCopy
                        };
                    }
                    break;

            }
        }
    }
    const res = cb(schemaOrCopy);
    return res as SCHEMA;
}