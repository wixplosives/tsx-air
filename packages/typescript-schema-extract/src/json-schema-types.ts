import { JSONSchema7 } from 'json-schema';

export const ModuleSchemaId = 'common/module';
export const FunctionSchemaId = 'common/function';
export const ClassSchemaId = 'common/class';
export const ClassConstructorSchemaId = 'common/class_constructor';
export const UndefinedSchemaId = 'common/undefined';
export const NullSchemaId = 'common/null';
export const PromiseSchemaId = 'common/promise';
export const JSXElementSchemaId = 'common/jsx';
export const NeverSchemaId = 'common/never';
export const UnknownSchemaId = 'common/unknown';
export const InterfaceSchemaId = 'common/interface';

export interface ICodeSchema extends JSONSchema7 {
    items?: ICodeSchema | ICodeSchema[];
    additionalItems?: ICodeSchema;
    contains?: ICodeSchema;
    properties?: Record<string, SchemaTypes>;
    patternProperties?: Record<string, ICodeSchema>;
    additionalProperties?: ICodeSchema;
    dependencies?: Record<string, ICodeSchema | string[]>;
    propertyNames?: ICodeSchema;
    if?: ICodeSchema;
    then?: ICodeSchema;
    else?: ICodeSchema;
    allOf?: ICodeSchema[];
    anyOf?: ICodeSchema[];
    oneOf?: ICodeSchema[];
    not?: ICodeSchema;
    definitions?: Record<string, SchemaTypes>;

    // custom fields
    name?: string;
    genericParams?: ICodeSchema[];
    genericArguments?: ICodeSchema[];
    inheritedFrom?: string;
    definedAt?: string;
    initializer?: string;
    linkedSchemaDependencies?: string[];
}

export interface IModuleSchema extends ICodeSchema {
    $ref: typeof ModuleSchemaId;
    $id: NonNullable<ICodeSchema['$id']>;
    definitions: NonNullable<ICodeSchema['definitions']>;
    properties: NonNullable<ICodeSchema['properties']>;
    moduleDependencies: string[];
}

export type SchemaTypes = IFunctionSchema | IClassSchema | IInterfaceSchema | ICodeSchema;

export interface IFunctionSchema extends ICodeSchema {
    $ref: typeof FunctionSchemaId | typeof ClassConstructorSchemaId;
    arguments: ICodeSchema[];
    requiredArguments: string[];
    restArgument?: ICodeSchema;
    returns?: ICodeSchema;
}

export interface IInterfaceSchema extends ICodeSchema {
    $ref: typeof InterfaceSchemaId;
    extends?: ICodeSchema[];
    properties: NonNullable<ICodeSchema['properties']>;
    required: NonNullable<ICodeSchema['required']>;
}

export interface IClassSchema extends ICodeSchema {
    $ref: typeof ClassSchemaId;
    extends?: ICodeSchema;
    implements?: ICodeSchema[];
    constructor?: IFunctionSchema;
    staticProperties?: Record<string, ICodeSchema>;
    properties: NonNullable<ICodeSchema['properties']>;
}

export function isRef<T extends ICodeSchema>(schema?: T | null): schema is T & { $ref: string } {
    return !!schema && !!schema.$ref && schema.$ref.includes('#');
}

export function isClassSchema(schema?: ICodeSchema | null): schema is IClassSchema {
    return !!schema && !!schema.$ref && schema.$ref === ClassSchemaId;
}

export function isInterfaceSchema(schema?: ICodeSchema | null): schema is IInterfaceSchema {
    return !!schema && !!schema.$ref && schema.$ref === InterfaceSchemaId;
}

export function isFunctionSchema(schema?: ICodeSchema | null): schema is IFunctionSchema {
    return !!schema && !!schema.$ref && (schema.$ref === FunctionSchemaId || schema.$ref === ClassConstructorSchemaId);
}

export function isNeverSchema<T extends ICodeSchema>(schema?: T | null): schema is T {
    return !!schema && !!schema.$ref && schema.$ref === NeverSchemaId;
}

export function isObjectSchema<T extends ICodeSchema>(schema?: T | null): schema is T {
    return !!schema && !!schema.type && schema.type === 'object';
}

export function isArraySchema(schema?: ICodeSchema | null) {
    return !!schema && schema.type === 'array';
}

export function isModuleSchema(schema?: ICodeSchema | null): schema is IModuleSchema {
    return !!schema && !!schema.$ref && schema.$ref === ModuleSchemaId;
}
