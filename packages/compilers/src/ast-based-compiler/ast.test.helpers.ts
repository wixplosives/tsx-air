import { cClass } from '@tsx-air/compiler-utils';
import ts from 'typescript';

export const asClass = (method:ts.MethodDeclaration) => cClass('', undefined, undefined, [method]);