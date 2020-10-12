import { FuncDefinition, JsxExpression } from '@tsx-air/compiler-utils';
import { isEventHandler } from '../../common/jsx.event.handler';
import { postAnalysisData } from '../../common/post.analysis.data';
import { FragmentData } from './fragment/jsx.fragment';

export const tagHandlersUsed = (fragment:FragmentData) => {
    const expressionsWithHandlers =
        fragment.root.expressions.filter(isEventHandler);

    const handlersToUses = new Map<FuncDefinition, JsxExpression[]>();
    const missingHandlers = new Set(expressionsWithHandlers);
    fragment.code.functions.forEach(f => {
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
