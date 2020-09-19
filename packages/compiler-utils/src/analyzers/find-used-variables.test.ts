// tslint:disable: no-unused-expression
import { UsedVariables, RecursiveMap } from './types';
import { parseValue, asSourceFile } from '../ast-utils/parser';
import { expect } from 'chai';
import { findUsedVariables as fu } from './find-used-variables';
import '../dev-utils/global-dev-tools';
import ts from 'typescript';
import { scan } from '../ast-utils/scanner';
import { withCodeRefs } from '../dev-utils';
import { omit } from 'lodash';

describe('findUsedVariables', () => {
    // @ts-ignore
    const findUsedVariables = (...args: any[]) => withCodeRefs(fu(...args));

    it('should find defined variables', () => {
        const ast = parseValue(`(aParam)=>{
                const a = 'a';
                /* with leading comment */
                let b = 'b';
                var c = 'c';
            }`);

        expect(findUsedVariables(ast).defined).to.eql({
            aParam: { $refs: ['aParam'] },
            a: { $refs: [`a = 'a'`] },
            b: { $refs: [`b = 'b'`] },
            c: { $refs: [`c = 'c'`] }
        });
    });

    it('should find accessed members', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam.internalObj.property;
                /* with leading comment */
                const b = aParam.internalObj.anotherProperty;
                const c = { val: aParam.field };
            }`);

        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                field: { $refs: [`aParam.field`] },
                internalObj: {
                    property: {
                        $refs: [`aParam.internalObj.property`]
                    },
                    anotherProperty: {
                        $refs: [`aParam.internalObj.anotherProperty`]
                    }
                }
            }
        });

        expect(findUsedVariables(ast).read).to.eql(findUsedVariables(ast).accessed);
    });

    it('should find modified members', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.replacedProperty = aParam.internalObject.accessedProperty;
                /* with leading comment */
                aParam.addedToProperty += 'a';
                aParam.removedFromProperty -= 3;
                aParam.dividedProperty /= 3;
                aParam.multipliedProperty *= 3;
                aParam.increasedProperty++;
                ++aParam.increasedPropertyPre;
                aParam.decreasedProperty--;
                --aParam.decreasedPropertyPre;
            }`);
        const expectedAccessed = {
            aParam: {
                internalObject: {
                    accessedProperty: {
                        $refs: [`aParam.replacedProperty = aParam.internalObject.accessedProperty`]
                    }
                },
                replacedProperty: { $refs: [`aParam.replacedProperty = aParam.internalObject.accessedProperty`] },
                addedToProperty: { $refs: [`aParam.addedToProperty += 'a'`] },
                removedFromProperty: { $refs: [`aParam.removedFromProperty -= 3`] },
                dividedProperty: { $refs: [`aParam.dividedProperty /= 3`] },
                multipliedProperty: { $refs: [`aParam.multipliedProperty *= 3`] },
                increasedProperty: { $refs: [`aParam.increasedProperty++`] },
                increasedPropertyPre: { $refs: [`++aParam.increasedPropertyPre`] },
                decreasedProperty: { $refs: [`aParam.decreasedProperty--`] },
                decreasedPropertyPre: { $refs: [`--aParam.decreasedPropertyPre`] }
            }
        };
        const expectedModified = omit(expectedAccessed, `aParam.internalObject`);
        const expectedRead = omit(expectedAccessed, `aParam.replacedProperty`);

        expect(findUsedVariables(ast).modified, 'modified',).to.eql(expectedModified);
        expect(findUsedVariables(ast).accessed, 'modified members should also be considered as accessed').to.eql(expectedAccessed);
        expect(findUsedVariables(ast).read, 'read').to.eql(expectedRead);
    });

    it('should ignore keys of assigned literals', () => {
        const ast = asSourceFile(`
            export const anObject = {
                title: 'a'
            }
            `);
        const expected: UsedVariables<string> = {
            read: {},
            accessed: {},
            defined: {
                anObject: {
                    $refs: [`anObject = {\n                title: 'a'\n            }`]
                } as RecursiveMap<string>
            },
            executed: {},
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should not include "title"').to.eql(expected);
    });

    it('should find vars in jsx', () => {
        const ast = asSourceFile(`
            export const aJSXRoot = () => <div onClick={onClickHandler}/>
            `);
        const expected: UsedVariables<string> = {
            read: {
                onClickHandler: {
                    $refs: [`{onClickHandler}`]
                } as RecursiveMap<string>
            },
            accessed: {
                onClickHandler: {
                    $refs: [`{onClickHandler}`]
                } as RecursiveMap<string>
            },
            executed: {},
            defined: {
                aJSXRoot: {
                    $refs: [`aJSXRoot = () => <div onClick={onClickHandler}/>`]
                } as RecursiveMap<string>
            },
            modified: {}
        };
        const result = findUsedVariables(ast);
        expect(result, 'Should find the click handler').to.eql(expected);
    });
    it('should ignore reference to html elements and components', () => {
        const ast = asSourceFile(`
            export const aJSXRoot = <div><Comp>hello<Comp></div>
            `);
        const expected: UsedVariables<string> = {
            read: {},
            accessed: {},
            defined: {
                aJSXRoot: {
                    $refs: [`aJSXRoot = <div><Comp>hello<Comp></div>\n            `]
                } as RecursiveMap<string>
            },
            executed: {},
            modified: {}
        };
        expect(findUsedVariables(ast), 'Should not include "Comp" and "div" in accessed').to.eql(expected);
    });
    it('should ignore typescript types', () => {
        const ast = asSourceFile(`
            interface AnInterface{
                title: string;
            }
            type a = 'a' | AnInterface;
            export const b: AnInterface = {
                title: 'a'
            }
            `);
        const expected: UsedVariables<string> = {
            read: {},
            accessed: {},
            defined: {
                b: {
                    $refs: [`b: AnInterface = {\n                title: 'a'\n            }`]
                } as RecursiveMap<string>
            },
            executed: {},
            modified: {}
        };
        const result = findUsedVariables(ast);
        expect(result, 'Should not include "AnInterface"').to.eql(expected);
    });
    it('should mark method calls as access and executed', () => {
        const ast = parseValue(`(aParam)=>{
                aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty);
                aParam.internalObject.methodProperty.name;
            }`);
        expect(
            findUsedVariables(ast).executed, 'methods calls should be added to executed').to.eql({
                aParam: {
                    internalObject: {
                        methodProperty: {
                            $refs: [`aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty)`]
                        }
                    }
                }
            });
        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.methodProperty,
            'methods calls are considered as access'
        ).to.deep.include({ $refs: ['aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty)'] });
        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.accessedProperty,
            'access in call arguments is found'
        ).not.to.be.undefined;
        expect(
            findUsedVariables(ast).accessed.aParam.internalObject.methodProperty.name,
            'methods can also have fields'
        ).not.to.be.undefined;
        expect(findUsedVariables(ast).accessed,
            'accessed'
        ).to.eql({
            aParam: {
                internalObject: {
                    accessedProperty: {
                        $refs: [`aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty)`]
                    },
                    methodProperty: {
                        $refs: [`aParam.internalObject.methodProperty(aParam.internalObject.accessedProperty)`],
                        name: {
                            $refs: [`aParam.internalObject.methodProperty.name;`]
                        }
                    }
                }
            }
        });
    });

    it('should mark reference by literal strings as access', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam['object-with-kebab-case'].internalProperty;
                const b = aParam.internalObject['property-with-kebab-case'];
            }`);

        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                ['object-with-kebab-case']: {
                    internalProperty: {
                        $refs: [`aParam['object-with-kebab-case'].internalProperty`]
                    }
                },
                internalObject: {
                    ['property-with-kebab-case']: {
                        $refs: [`aParam.internalObject['property-with-kebab-case']`]
                    }
                }
            }
        });
    });
    it('finds access to arrays (not including the index)', () => {
        const ast = parseValue(`(aParam)=>{
                const a = aParam.inner[0];
                const b = aParam.inner[0].c;
                const c = aParam.inner[aParam.index];
            }`);

        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                inner: {
                    $refs: [`aParam.inner[0]`,
                        `aParam.inner[0].c`,
                        `aParam.inner[aParam.index]`
                    ]
                },
                index: {
                    $refs: [`aParam.inner[aParam.index]`]
                }
            }
        });
    });

    it('should mark reference by parameters as 2 separate access', () => {
        const ast = parseValue(`(aParam)=>{
                // 'shouldBeIgnored' is ignored because it comes after a dynamic path access 
                const a = aParam.internalObject[aParam.aKey].shouldBeIgnored;
            }`);
        expect(findUsedVariables(ast).accessed).to.eql({
            aParam: {
                internalObject: {
                    $refs: [`aParam.internalObject[aParam.aKey].shouldBeIgnored`]
                },
                aKey: {
                    $refs: [`aParam.internalObject[aParam.aKey].shouldBeIgnored`]
                }
            }
        });
    });

    it('finds destructured vars', () => {
        const func = `(aParam)=>{
            const {a,b} = aParam.internalObject;
            const {internalObject} = aParam;
        }`;
        const ast = parseValue(func);
        const $refs = [`{a,b} = aParam.internalObject`];
        expect(findUsedVariables(ast).read).to.eql({
            aParam: {
                internalObject: {
                    $refs: [`{internalObject} = aParam`],
                    a: { $refs },
                    b: { $refs }
                }
            }
        });
        expect(findUsedVariables(ast).defined).to.eql({
            aParam: { $refs: ['aParam'] },
            internalObject: { $refs: [`{internalObject} = aParam`] },
            a: { $refs },
            b: { $refs }
        });
    });

    it('finds implicit (shorthand/computed) property keys', () => {
        const func = `(aParam)=>{
            const shorthand = 'shorthand';
            const a = { shorthand };
            const b = { [aParam.key]:true };            
        }`;
        const ast = parseValue(func);
        expect(findUsedVariables(ast).read).to.eql({
            shorthand: {
                $refs: [`a = { shorthand }`],
            },
            aParam: {
                key: {
                    $refs: [`b = { [aParam.key]:true }`],
                }
            }
        });
    });

    it('handles assignments of "new" keyword', () => {
        const func = `()=>{
            state.time = new Date().toTimeString();
        }`;
        const ast = parseValue(func);
        const used = findUsedVariables(ast);
        expect(used.modified).to.eql({
            state: {
                time: {
                    $refs: [`state.time = new Date().toTimeString()`]
                }
            }
        });
        expect(used.read).to.eql({});
    });

    xit('finds array-destructured vars', () => {
        const func = `(aParam)=>{
            const [a,b] = aParam.internalObject;
            const c = [aParam]
        }`;
        const ast = parseValue(func);
        const $refs = [`[a,b] = aParam.internalObject`];
        expect(findUsedVariables(ast).read).to.eql({
            aParam: {
                $refs: [`const c = [aParam]`],
                internalObject: {
                    $refs,
                    a: { $refs },
                    b: { $refs }
                }
            }
        });
        expect(findUsedVariables(ast).defined).to.eql({
            aParam: { $refs: ['aParam'] },
            a: { $refs },
            b: { $refs },
            c: { $refs: [`const c = [aParam]`] }
        });
    });

    it('should accept filter function to allow ignoring nodes', () => {
        const ast = parseValue(`( externalMethodsParam )=>{
                const definedInOuterScope = ( internalMethodParam )=>{
                    const definedInInnerScope = externalMethodsParam.aProp;
                };
            }`);

        expect(findUsedVariables(ast, ts.isArrowFunction)).to.eql({
            read: {},
            accessed: {},
            executed: {},
            defined: {
                externalMethodsParam: {
                    $refs: [`externalMethodsParam`]
                },
                definedInOuterScope: {
                    $refs: [`definedInOuterScope = ( internalMethodParam )=>{\n                    const definedInInnerScope = externalMethodsParam.aProp;\n                }`]
                }
            },
            modified: {}
        });

        expect(findUsedVariables(ast)).to.eql({
            read: {
                externalMethodsParam: {
                    aProp: {
                        $refs: [`externalMethodsParam.aProp`]
                    }
                }
            },
            accessed: {
                externalMethodsParam: {
                    aProp: {
                        $refs: [`externalMethodsParam.aProp`]
                    }
                }
            },
            defined: {
                externalMethodsParam: {
                    $refs: [`externalMethodsParam`]
                },
                definedInOuterScope: {
                    $refs: [`definedInOuterScope = ( internalMethodParam )=>{\n                    const definedInInnerScope = externalMethodsParam.aProp;\n                }`]
                },
                internalMethodParam: {
                    $refs: [`internalMethodParam`]
                },
                definedInInnerScope: {
                    $refs: [`definedInInnerScope = externalMethodsParam.aProp`]
                }
            },
            executed: {},
            modified: {}
        });
    });
    it(`finds string template variables`, () => {
        const ast = parseValue('() => `<div dir="${"ltr"}" lang="${props.a}"><span></span></div>`');
        const template = scan(ast, ts.isTemplateExpression)[0].node;
        const used = findUsedVariables(template);

        expect(used).to.eql({
            read: {
                props: {
                    a: {
                        $refs: ['`<div dir="${"ltr"}" lang="${props.a}"><span></span></div>`']
                    }
                }
            },
            accessed: {
                props: {
                    a: {
                        $refs: ['`<div dir="${"ltr"}" lang="${props.a}"><span></span></div>`']
                    }
                }
            },
            executed: {},
            defined: {},
            modified: {}
        });
    });
    it(`find vars of internal functions`, () => {
        const ast = parseValue(`() => memo(() => {
            fetch(\`/meta/\${props.imageId}.json\`)
                .then(r => r.json()).then(meta => state.metaData = meta.hover)
                .catch(() => state.metaData = 'No metadata');
        });`);
        const used = findUsedVariables(ast);

        expect(used).to.deep.include({
            read: {
                meta: {
                    hover: {
                        $refs: [
                            'state.metaData = meta.hover'
                        ]
                    }
                },
                props: {
                    imageId: {
                        $refs: ['`/meta/\${props.imageId}.json`']
                    }
                }
            },
            defined: {
                meta: {
                    $refs: ['meta']
                },
                r: {
                    $refs: ['r']
                }
            },
            modified: {
                state: {
                    metaData: {
                        $refs: [
                            "state.metaData = 'No metadata'",
                            'state.metaData = meta.hover'
                        ]
                    }
                }
            }
        });
    });
});
