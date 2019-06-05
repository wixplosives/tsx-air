import ts from 'typescript';
import {
    IModuleSchema,
    ICodeSchema,
    NullSchemaId,
    UndefinedSchemaId,
    FunctionSchemaId,
    isArraySchema,
    IFunctionSchema,
    IClassSchema,
    ClassConstructorSchemaId,
    ClassSchemaId,
    InterfaceSchemaId,
    IInterfaceSchema,
    isObjectSchema
} from './json-schema-types';
import { generateDataLiteral } from './data-literal-transformer';
import { resolveImportedIdentifier, resolveImportPath, IFileSystemPath } from './imported-identifier-resolver';

export interface IEnv {
    checker: ts.TypeChecker;
    modulePath: string;
    projectPath: string;
    pathUtil: IFileSystemPath;
    dependencies: Set<string>;
}

export function transform(
    checker: ts.TypeChecker,
    sourceFile: ts.SourceFile,
    moduleId: string,
    projectPath: string,
    pathUtil: IFileSystemPath
): IModuleSchema {
    const moduleSymbol = (sourceFile as any).symbol;
    const res: IModuleSchema = {
        $id: moduleId,
        $ref: 'common/module',
        properties: {},
        definitions: {},
        moduleDependencies: []
    };
    if (!moduleSymbol) {
        return res;
    }
    const env: IEnv = {
        checker,
        modulePath: moduleId,
        projectPath,
        pathUtil,
        dependencies: new Set()
    };
    const exports = checker.getExportsOfModule(moduleSymbol);
    exports.forEach(exportObj => {
        const node = getNode(exportObj)!;
        
        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
            res.properties![exportObj.getName()] = describeFunction(node, env).schema;
        } else if (ts.isClassDeclaration(node)) {
            const classDefinitions = describeClass(node, env).schema;
            const className = exportObj.getName();
            res.definitions[className] = classDefinitions;
            res.properties![className] = {
                $ref: '#typeof ' + className
            };
        } else {
            let exportSchema: ICodeSchema = {};
            let isTypeOnly: boolean = false;
            if (ts.isVariableDeclaration(node)) {
                exportSchema = describeVariableDeclaration(node, env).schema;
            } else if (ts.isExportSpecifier(node)) {
                exportSchema = exportSpecifierDescriber(node, env, exportObj).schema;
            } else if (ts.isExportAssignment(node)) {
                exportSchema = assignmentDescriber(node, env).schema;
            } else if (ts.isTypeAliasDeclaration(node)) {
                isTypeOnly = true;
                exportSchema = describeTypeAlias(node, env).schema;
            } else if (ts.isInterfaceDeclaration(node)) {
                isTypeOnly = true;
                exportSchema = describeInterface(node, env).schema;
            }
            const documentation = exportObj.getDocumentationComment(checker);
            if (documentation.length) {
                exportSchema.description = documentation.map(doc => doc.text).join('\n');
            }

            const tags = exportObj.getJsDocTags();
            if (tags.length) {
                for (const tag of tags) {
                    if (tag.text) {
                        (exportSchema as any)[tag.name] = isNaN(parseFloat(tag.text)) ? tag.text : parseFloat(tag.text);
                    }
                }
            }

            if (isTypeOnly) {
                res.definitions = res.definitions || {};
                res.definitions[exportObj.getName()] = exportSchema;
            } else {
                res.properties![exportObj.getName()] = exportSchema;
            }
        }
    });

    res.moduleDependencies = [...env.dependencies];
    return res;
}

export type TsNodeDescriber<N extends ts.Node, S extends ICodeSchema = ICodeSchema> = (
    n: N,
    env: IEnv,
    typeSet?: Set<ts.Node>
) => { schema: S; required?: boolean };

function getNode(symb: ts.Symbol): ts.Node | undefined {
    if (!symb) {
        return undefined;
    }
    if (symb.valueDeclaration) {
        return symb.valueDeclaration;
    }
    if (symb.declarations) {
        return symb.declarations[0];
    }
    return undefined;
}

