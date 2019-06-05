import { transform } from '../src/file-transformer';
import { IModuleSchema } from '../src/json-schema-types';
import { createTsService } from './typescript/createMemoryTsService';

export async function transformTest(
    source: string,
    moduleId: string,
    fileName = 'tested-module.ts'
): Promise<IModuleSchema> {
    const projectName = 'someProject';
    const testedFile = `/${projectName}/src/${fileName}`;
    const fixture = `
    export type AType  = {a:string};
    export class AClass{

    }
    export class AGenericClass<T,Q>{

    }`;
    const { tsService, fs } = await createTsService(
        {
            [projectName]: {
                src: {
                    [fileName]: source,
                    'test-assets.ts': fixture
                }
            }
        },
        [testedFile, projectName + '/src/test-assets.ts'],
        true
    );
    const program = tsService.getProgram();

    if (!program) {
        throw new Error(`transformTest: cannot retrieve Program for ${moduleId}`);
    }

    const chckr = program.getTypeChecker();
    return transform(chckr, program.getSourceFile(testedFile)!, '/src/' + moduleId, '/' + projectName, fs.path);
}
