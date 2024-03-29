import { Component, VirtualElement, Displayable } from '.';
import { Runtime } from '..';
import { store } from './store';

type CommentPlaceholder = 'X' | 'E' | 'C';

export class Fragment extends Displayable {
    public static is(x: any): x is Fragment {
        return x && x instanceof Fragment;
    }
    public static isType(x: any): x is typeof Fragment {
        return x.prototype instanceof Fragment;
    }

    constructor(
        key: string,
        parent: Displayable,
        runtime: Runtime
    ) {
        const _owner = Component.is(parent) ? parent : parent.owner;
        if (!_owner) {
            throw new Error('Invalid fragment: no owner component');
        }
        super(key, parent, runtime);
        store(this, '$props', parent.props);
    }

    public updateView(): void {/* */ }

    public hydrateExpressions(values: any[], target: HTMLElement) {
        return this.hydrateInternals(values, target, 'X',
            (v: any, t: Comment) =>
                this.ctx.expressions.push(
                    this.$rt.renderer.hydrateExpression(v, t)));
    }

    public hydrateComponents(virtualComps: VirtualElement[], target: HTMLElement) {
        this.hydrateInternals(virtualComps, target, 'C',
            (c: VirtualElement, t: Comment) =>
                this.$rt.renderer.hydrate(c, t.nextElementSibling as HTMLElement));
    }

    public hydrateElements(target: HTMLElement) {
        target.parentNode?.querySelectorAll(`[x-da="${this.fullKey}"]`).forEach(e => this.ctx.elements.push(e as HTMLElement));
    }

    public comment(index: number, type: CommentPlaceholder) {
        return `<!--${this.fullKey}${type}${index}-->`;
    }

    public attribute(_: number) {
        return `x-da="${this.fullKey}"`;
    }

    public unique(str: string) {
        return this.withUniq(
            this.withUniq(str,
                '<!--X-->', (i: number) => this.comment(i, 'X')),
            '<!--C-->', (i: number) => this.comment(i, 'C'))
            .replace(/x-da="!"/g, `x-da="${this.fullKey}"`);
    }

    private hydrateInternals(values: any[], target: HTMLElement, type: CommentPlaceholder, hydrateFunc: (v: any, c: Comment) => void): void {
        let expressionIndex = 0;
        let inExpressionString = false;
        const { document, window } = this.$rt;
        // @ts-ignore
        const { NodeFilter } = window;

        const comments = document.createNodeIterator(target, NodeFilter.SHOW_COMMENT, {
            acceptNode: (node: any) => {
                if (inExpressionString) {
                    if (`<!--${node.textContent}-->` === this.comment(expressionIndex, type)) {
                        expressionIndex++;
                        inExpressionString = false;
                        return NodeFilter.FILTER_REJECT;
                    } else {
                        return NodeFilter.FILTER_SKIP;
                    }
                } else {
                    if (`<!--${node.textContent}-->` === this.comment(expressionIndex, type)) {
                        inExpressionString = true;
                        return NodeFilter.FILTER_ACCEPT;
                    } else {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            }
        });

        values.forEach(v => hydrateFunc(v, comments.nextNode() as Comment));
    }

    private withUniq(str: string, placeholder: string, replace: (i: number) => string, withTrailing = true): string {
        const src = str.split(placeholder);
        const res = [];
        let expCount = 0;
        let skipNext = true;
        for (const chunk of src) {
            if (!skipNext) {
                const comment = replace(expCount++);
                res.push(comment);
                res.push(chunk);
                withTrailing && res.push(comment);
            } else {
                res.push(chunk);
            }
            skipNext = !skipNext;
        }
        return res.join('');
    }
}