const exportSpecifierDescriber = (decl: ts.ExportSpecifier, env: IEnv, symb: ts.Symbol) => {
    const aliasedSymb = env.checker.getAliasedSymbol(symb!);
    if (aliasedSymb) {
        const aliasedNode = getNode(aliasedSymb);
        if (aliasedNode && ts.isVariableDeclaration(aliasedNode)) {
            return describeVariableDeclaration(aliasedNode, env);
        }
    }

    const exportClause = decl.parent!.parent!;
    if (ts.isExportDeclaration(exportClause) && exportClause.moduleSpecifier) {
        const filePath = resolveImportPath(
            exportClause.moduleSpecifier!.getText().slice(1, -1),
            '',
            env.modulePath,
            env.pathUtil
        );
        env.dependencies.add(filePath);
        return {
            schema: {
                $ref: filePath + '#typeof ' + symb!.name
            }
        };
    }
    return {
        schema: {}
    };
};

const assignmentDescriber: TsNodeDescriber<ts.ExportAssignment | ts.ExpressionWithTypeArguments> = (decl, env) => {
    const expression: ts.Node = decl.expression;
    if (ts.isIdentifier(expression)) {
        return describeIdentifier(expression, env);
    } else if (ts.isPropertyAccessExpression(expression)) {
        if (ts.isIdentifier(expression.expression)) {
            const identifier = describeIdentifier(expression.expression, env);
            const identifierRef = identifier.schema.$ref;
            const innerRef = expression.name.getText();
            if (identifierRef) {
                identifier.schema.$ref = identifierRef.includes('#')
                    ? identifierRef + '.' + innerRef
                    : identifierRef + '#' + innerRef;
            }
            return identifier;
        }
    }
    const t = env.checker.getTypeAtLocation(expression);
    return serializeType(t, decl, env);
};

const describeVariableDeclaration: TsNodeDescriber<
    ts.VariableDeclaration | ts.PropertySignature | ts.ParameterDeclaration | ts.PropertyDeclaration
> = (decl, env, tSet) => {
    const { result, set } = checkCircularType(tSet, decl);
    if (result) {
        return result;
    }
    let res: ICodeSchema | undefined;
    let isRequired = true;
    if (decl.type) {
        res = describeTypeNode(decl.type!, env, set).schema;
        if (decl.initializer) {
            isRequired = false;
            const defaultVal = generateDataLiteral(
                {
                    checker: env.checker,
                    pathUtil: env.pathUtil,
                    modulePath: env.modulePath
                },
                decl.initializer
            );
            if (!defaultVal.isLiteral) {
                res!.initializer = defaultVal.expression;
            } else {
                res!.default = defaultVal.value;
            }
        }
    } else if (decl.initializer) {
        isRequired = false;
        if (ts.isIdentifier(decl.initializer)) {
            res = describeIdentifier(decl.initializer, env, set).schema;
            res.$ref = res.$ref!.replace('#', '#typeof ');
        } else if (ts.isPropertyAccessExpression(decl.initializer) && ts.isIdentifier(decl.initializer.expression)) {
            res = describeIdentifier(decl.initializer.expression, env, set).schema;
            let ref = res.$ref!;
            if (ref.includes('#')) {
                ref = ref!.replace('#', '#typeof ') + '.' + decl.initializer.name.getText();
            } else {
                ref += '#typeof ' + decl.initializer.name.getText();
            }
            res = {
                $ref: ref
            };
        } else {
            res = serializeType(env.checker.getTypeAtLocation(decl), decl, env).schema;
            const defaultVal = generateDataLiteral(
                {
                    checker: env.checker,
                    pathUtil: env.pathUtil,
                    modulePath: env.modulePath
                },
                decl.initializer
            );
            if (!defaultVal.isLiteral) {
                res!.initializer = defaultVal.expression;
            } else {
                res!.default = defaultVal.value;
            }
        }
    }
    if (ts.isPropertyDeclaration(decl) || ts.isPropertySignature(decl) || ts.isParameter(decl)) {
        if (decl.questionToken) {
            isRequired = false;
        }
    }

    if (!res) {
        res = serializeType(env.checker.getTypeAtLocation(decl), decl, env).schema;
        const child = decl.getChildAt(0);
        if (child && ts.isObjectBindingPattern(child)) {
            const defaultVal = generateDataLiteral(
                {
                    checker: env.checker,
                    pathUtil: env.pathUtil,
                    modulePath: env.modulePath
                },
                child
            );
            isRequired = false;
            if (res && isObjectSchema(res) && res.required) {
                res.required = res.required.filter(p => !defaultVal.value.hasOwnProperty(p));
                if (!res.required.length) {
                    delete res.required;
                }
            }
            if (!defaultVal.isLiteral) {
                res!.initializer = defaultVal.expression;
            } else {
                res!.default = defaultVal.value;
            }
        }
    }
    const jsDocs = extraCommentsHack(decl);
    if (jsDocs) {
        if (jsDocs.comment) {
            res!.description = jsDocs.comment;
        }

        if (jsDocs.tags) {
            addJsDocsTagsToSchema(jsDocs.tags as any, res!);
        }
    }
    return {
        schema: res!,
        required: isRequired
    };
};

