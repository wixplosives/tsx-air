import { CompiledParent as Parent, CompiledChild as Child } from "../../fixures/runtime.compiled";
import { testRuntimeApi } from "./runtime.test.suite";

describe('runtime with manually compiled', () =>{
    testRuntimeApi(Parent,Child);
});
