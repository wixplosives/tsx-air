import {
    ICodeSchema,
    ClassSchemaId,
    IClassSchema,
    IModuleSchema,
    isRef,
    isClassSchema,
    UnknownSchemaId,
    isInterfaceSchema,
    IInterfaceSchema,
    InterfaceSchemaId,
    isFunctionSchema,
    isObjectSchema
} from './json-schema-types';
import { unique } from './utils';
import { modifySchema, walkSchema } from './schema-walker';
const commonFields: Array<keyof ICodeSchema> = ['name', 'inheritedFrom', 'definedAt', 'description'];

export interface IExtractor {
    getSchema: (f: string) => IModuleSchema;
    getSchemaFromImport?: (path: string, ref: string, file: string) => IModuleSchema | null;
}
export interface LinkerEnv {
    modulePath: string;
    moduleSchema: IModuleSchema;
}
export class SchemaLinker {
    private extractor: IExtractor;

    constructor(extractor: IExtractor) {
        this.extractor = extractor;
    }

    public flatten(file: string, entityName: string): ICodeSchema {
        let entity;
        const schema = this.extractor.getSchema(file);
        if (schema.definitions) {
            entity = schema.definitions[entityName];
        }
        if (!entity && schema.properties) {
            entity = schema.properties[entityName];
        }
        if (!entity) {
            return { $ref: UnknownSchemaId };
        }
        const env: LinkerEnv = {
            modulePath: file,
            moduleSchema: schema
        };
        return this.link(entity, env, undefined, true);
    }

    public link(entity: ICodeSchema, env: LinkerEnv, paramsMap?: Map<string, ICodeSchema>, includeDependencies:boolean = false): ICodeSchema {
        if (!entity) {
            return { $ref: UnknownSchemaId };
        }
        if (isClassSchema(entity)) {
            entity = this.linkClass(entity, env);
        }
        if (isInterfaceSchema(entity)) {
            entity = this.linkInterface(entity, env);
        }
        if (isRef(entity)) {
            return this.handleRef(entity, env, paramsMap);
        }
        return this.linkGenericsAndIntersection(entity, env, paramsMap, includeDependencies);
    }

    private linkGenericsAndIntersection<T extends ICodeSchema>(entity: T, env: LinkerEnv, pMap?: Map<string, ICodeSchema>, includeDependencies:boolean = false): T {
        if (entity.genericParams && pMap) {
            entity = { ...entity };
            delete entity.genericParams;
        }

        const dependencies: Set<string> = new Set();
        const result =  modifySchema(entity, schema => {    
            if (isRef(schema) && pMap && pMap.has(schema.$ref)){
                const res = { ...pMap.get(schema.$ref)! };
                for (const fieldName of commonFields) {
                    if (schema[fieldName]) {
                        res[fieldName] = schema[fieldName];
                    }
                }
                return res;
            }
            if (schema.allOf) {
                return this.handleIntersection(schema, env, pMap);
            }
            
            return schema;
        });
        

        if(includeDependencies){
            walkSchema(result, schema=>{
                if(schema.$ref && !schema.$ref.includes('!') && !schema.$ref.startsWith('common/')){
                    // add to dependencies if its not an un assigned generic param
                    dependencies.add(schema.$ref);
                }
            }, ['extends']);
            if(dependencies.size){
                return {...result, linkedSchemaDependencies: [...dependencies]};
            }
        }
        return result;
    }
    private getRefEntity(
        ref: string,
        env: LinkerEnv,
        paramsMap?: Map<string, ICodeSchema>
    ) {
        if (!ref) {
            return { refEntity: null, refEntityType: ref };
        }
        if (paramsMap && paramsMap.has(ref)) {
            return { refEntity: paramsMap.get(ref) || null, refEntityType: ref };
        }
        const poundIndex = ref.indexOf('#');
        let refEntity: ICodeSchema | null = null;
        const cleanRef = ref.slice(poundIndex + 1).replace('typeof ', '');
        if (poundIndex !== 0 && this.extractor.getSchemaFromImport) {
            const filePath = ref.slice(0, poundIndex);
            const importSchema = this.extractor.getSchemaFromImport(
                filePath,
                ref.slice(poundIndex + 1),
                env.modulePath
            );
            if (importSchema && importSchema.definitions) {
                refEntity = importSchema.definitions[cleanRef] || null;
            }
            return {
                refEntity,
                refEntityType: cleanRef,
                moduleSchema: importSchema,
                modulePath: filePath
            };
        } else {
            if (!env.moduleSchema || !env.moduleSchema.definitions) {
                return {
                    refEntity: null,
                    refEntityType: cleanRef
                };
            }
            return { refEntity: env.moduleSchema.definitions[cleanRef] || null, refEntityType: cleanRef };
        }


    }
    private handleRef(entity: ICodeSchema & { $ref: string }, env: LinkerEnv, paramsMap?: Map<string, ICodeSchema>) {
        const { refEntity, refEntityType, modulePath, moduleSchema } = this.getRefEntity(entity.$ref, env, paramsMap);
        if (!refEntity) {
            return entity;
        }
        const refEntityCopy = entity.$ref.indexOf('!') !== -1 ? refEntity : { ...refEntity, definedAt: entity.$ref };
        const refEnv: LinkerEnv = (moduleSchema && modulePath) ? {
            modulePath,
            moduleSchema
        } : env;
        if (refEntityCopy.genericParams && entity.genericArguments) {
            const pMap = new Map();
            refEntityCopy.genericParams!.forEach((param, index) => {
                pMap.set(`#${refEntityType}!${param.name}`, this.link(entity.genericArguments![index], env, paramsMap));
            });
            return this.link(refEntityCopy, refEnv, pMap);
        }
        return this.link(refEntityCopy, refEnv);
    }