const describeTypeNode: TsNodeDescriber<ts.TypeNode> = (decl, env, tSet) => {
    // temporary hack for handling Readonly, we need to find a better solution but this will work for now
    if (
        (decl as any).typeName &&
        ((decl as any).typeName.getText() === 'Readonly' || (decl as any).typeName.getText() === 'Partial')
    ) {
        decl = (decl as any).typeArguments[0];
    }

    const { result, set } = checkCircularType(tSet, decl);
    if (result) {
        return result;
    }
    let res;
    if (ts.isTypeReferenceNode(decl)) {
        res = describeTypeReference(decl, env, set);
    } else if (ts.isTypeLiteralNode(decl)) {
        res = describeTypeLiteral(decl, env, set);
    } else if (ts.isArrayTypeNode(decl)) {
        res = describeArrayType(decl, env, set);
    } else if (ts.isTupleTypeNode(decl)) {
        res = describeTuppleTypeNode(decl, env, set);
    } else if (ts.isUnionTypeNode(decl)) {
        res = describeUnionType(decl, env, set);
    } else if (ts.isIntersectionTypeNode(decl)) {
        res = describeIntersectionType(decl, env, set);
    } else if (ts.isFunctionTypeNode(decl)) {
        res = describeFunction(decl, env, set);
    } else if (ts.isMappedTypeNode(decl)) {
        res = describeMappedType(decl, env, set);
    } else if (ts.isParenthesizedTypeNode(decl)) {
        res = describeTypeNode(decl.type, env, set);
    } else {
        const t = env.checker.getTypeAtLocation(decl);
        res = serializeType(t, decl, env);
    }
    return res;
};

const describeMappedType: TsNodeDescriber<ts.MappedTypeNode> = (decl, env, tSet) => {
    const res: ICodeSchema = {
        type: 'object',
        properties: {},
        additionalProperties: describeTypeNode(decl.type!, env, tSet).schema,
        propertyNames: describeTypeNode(decl.typeParameter.constraint!, env, tSet).schema,
        required: []
    };
    return {
        schema: res
    };
};

const describeTypeAlias: TsNodeDescriber<ts.TypeAliasDeclaration> = (decl, env) => {
    const res = describeTypeNode(decl.type, env);
    const genericParams = getGenericParams(decl, env);
    if (genericParams) {
        res.schema.genericParams = genericParams;
    }
    return res;
};

const describeInterface: TsNodeDescriber<ts.InterfaceDeclaration> = (decl, env) => {
    const localRes = describeTypeLiteral(decl, env);
    localRes.schema.$ref = InterfaceSchemaId;
    const genericParams = getGenericParams(decl, env);
    if (genericParams) {
        localRes.schema.genericParams = genericParams;
    }
    if (decl.heritageClauses) {
        decl.heritageClauses.forEach(clauses => {
            clauses.types.forEach(t => {
                const description = assignmentDescriber(t, env).schema;
                if (t.typeArguments) {
                    description.genericArguments = t.typeArguments.map(a => describeTypeNode(a, env).schema);
                }
                (localRes.schema as IInterfaceSchema).extends = (localRes.schema as IInterfaceSchema).extends || [];
                (localRes.schema as IInterfaceSchema).extends!.push(description);
            });
        });
    }
    return localRes;
};

const describeFunction: TsNodeDescriber<
    ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionTypeNode | ts.ConstructorDeclaration | ts.MethodDeclaration,
    IFunctionSchema
