import { CompDefinition, cStatic, FileTransformerAPI, astTemplate, asAst } from "@tsx-air/compiler-utils";
import { parseFragments, FragmentData } from "./jsx.fragment";
import { generateFragmentClass } from "./fragment.class";
import ts from "typescript";

export function* generateFragments(comp: CompDefinition, api: FileTransformerAPI, fragments:FragmentData[]) {
    for (const fragment of fragments) {
        if (!fragment.isComponent){
            yield generateFragmentClass(comp, fragment, api);
            yield asAst(`${comp.name}.${fragment.id}=${fragment.id}`) as ts.Statement;
        }
    }
}