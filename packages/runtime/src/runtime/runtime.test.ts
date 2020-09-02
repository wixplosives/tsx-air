import { testRuntimeApi } from './runtime.test.suite';
import { CompiledParent, CompiledChild } from '../../../runtime/fixtures/runtime.compiled';

describe('runtime with manually compiled', () =>{
    testRuntimeApi(() => [CompiledParent, CompiledChild]);
});
