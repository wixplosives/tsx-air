import ts from 'typescript';
import { createMemoryFs } from '@file-services/memory';
import { createBaseHost, createLanguageServiceHost } from '@file-services/typescript';
import { compilerOptions } from './constants';
import { IDirectoryContents } from '@file-services/types';
import { typescriptRecipe } from './recipes/typescript';
import { reactRecipe } from './recipes/react';

export async function createTsService(
    contents: IDirectoryContents,
    rootFiles: string[],
    includeRecipes: boolean = false
) {
    const fs = createMemoryFs(contents);

    const openFiles = new Set(rootFiles);
    const openFile = (path: string) => {
        if (openFiles.has(path)) {
            throw new Error('file is already open: ' + path);
        }
        openFiles.add(path);
    };
    const closeFile = (path: string) => {
        if (!openFiles.has(path)) {
            throw new Error('file is not open' + path);
        }
        openFiles.delete(path);
    };
    const getOpenFiles = () => new Set(openFiles);

    if (includeRecipes) {
        fs.populateDirectorySync('/', typescriptRecipe);
        fs.populateDirectorySync('/', reactRecipe);
    }

    const baseHost = createBaseHost(fs);

    const tsHost = createLanguageServiceHost(
        baseHost,
        () => rootFiles,
        () => compilerOptions,
        '/node_modules/typescript/lib'
    );

    const tsService = ts.createLanguageService(tsHost);

    return {
        baseHost,
        fs,
        tsHost,
        openFile,
        closeFile,
        getOpenFiles,
        tsService
    };
}