> = (decl, env, tSet) => {
    const { set } = checkCircularType(tSet, decl);
    const returns = getReturnSchema(decl, env, set);
    const funcArguments: ICodeSchema[] = [];
    let restSchema: ICodeSchema | undefined;
    const required: string[] = [];
    decl.parameters.forEach(p => {
        // tslint:disable-next-line:no-shadowed-variable
        const res = describeVariableDeclaration(p, env, set);
        res.schema.name = p.name.getText();

        const tags = ts.getJSDocParameterTags(p);
        const tag = tags && tags.length ? tags.map(t => t.comment).join('') : '';
        if (tag) {
            res.schema.description = tag;
        }
        if (p.dotDotDotToken) {
            restSchema = res.schema;
        } else {
            funcArguments.push(res.schema);
            if (res.required) {
                required.push(res.schema.name);
            }
        }
    });
    const res: IFunctionSchema = {
        $ref: ts.isConstructorDeclaration(decl) ? ClassConstructorSchemaId : FunctionSchemaId,
        arguments: funcArguments,
        requiredArguments: required
    };
    if (returns.schema) {
        res.returns = returns.schema;
    }
    const genericParams = getGenericParams(decl, env);
    if (genericParams) {
        res.genericParams = genericParams;
    }
    const comments = env.checker.getSignatureFromDeclaration(decl)!.getDocumentationComment(env.checker);
    // tslint:disable-next-line:no-shadowed-variable
    const comment = comments.length
        ? comments.map(({ kind, text }) => (kind === 'lineBreak' ? text : text.trim().replace(/\r\n/g, '\n'))).join('')
        : '';
    if (comment) {
        res.description = comment;
    }
    if (restSchema) {
        res.restArgument = restSchema;
    }
    return {
        schema: res
    };
};

const getReturnSchema: TsNodeDescriber<
    ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionTypeNode | ts.ConstructorDeclaration | ts.MethodDeclaration,
    ICodeSchema
> = (decl, env, tSet) => {
    const returnSchema = decl.type
        ? describeTypeNode(decl.type, env, tSet).schema
        : (serializeType(env.checker.getTypeAtLocation(decl), decl, env).schema as IFunctionSchema).returns!;
    const returnTag = ts.getJSDocReturnTag(decl);
    if (returnTag && returnTag.comment) {
        returnSchema.description = returnTag.comment;
    }
    return { schema: returnSchema };
};

const describeClass: TsNodeDescriber<ts.ClassDeclaration, IClassSchema> = (decl, env) => {
    let extendRef: ICodeSchema | undefined;
    if (decl.heritageClauses) {
        decl.heritageClauses.forEach(node => {
            if (node.token === ts.SyntaxKind.ExtendsKeyword) {
                const t = node.types[0];
                extendRef = assignmentDescriber(t, env).schema;
                if (t.typeArguments) {
                    extendRef.genericArguments = t.typeArguments.map(a => describeTypeNode(a, env).schema);
                }
            }
        });
    }

    let constructorSign: IFunctionSchema | undefined;
    const properties: IClassSchema['properties'] = {};
    const staticProperties: IClassSchema['staticProperties'] = {};
    decl.members.forEach(member => {
        if (ts.isConstructorDeclaration(member)) {
            const funcSchema = describeFunction(member, env);
            constructorSign = funcSchema ? funcSchema.schema : undefined;
            member.parameters.forEach(p => {
                if (hasModifier(p, ts.SyntaxKind.PublicKeyword)) {
                    properties[p.name.getText()] = describeVariableDeclaration(p, env).schema;
                }
            });
        } else if (!hasModifier(member, ts.SyntaxKind.PrivateKeyword) && member.name) {
            let schema: ICodeSchema = {};
            if (ts.isPropertyDeclaration(member)) {
                schema = describeVariableDeclaration(member, env).schema;
            } else if (ts.isMethodDeclaration(member)) {
                schema = describeFunction(member, env).schema;
            }
            if (hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
                staticProperties[member.name!.getText()] = schema;
            } else {
                properties[member.name!.getText()] = schema;
            }
        }
    });
    const comments = env.checker.getSymbolAtLocation(decl.name!)!.getDocumentationComment(env.checker);
    const comment = comments.length
        ? comments.map(c => (c.kind === 'lineBreak' ? c.text : c.text.trim().replace(/\r\n/g, '\n'))).join('')
        : '';
    const classDef = {
        $ref: ClassSchemaId,
        properties,
        staticProperties
    } as IClassSchema;

    if (constructorSign) {
        (classDef.constructor as IFunctionSchema) = constructorSign;
    }

    if (comment) {
        classDef.description = comment;
    }
    const genericParams = getGenericParams(decl, env);
    if (genericParams) {
        classDef.genericParams = genericParams;
    }
    if (extendRef && extendRef.$ref) {
        classDef.extends = {
            $ref: extendRef.$ref
        };
        if (extendRef.genericArguments) {
            classDef.extends.genericArguments = extendRef.genericArguments;
        }
    }

    return {
        schema: classDef
    };
};

