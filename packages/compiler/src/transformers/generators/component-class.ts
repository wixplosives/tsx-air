import { getComponentTag } from './../../visitors/jsx';
import { DomBinding } from './component-common';
import { TSXAirData } from '../../visitors/tsxair';
import { find } from '../../astUtils/scanner';
import { isPropertyAccessExpression, isJsxExpression, JsxElement, isJsxSelfClosingElement } from 'typescript';
import { flatMap, partition } from 'lodash';

export const compClass = (dom: DomBinding[], metadata: TSXAirData) => {
    const { name } = metadata;
    return `
    class ${name}{
       ${processUpdate(dom, metadata)}
    }`;
};

const processUpdate = (dom: DomBinding[], metadata: TSXAirData) => `public $$processUpdate(newProps, newState, changeMap) {
    ${
    metadata.usedProps.map(prop => {
        const expressions = getAffectedExpressions(prop, dom, metadata);
        const components = getAffectedComponents(prop, dom, metadata);
        const props = new RegExp(`(?<![\\d\\w])(${metadata.propsIdentifier})`, 'g');

        return `if (changeMap & ${metadata.name}.changeBitmask.${prop.trim()}) {
                ${
            expressions.map(i => `${i!.nodeBinding.ctxName}.textContent=` +
                // @ts-ignore
                `${i && i.nodeBinding && i.nodeBinding.astNode && i.nodeBinding.astNode.expression && i.nodeBinding.astNode.expression.getText().replace(props, 'newProps') || ''}`)}
                ${
            components.map(
                i => i.length ? `runtime.updateProps(this.context.${i![0]!.nodeBinding.ctxName},p => {
                            ${i.map(p =>
                    `p.${p!.compPropName} = newProps.${prop};`).join('\n')}                                                      
                            return ${i.map(p => `${p!.compName}.changeBitmask.${p!.compPropName}`).join('|')};
                        });` : '')
            }
            }`;
    }).join(';\n')
    }
}`;

const getAffectedExpressions = (prop: string, dom: DomBinding[], metadata: TSXAirData) => dom.map(n => {
    if (!isJsxExpression(n.astNode!)) {
        return;
    }
    const used = find(n.astNode!, nd => isPropertyAccessExpression(nd) &&
        nd.expression.getText() === metadata.propsIdentifier &&
        nd.name.getText().trim() === prop);
    if (used) {
        return {
            prop,
            nodeBinding: n
        };
    }
    return;
}).filter(i => i);

const getAffectedComponents = (prop: string, dom: DomBinding[], metadata: TSXAirData) =>
    partition(
        flatMap(dom, n => {
            const compName = n.astNode && getComponentTag(n.astNode);
            if (!compName) {
                return;
            }
            const attributes = isJsxSelfClosingElement(n.astNode!)
                ? n.astNode.attributes
                : (n.astNode as JsxElement).openingElement.attributes;

            return attributes.properties.map(att => {
                const usage = find(attributes, nd => isPropertyAccessExpression(nd) &&
                    nd.expression.getText() === metadata.propsIdentifier &&
                    nd.name.getText() === prop);
                if (usage) {
                    return {
                        prop,
                        nodeBinding: n,
                        compName,
                        compPropName: att.name!.getText().trim()
                    };
                }
                return;
            }).filter(i => i);
        }).filter(i => i), 'nodeBinding').filter(i => i.length);
