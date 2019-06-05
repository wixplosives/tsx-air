import ts from 'typescript';
declare module 'typescript'{
    interface TypeChecker{
        isArray(type: ts.Type): boolean;
    }
}