const describeTypeReference: TsNodeDescriber<ts.TypeReferenceNode> = (decl, env, tSet) => {
    const typeName = decl.typeName;
    let res;
    if (ts.isQualifiedName(typeName)) {
        res = describeQualifiedName(typeName, env, tSet).schema;
    } else {
        res = describeIdentifier(typeName, env, tSet).schema;
    }
    const typeArgs = decl.typeArguments;
    if (typeArgs) {
        if (isArraySchema(res)) {
            res.items = describeTypeNode(typeArgs[0], env, tSet).schema;
        } else {
            res.genericArguments = typeArgs.map(t => {
                return describeTypeNode(t, env, tSet).schema;
            });
        }
    }
    return {
        schema: res
    };
};

const describeQualifiedName: TsNodeDescriber<ts.QualifiedName> = (decl, env, tSet) => {
    if (ts.isIdentifier(decl.left)) {
        const identifierRef = describeIdentifier(decl.left, env, tSet).schema.$ref || '';
        const innerRef = decl.right.getText();
        return {
            schema: {
                $ref: identifierRef.includes('#') ? identifierRef + '.' + innerRef : identifierRef + '#' + innerRef
            }
        };
    } else {
        // tslint:disable-next-line:no-debugger
        debugger;
    }
    return {
        schema: {}
    };
};

const describeIdentifier: TsNodeDescriber<ts.Identifier> = (decl, env, tSet) => {
    if (decl.getText() === 'Array') {
        return {
            schema: {
                type: 'array'
            }
        };
    }
    if (decl.getText() === 'Object') {
        return {
            schema: {
                type: 'object'
            }
        };
    }
    const referencedSymb = env.checker.getSymbolAtLocation(decl)!;
    const referencedSymbDecl = getNode(referencedSymb);
    let ref: string = '';
    if (referencedSymbDecl) {
        const importedRef = resolveImportedIdentifier(referencedSymbDecl, env.modulePath, env.pathUtil);
        if (importedRef) {
            if (importedRef.indexOf('#') !== -1) {
                env.dependencies.add(importedRef.slice(0, importedRef.indexOf('#')));
            } else {
                env.dependencies.add(importedRef);
            }
            return {
                schema: {
                    $ref: importedRef
                }
            };
        }
        if (ts.isVariableDeclaration(referencedSymbDecl)) {
            return describeVariableDeclaration(referencedSymbDecl, env, tSet);
        } else if (ts.isTypeParameterDeclaration(referencedSymbDecl)) {
            ref = getGenericParamRef(referencedSymb, referencedSymbDecl);
        } else {
            ref = '#' + referencedSymb.name;
        }

        return {
            schema: {
                $ref: ref
            }
        };
    } else {
        // debugger;
        return {
            schema: {
                $ref: '#' + decl.getText()
            }
        };
    }
};

function getGenericParamRef(symb: ts.Symbol, decl: ts.TypeParameterDeclaration){
    if (ts.isFunctionTypeNode(decl.parent!) || ts.isArrowFunction(decl.parent!)) {
        return '#' +
            ts.getNameOfDeclaration(decl.parent!.parent as any)!.getText() +
            '!' +
            symb.name;
    } else {
       return '#' +
            ts.getNameOfDeclaration(decl.parent as any)!.getText() +
            '!' +
            symb.name;
    }
}

