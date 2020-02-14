import { CompDefinition, cProperty, DomBinding, cArrow, FuncDefinition, JsxExpression } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { generateStateAwareFunction } from './function';
import { isEventHandler, getAttrName, findBinding } from '../../common/jsx.event.handler';
import { safely } from '@tsx-air/utils';


export function* eventHandlers(comp: CompDefinition, domBinding: DomBinding[]) {
    const handlers = findHandlersUsed(comp);
    for (const [handler, uses] of handlers) {
        yield cProperty(safely(
            () => getAttrName(uses[0]) || '', 'Unknown event name', i => !!i)
            , generateStateAwareFunction(comp, handler));
    }
    if (handlers.size > 0) {
        yield cProperty('$afterMount', generateAfterMount(comp, handlers, domBinding));
    }
}

const generateAfterMount = (comp: CompDefinition,
    handlers: Map<FuncDefinition, JsxExpression[]>,
    domBinding: DomBinding[]) => {
    function* addListeners() {
        for (const [, uses] of handlers) {
            for (const usage of uses) {
                const binding = findBinding(usage, domBinding);
                if (binding) {
                    yield generateAddListener();
                }
            }
        }
    }
    return cArrow([], ts.createBlock([...addListeners()]));
};

const generateAddListener = () => ts.createExpressionStatement(ts.createCall(
    ts.createPropertyAccess(
        ts.createPropertyAccess(
            ts.createPropertyAccess(
                ts.createThis(),
                ts.createIdentifier('context')
            ),
            ts.createIdentifier('root')
        ),
        ts.createIdentifier('addEventListener')
    ),
    undefined,
    [
        ts.createStringLiteral('click'),
        ts.createPropertyAccess(
            ts.createThis(),
            ts.createIdentifier('onClick')
        )
    ]
));

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
    if (missingHandlers.size > 0) {
        throw new Error(`Missing handler${missingHandlers.size > 1 ? 's' : ''}: ${
            [...missingHandlers.values()].join(',')
            }`);
    }
    return handlersToUses;
};
