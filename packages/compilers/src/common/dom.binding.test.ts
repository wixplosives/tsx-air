import { analyze, parseValue, CompDefinition, generateDomBindings } from '@tsx-air/compiler-utils';

describe('generateDomBindings', () => {
    it('assigns a binding to dynamic DOM elements', () => {
        const comp = analyze(parseValue(`TSXAir((p:{a:number}) => 
            <div>TsxAir Component</div>))`)).tsxAir as CompDefinition;
        const binding = generateDomBindings(comp);
        
    });
});