const describeTypeLiteral: TsNodeDescriber<ts.TypeLiteralNode | ts.InterfaceDeclaration> = (decl, env, tSet) => {
    const res: ICodeSchema = { properties: {}, required: [] };
    if (!ts.isInterfaceDeclaration(decl)) {
        res.type = 'object';
    }
    decl.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
            const desc = describeVariableDeclaration(member, env, tSet);
            const memberName = member.name.getText();
            res.properties![memberName] = desc.schema;
            if (desc.required) {
                res.required!.push(memberName);
            }
        } else if (ts.isIndexSignatureDeclaration(member)) {
            res.additionalProperties = describeTypeNode(member.type!, env, tSet).schema;
        }
    });
    return {
        schema: res
    };
};

const describeArrayType: TsNodeDescriber<ts.ArrayTypeNode> = (decl, env, tSet) => {
    const res: ICodeSchema = {
        type: 'array',
        items: describeTypeNode(decl.elementType, env, tSet).schema
    };

    return {
        schema: res
    };
};
const describeTuppleTypeNode: TsNodeDescriber<ts.TupleTypeNode> = (decl, env, tSet) => {
    const res: ICodeSchema = {
        type: 'array',
        items: [...decl.elementTypes.map(item=>describeTypeNode(item, env, tSet).schema)]
    };

    return {
        schema: res
    };
};

const describeIntersectionType: TsNodeDescriber<ts.IntersectionTypeNode> = (decl, env, tSet) => {
    const schemas: ICodeSchema[] = decl.types.map(t => {
        return describeTypeNode(t, env, tSet).schema;
    });
    const res: ICodeSchema = {
        allOf: schemas
    };

    return {
        schema: res
    };
};

const describeUnionType: TsNodeDescriber<ts.UnionTypeNode> = (decl, env, tSet) => {
    const schemas: ICodeSchema[] = decl.types.map(t => {
        return describeTypeNode(t, env, tSet).schema;
    });
    const groupedSchemas: ICodeSchema[] = [];
    let specificString: ICodeSchema | undefined;
    let specificNumber: ICodeSchema | undefined;
    let specificBool: ICodeSchema | undefined;
    schemas.forEach(s => {
        if (s.type === 'string' && s.enum) {
            specificString = specificString || {
                type: 'string',
                enum: []
            };
            specificString.enum = specificString.enum!.concat(s.enum);
        } else if (s.type === 'number' && s.enum) {
            specificNumber = specificNumber || {
                type: 'number',
                enum: []
            };
            specificNumber.enum = specificNumber.enum!.concat(s.enum);
        } else if (s.type === 'boolean' && s.enum) {
            specificBool = specificBool || {
                type: 'boolean',
                enum: []
            };
            specificBool.enum = specificBool.enum!.concat(s.enum);
        } else {
            groupedSchemas.push(s);
        }
    });
    if (specificString) {
        groupedSchemas.push(specificString);
    }

    if (specificNumber) {
        groupedSchemas.push(specificNumber);
    }

    if (specificBool) {
        if (specificBool.enum!.length > 1) {
            groupedSchemas.push({ type: 'boolean' });
        } else {
            groupedSchemas.push(specificBool);
        }
    }

    if (groupedSchemas.length > 1) {
        return {
            schema: {
                oneOf: groupedSchemas
            }
        };
    }
    return {
        schema: groupedSchemas[0] || {}
    };
};

function isUnionType(t: ts.Type): t is ts.UnionType {
    return !!(t as any).types;
}

function removeExtension(pathName: string, pathUtil: IFileSystemPath): string {
    return pathName.slice(0, pathUtil.extname(pathName).length * -1);
}

