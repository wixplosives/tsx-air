import { cClass, FileTransformerAPI, CompDefinition, cStatic, astTemplate, cArrow, asAst, asCode } from '@tsx-air/compiler-utils';
import { generatePreRender } from './prerender';
import { generateMethods } from './function';
import { factory } from './factory';
import { generateFragments } from './fragment';
import ts from 'typescript';
import { parseFragments } from './fragment/jsx.fragment';

export const generateComponentClass = (comp: CompDefinition, api: FileTransformerAPI) => {
    const importedComponent = api.ensureImport('Component', '@tsx-air/framework');
    const fragments = [...parseFragments(comp)];
    const compClass = cClass(
        comp.name!,
        importedComponent,
        undefined,
        [
            cStatic('factory', factory(comp)),
            ...generateMethods(comp, fragments),
            generatePreRender(comp, fragments),
        ]
    );
    const createClass = cArrow([], [
        compClass,
        ...generateFragments(comp, api, fragments),
        ts.createReturn(ts.createIdentifier(comp.name))
    ]);

    // console.log(asCode(createClass));
    const f =  exportClass(createClass)
    
    console.log(asCode(f));
    return f;
};

const exportClass = (createClass:ts.Node) => 
ts.createVariableStatement(
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createVariableDeclarationList(
      [ts.createVariableDeclaration(
        ts.createIdentifier("Child"),
        undefined,
        ts.createCall(
            createClass as ts.Expression, undefined, undefined
        )
      )],
      ts.NodeFlags.Const
    )
  )
  