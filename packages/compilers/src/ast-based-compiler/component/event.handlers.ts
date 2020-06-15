import { CompDefinition, FuncDefinition, JsxExpression, cCall, cAccess, cMethod } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import { isEventHandler, findBinding, getAttrName } from '../../common/jsx.event.handler';
import { nonEmptyStr } from '@tsx-air/utils';
import camelCase from 'lodash/camelCase';
import { DomBindings, DomBinding } from '../../common/dom.binding';
import { postAnalysisData } from '../../common/post.analysis.data';
import { FragmentData } from './fragment/jsx.fragment';

export function* generateAfterMount(comp: CompDefinition, domBinding: DomBindings) {
    const handlers = tagHandlersUsed(comp);
    if (handlers.size > 0) {
        yield cMethod('$afterMount', [], afterMount(handlers, domBinding));
    }
}

const afterMount = (handlers: Handlers, domBinding: DomBindings) => {
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
                cAccess('this', postAnalysisData.read(handler, 'name')!)
            ]));

type Handlers = Map<FuncDefinition, JsxExpression[]>;

export const tagHandlersUsed = (comp: CompDefinition, fragment:FragmentData) => {
    const expressionsWithHandlers =
        fragment.root.expressions.filter(isEventHandler);

    const handlersToUses = new Map<FuncDefinition, JsxExpression[]>();
    const missingHandlers = new Set(expressionsWithHandlers);
    comp.functions.forEach(f => {
        const uses = expressionsWithHandlers.filter(({ expression, sourceAstNode }) =>
            expression.indexOf(f.name!) >= 0
            || sourceAstNode.expression === f.sourceAstNode
        );
        if (uses.length) {
            handlersToUses.set(f, uses);
            postAnalysisData.write(f, 'handlerOf', uses);            
            uses.forEach(e => {
                missingHandlers.delete(e);
                postAnalysisData.write(e, 'handler', f);
            });
        }
    });

    return handlersToUses;
};
