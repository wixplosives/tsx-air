import { bitMask } from '../helpers';
import { CompDefinition, CompProps, JsxExpression, isJsxExpression } from '../../analyzers/types';
import { DomBinding } from './component-common';

export const compClass = (dom: DomBinding[], def: CompDefinition) => {
    const mask = bitMask(def);
    const propsIdentifierRegExp = new RegExp(`(?<![\\d\\w])(${def.propsIdentifier})`, 'g');

    const usedComps = def.jsxRoots[0].components.length ? `const ${def.jsxRoots[0].components.map(({name:n}) => n+'=exports.'+n).join()};` :'';
    return `
    ${usedComps}
    class ${def.name}{
        constructor(public readonly context){}
       ${processUpdate()}
    }
    ${def.name}.changeBitmask=${JSON.stringify(mask)};`;


    function processUpdate() {
        return `public $$processUpdate(newProps, newState, changeMap) {
            ${def.usedProps.map(handlePropChange)}
        }`;
    }

    function handlePropChange(prop: CompProps) {
        return `if (changeMap & ${def.name}.changeBitmask.${prop.name}){
            ${handlePropExpressions(prop).join('\n')}
            ${handlePropComp(prop).join('\n')}
        }`;
    }

    function handlePropExpressions(prop: CompProps): string[] {
        return def.jsxRoots[0].expressions
            .filter(ex => ex.dependencies.includes(prop))
            .map(ex => ({ ex, dm: dom.find(dm => dm.astNode === ex.sourceAstNode)! }))
            .map(({ ex, dm }) => `this.context.${dm.ctxName}.textContent = ${replaceProps(ex.expression, 'newProps')};`);
        // TODO: update html attributes
    }

    function handlePropComp(prop: CompProps): string[] {
        const comps = def.jsxRoots[0].components
            .filter(c => c.dependencies.includes(prop));

        return comps.map(comp => {
            const props = comp.props.filter(p => isJsxExpression(p.value));
            const ctxName = dom.find(c => c.astNode === comp.sourceAstNode)!.ctxName;
            const update = props.reduce((ret, p) => `${ret}p.${p.name} = ${replaceProps((p.value as JsxExpression).expression, 'newProps')};\n`, '');
            const changed = props.reduce((ret, p) => `${ret && ret + '|'}${comp.name}.changeBitmask.${p.name}`, '');

            return `runtime.updateProps(this.context.${ctxName} , p => {
                ${update}
                return ${changed};
            });`;
            // TODO: update children
        });
    }

    function replaceProps(exp: string, replacePropsWith: string = 'p') {
        return exp.replace(propsIdentifierRegExp, replacePropsWith);
    }
};