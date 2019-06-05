import { createTsService } from './typescript/createMemoryTsService';
import { IDirectoryContents } from '@file-services/types';
import { ICodeSchema, IModuleSchema } from '../src/json-schema-types';
import { SchemaLinker, IExtractor } from '../src/file-linker';
import { transform, getSchemaFromImport } from '../src/file-transformer';

export async function linkTest(
    sourceDir: IDirectoryContents,
    entityName: string,
    fileName: string
): Promise<ICodeSchema> {
    const projectName = 'someProject';
    const projectPath = `/${projectName}`;
    const testedPath = projectPath + '/src/';
    const testedFile = testedPath + fileName;
    const { tsService, fs } = await createTsService(
        {
            [projectName]: {
                src: sourceDir
            }
        },
        [testedFile]
    );
    const prg = tsService.getProgram()!;
    function getSchema(file: string): IModuleSchema {
        const sourceFile = prg.getSourceFile(file);
        if (!sourceFile) {
            return {
                $id: file,
                $ref: 'common/module',
                properties: {},
                definitions: {},
                moduleDependencies: []
            };
        }
        return transform(prg.getTypeChecker(), sourceFile, file, projectPath, fs.path);
    }
    function getImport(importPath: string, ref: string, file: string) {
        return getSchemaFromImport(importPath, ref, prg, fs.path, prg.getSourceFile(file));
    }
    const extractor: IExtractor = {
        getSchema,
        getSchemaFromImport: getImport
    };
    const linker = new SchemaLinker(extractor);

    return linker.flatten(testedFile, entityName);
}