const supportedPrimitives = ['string', 'number', 'boolean'];
function serializeType(
    t: ts.Type,
    rootNode: ts.Node,
    env: IEnv,
    circularSet?: Set<string>,
    memoMap = new Map(),
    typeParams?: Map<ts.TypeParameter, string> 
): { schema: ICodeSchema } {
    const checker = env.checker;
    if(typeParams && typeParams.has(t)){
        return {
            schema: {
                $ref: typeParams.get(t)!
            }
        };
    }
    if (t.aliasSymbol) {
        return {
            schema: {
                $ref: '#' + t.aliasSymbol.name
            }
        };
    } else if (t.symbol) {
        const node = getNode(t.symbol);

        if (
            node &&
            (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
        ) {
            const sourceFile = node.getSourceFile();
            const fileName = sourceFile.fileName;
            const currentFileName = rootNode.getSourceFile().fileName;
            const symbolName = checker.symbolToString(t.symbol, sourceFile);

            if (fileName !== currentFileName) {
                const fileNameNoExt = removeExtension(fileName, env.pathUtil);
                const pathInProj = fileNameNoExt.includes('node_modules')
                    ? fileNameNoExt
                    : fileNameNoExt.slice(env.projectPath.length);
                env.dependencies.add(pathInProj);
                return {
                    schema: {
                        $ref: pathInProj + '#' + symbolName
                    }
                };
            }

            return {
                schema: {
                    $ref: '#' + symbolName
                }
            };
        }
    }
    const typeString = checker.typeToString(t);
    if (supportedPrimitives.includes(typeString)) {
        return {
            schema: {
                type: typeString as any
            }
        };
    }

    if (isUnionType(t)) {
        return {
            schema: {
                oneOf: t.types.map(tt => serializeType(tt, rootNode, env, circularSet, memoMap).schema)
            }
        };
    }
    if (typeString === 'null') {
        return {
            schema: {
                $ref: NullSchemaId
            }
        };
    }
    if (typeString === 'undefined' || typeString === 'void') {
        return {
            schema: {
                $ref: UndefinedSchemaId
            }
        };
    }
    if (typeString === 'any') {
        return {
            schema: {}
        };
    }

    if (typeString.startsWith('"')) {
        return {
            schema: {
                type: 'string',

                enum: [typeString.slice(1, -1)]
            }
        };
    }

    if (!isNaN(parseFloat(typeString))) {
        return {
            schema: {
                type: 'number',
                enum: [parseFloat(typeString)]
            }
        };
    }

    if (typeString === 'true' || typeString === 'false') {
        return {
            schema: {
                type: 'boolean',
                enum: [typeString === 'true']
            }
        };
    }

    // currently we support only one call signature
    const signatures = t.getCallSignatures();
    if (signatures.length) {
        const signature = signatures[0];
        const required: string[] = [];
        let restSchema: ICodeSchema | undefined;
        const funcArguments = [];
        const paramsMap: Map<ts.TypeParameter, string> = new Map();
        const typeParameters = signature.getTypeParameters();
        let genericParamsInfo: ICodeSchema[] | null = null;
        if(typeParameters){
            genericParamsInfo = [];
            for(const param of typeParameters){
                const symb = param.getSymbol()!;
                const node = getNode(symb) as ts.TypeParameterDeclaration;
                paramsMap.set(param, getGenericParamRef(symb, node));
                const constraint = param.getConstraint();
                const parameterType: ICodeSchema = constraint ? serializeType(constraint, rootNode, env, circularSet, memoMap).schema : {};
                parameterType.name = symb.name;
                genericParamsInfo.push(parameterType);
            }
        }
        for (const p of signature.getParameters()) {
            const pNode = getNode(p)!;
            const pName = p.getEscapedName() as string;
            if (ts.isParameter(pNode)) {
                const arg = describeVariableDeclaration(pNode, env);
                arg.schema.name = pName;
                const tags = ts.getJSDocParameterTags(pNode);
                const tag = tags && tags.length ? tags.map(pTag => pTag.comment).join('') : '';
                if (tag) {
                    arg.schema.description = tag;
                }
                if (pNode.dotDotDotToken) {
                    restSchema = arg.schema;
                } else {
                    funcArguments.push(arg.schema);
                    if (arg.required) {
                        required.push(p.getEscapedName() as string);
                    }
                }
            } else {
                const pType = checker.getTypeOfSymbolAtLocation(p, rootNode);
                const arg = serializeType(pType, rootNode, env, circularSet, memoMap, typeParams).schema;
                arg.name = pName;
                return { schema: arg };
            }
        }
        // tslint:disable-next-line:no-shadowed-variable
        const res: IFunctionSchema = {
            $ref: FunctionSchemaId,
            returns: serializeType(signature.getReturnType(), rootNode, env, circularSet, memoMap, paramsMap).schema,
            arguments: funcArguments,
            requiredArguments: required
        };
        if(genericParamsInfo){
            res.genericParams = genericParamsInfo;
        }
        if (restSchema) {
            res.restArgument = restSchema;
        }
        return {
            schema: res
        };
    }

    if (typeString.startsWith('{')) {
        const properties = checker.getPropertiesOfType(t);

        const res: ICodeSchema = {
            type: 'object',
            properties: {},
            required: []
        };

        if (properties.length) {
            for (const prop of properties) {
                const fieldType = checker.getTypeOfSymbolAtLocation(prop, rootNode);
                const propName = prop.getName();
                const cSet = circularSet ? new Set(circularSet) : new Set();
                if (!memoMap.has(propName)) {
                    if (circularSet && circularSet.has(propName)) {
                        res.properties![propName] = { $ref: '#' + propName };
                        break;
                    }
                    cSet.add(propName);
                    memoMap.set(propName, serializeType(fieldType, rootNode, env, cSet, memoMap).schema);
                    res.properties![propName] = memoMap.get(propName);
                }
                res.properties![propName] = memoMap.get(propName);
                res.required!.push(prop.getName());
            }
        }

        const indexType = checker.getIndexTypeOfType(t, ts.IndexKind.String);
        if (indexType) {
            res.additionalProperties = serializeType(indexType, rootNode, env, circularSet, memoMap).schema;
        }
        return { schema: res };
    }

    if (typeString) {
        return {
            schema: { $ref: '#' + typeString }
        };
    }

    return {
        schema: { $ref: UndefinedSchemaId }
    };
}

function getGenericParams(
    decl: ts.SignatureDeclaration | ts.ClassLikeDeclaration | ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
    env: IEnv
): ICodeSchema[] | undefined {
    if (decl.typeParameters) {
        return decl.typeParameters.map(t => {
            const r: ICodeSchema = {};
            r.name = t.name.getText();
            if (t.constraint) {
                r.type = serializeType(env.checker.getTypeAtLocation(t.constraint!), t, env).schema.type;
            }
            return r;
        });
    }
    return;
}

function hasModifier(node: ts.Node, modifier: number): boolean {
    return !!(
        node.modifiers &&
        node.modifiers.find(m => {
            return m.kind === modifier;
        })
    );
}

function extraCommentsHack(node: ts.Node): ts.JSDoc | undefined {
    return (node as any).jsDoc ? (node as any).jsDoc[0] : undefined;
}

function addJsDocsTagsToSchema(tags: ts.JSDocTag[], schema: ICodeSchema) {
    if (tags.length) {
        for (const tag of tags) {
            if (tag.comment) {
                (schema as any)[tag.tagName.escapedText as any] = isNaN(parseFloat(tag.comment))
                    ? tag.comment
                    : parseFloat(tag.comment);
            }
        }
    }
}

export function getSchemaFromImport(
    importPath: string,
    ref: string,
    program: ts.Program,
    pathUtil: IFileSystemPath,
    sourceFile?: ts.SourceFile
): IModuleSchema | null {
    const extensions = ['.js', '.d.ts', '.ts', '.tsx'];
    const checker = program.getTypeChecker();
    let importSourceFile;
    if (sourceFile) {
        /* resolvedModules is an internal ts property that exists on a sourcefile and maps the imports to the path of the imported file
         * This can change in future versions without us knowing but there is no public way of getting this information right now.
         */
        const module = (sourceFile as any).resolvedModules && (sourceFile as any).resolvedModules.get(importPath);
        if (module) {
            const newRef = module.resolvedFileName;
            importSourceFile = program.getSourceFile(newRef);
            if (importSourceFile) {
                return transform(checker, importSourceFile, importPath + ref, importPath, pathUtil);
            }
        }
    }
    for (const extension of extensions) {
        importSourceFile = program.getSourceFile(importPath + extension);
        if (importSourceFile) {
            break;
        }
    }
    if (!importSourceFile) {
        return null;
    }
    return transform(checker, importSourceFile, importPath + ref, importPath, pathUtil);
}

// This is to handle circular types
function checkCircularType(tSet: Set<ts.Node> | undefined, decl: ts.Node) {
    let res;
    if (tSet && tSet.has(decl)) {
        const typeName = (decl as any).name
            ? (decl as any).name.getText()
            : (decl.parent as any).name
                ? (decl.parent as any).name.getText()
                : decl.getText();
        res = { schema: { $ref: '#' + typeName } } as any;
    }
    const cSet = tSet ? new Set(tSet) : new Set();
    cSet.add(decl);
    return { set: cSet, result: res };
}