    private handleIntersection(schema: ICodeSchema, env: LinkerEnv, paramsMap?: Map<string, ICodeSchema>): ICodeSchema {
        const options = schema.allOf!;
        if (options.length === 0) {
            throw new Error('Cannot intersect an empty array');
        }
        let res: ICodeSchema = {};
        for (const o of options) {
            const optionRef = isRef(o) ? o.$ref : schema.definedAt;
            const option = isRef(o) ? this.handleRef(o, env, paramsMap) : o;
            if (isClassSchema(option) || isFunctionSchema(option)) {
                return {
                    $ref: 'common/never'
                };
            }
            if (!res.type) {
                if(isInterfaceSchema(option)){
                    res.type = 'object';
                }else{

                    res.type = option.type;
                }
            }

            if (res.type && option.type && res.type !== option.type) {
                return {
                    $ref: 'common/never'
                };
            }
            if (
                (isObjectSchema(option) || isInterfaceSchema(option)) &&
                (isInterfaceSchema(res) || isObjectSchema(res))
            ) {
                res = this.mergeObjects(res, option,optionRef, env, paramsMap);
                continue;
            }
        }
        return res;
    }



    private linkInterface(entity: IInterfaceSchema, env: LinkerEnv): IInterfaceSchema {
        const res: IInterfaceSchema = {
            $ref: InterfaceSchemaId,
            properties: { ...entity.properties },
            required: entity.required
        };
        if (entity.extends && entity.extends.length) {
            const refInterface = this.handleRef(entity.extends![0] as ICodeSchema & { $ref: string }, env);
            this.assignProperties(res, refInterface as IInterfaceSchema, entity.extends![0].$ref!, 'properties');
            res.required = !res.required.length
                ? refInterface.required!
                : unique([...res.required, ...refInterface.required!]);
        }
        return res;
    }

    private assignProperties<SCHEMA extends ICodeSchema>(target: SCHEMA, from: SCHEMA, fromRef: string, field: SCHEMA extends IClassSchema ? 'properties' | 'staticProperties' : 'properties') {
        const properties: Record<string, ICodeSchema> = from[field]!;
        const targetproperties: Record<string, ICodeSchema> = (target[field] || {})!;
        for (const prop in properties) {
            if (!targetproperties.hasOwnProperty(prop)) {
                targetproperties[prop] = properties[prop];
                let inheritedFrom = fromRef;
                if (properties[prop].inheritedFrom) {
                    if (properties[prop].inheritedFrom!.startsWith('#') && !inheritedFrom.startsWith('#')) {
                        inheritedFrom = inheritedFrom.slice(0, inheritedFrom.indexOf('#')) + properties[prop].inheritedFrom!;
                    } else {
                        inheritedFrom = properties[prop].inheritedFrom!;
                    }
                }
                targetproperties[prop].inheritedFrom = inheritedFrom;
            }
        }
    }

    private mergeObjects(
        object1: ICodeSchema,
        object2: ICodeSchema,
        object2Ref: string | undefined,
        env: LinkerEnv,
        paramsMap?: Map<string, ICodeSchema>
    ): ICodeSchema {
        const props1 = object1.properties || {};
        const props2 = object2.properties || {};

        const res: ICodeSchema & { properties: { [name: string]: ICodeSchema } } = {
            type: 'object',
            properties: {},
            required: []
        };
        for (const [key, val] of Object.entries(props1)) {
            res.properties[key] = val;
        }
        for (const [key, val] of Object.entries(props2)) {
            if (!res.properties.hasOwnProperty(key)) {
                res.properties[key] = val;
                if (object2Ref && !val.definedAt) {
                    res.properties[key].definedAt = object2Ref;
                }
            } else {
                res.properties[key] = this.handleIntersection({allOf: [res.properties[key], val]}, env, paramsMap);
            }
        }
        res.required = unique([...(object1.required || []), ...(object2.required || [])]);
        return res;
    }

    private linkClass(entity: IClassSchema, env: LinkerEnv): IClassSchema {
        if (!env.moduleSchema || !env.moduleSchema.definitions || !entity.extends) {
            return entity;
        }
        const res = {
            $ref: ClassSchemaId,
            extends: { $ref: entity.extends.$ref },
            properties: { ...entity.properties },
            staticProperties: { ...entity.staticProperties }
        } as IClassSchema;
        const refInterface = this.handleRef(entity.extends as ICodeSchema & { $ref: string }, env);

        if (entity.hasOwnProperty('constructor')) {
            res.constructor = Object.assign({}, entity.constructor);
        } else if (refInterface.hasOwnProperty('constructor')) {
            res.constructor = Object.assign({}, (refInterface as IClassSchema).constructor);
        }
        this.assignProperties(res, refInterface as IClassSchema, entity.extends.$ref!, 'properties');
        this.assignProperties(res, refInterface as IClassSchema, entity.extends.$ref!, 'staticProperties');
        if (entity.genericParams) {
            res.genericParams = [...entity.genericParams];
        }
        return res;
    }
}