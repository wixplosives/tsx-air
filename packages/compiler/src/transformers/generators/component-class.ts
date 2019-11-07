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

        return `if (changeMap & ${metadata.name}.changeBitmask.${prop}) {
                ${
            expressions.map(i => `${i!.nodeBinding.name}.textContent=` +
                // @ts-ignore
                `${i!.nodeBinding.node.expression.getText().replace(props, 'newProps')}`)
            }
                ${
            components.map(
                //
                i => i.length ? `runtime.updateProps(this.context.${i![0]!.nodeBinding.name},p => {
<<<<<<< HEAD
                            ${i.map(p =>
                    `p.${p!.compPropName} = newProps.${prop};`).join('\n')}                                                      
=======
                            ${i.map(p => 
                                `p.${p!.compPropName} = newProps.${prop};`).join('\n')}                                                      
>>>>>>> 98cb72045a47edda69f9b1c5588411038d18594e
                            return ${i.map(p => `${p!.compName}.changeBitmask.${p!.compPropName}`).join('|')};
                        });` : '')
            }
            }`;

    }).join(';\n')
    }
}`;

const getAffectedExpressions = (prop: string, dom: DomBinding[], metadata: TSXAirData) => dom.map(n => {
    if (!isJsxExpression(n.node!)) {
        return;
    }
    const used = find(n.node!, nd => isPropertyAccessExpression(nd) &&
        nd.expression.getText() === metadata.propsIdentifier &&
        nd.name.getText() === prop);
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
            const compName = n.node && getComponentTag(n.node);
            if (!compName) {
                return;
            }
            const attributes = isJsxSelfClosingElement(n.node!)
                ? n.node.attributes
                : (n.node as JsxElement).openingElement.attributes;

            return attributes.properties.map(att => {
                const usage = find(attributes, nd => isPropertyAccessExpression(nd) &&
                    nd.expression.getText() === metadata.propsIdentifier &&
                    nd.name.getText() === prop);
                if (usage) {
                    return {
                        prop,
                        nodeBinding: n,
                        compName,
                        compPropName: att.name!.getText()
                    };
                }
                return;
            }).filter(i => i);
        }).filter(i => i), 'nodeBinding').filter(i => i.length);
