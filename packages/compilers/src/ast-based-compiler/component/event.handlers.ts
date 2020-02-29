import { getAttrName } from './../../common/jsx.event.handler';
import { CompDefinition,  FuncDefinition, JsxExpression, cCall, cAccess, cMethod, cProperty, cBind } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { generateStateAwareMethod } from './function';
import { isEventHandler, findBinding } from '../../common/jsx.event.handler';
import { safely, nonEmptyStr } from '@tsx-air/utils';
import { camelCase } from 'lodash';
import { DomBindings, DomBinding } from '../../common/dom.binding';

export function* eventHandlers(comp: CompDefinition, domBinding: DomBindings) {
    const handlers = findHandlersUsed(comp);
    for (const [handler] of handlers) {
        const name = safely(() => handler.name!, 'Unknown event name', i => !!i);
        yield generateStateAwareMethod(comp, handler);
        yield cProperty(name, cBind(`_${name}`));
    }
    if (handlers.size > 0) {
        yield cMethod('$afterMount', [], generateAfterMount(handlers, domBinding));
    }
}

const generateAfterMount = (handlers: Handlers, domBinding: DomBindings) => {
    function* addListeners() {
        for (const [handler, uses] of handlers) {
            for (const usage of uses) {
                const binding = findBinding(usage, domBinding);
                if (binding) {
                    yield generateAddListener(binding, nonEmptyStr(getAttrName(usage), 'event name'), handler);
                }
            }
        }
    }
    return ts.createBlock([...addListeners()]);
};

const generateAddListener = (dom: DomBinding, event: string, handler: FuncDefinition) =>
    ts.createExpressionStatement(
        cCall(
            ['this', 'context', dom.ctxName, 'addEventListener'],
            [
                ts.createStringLiteral(camelCase(event.replace(/^on/, ''))),
                cAccess('this', handler.name!)
            ]));

type Handlers = Map<FuncDefinition, JsxExpression[]>;

const findHandlersUsed = (comp: CompDefinition) => {
    const expressionsWithHandlers =
        comp.jsxRoots[0].expressions.filter(isEventHandler);

    const handlersToUses = new Map<FuncDefinition, JsxExpression[]>();
    const missingHandlers = new Set(expressionsWithHandlers);
    comp.functions.forEach(f => {
        const uses = expressionsWithHandlers.filter(({ expression }) =>
            expression.indexOf(f.name!) >= 0);
        if (uses.length) {
            handlersToUses.set(f, uses);
            uses.forEach(e => missingHandlers.delete(e));
        }
    });
    // if (missingHandlers.size > 0) {
    //     throw new Error(`Missing handler${missingHandlers.size > 1 ? 's' : ''}: ${
    //         [...missingHandlers.values()].map(e => e.expression).join(',')
    //         }`);
    // }
    for (const missing in missingHandlers) {
        
    }
    return handlersToUses;
};
