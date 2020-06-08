import { Displayable } from "./displayable";
import { Component } from "./component";
import { TSXAir } from "..";
import { VirtualElement } from "./virtual.element";

type CommentPlaceholder = 'X' | 'E' | 'C';

export class Fragment extends Displayable {
    static is(x: any): x is Fragment {
        return x && x instanceof Fragment;
    }
    static isType(x: any): x is typeof Fragment {
        return x.prototype instanceof Fragment;
    }

    constructor(
        key: string,
        parent: Displayable
    ) {
        let _owner = Component.is(parent) ? parent : parent.owner;
        if (!_owner) {
            throw new Error('Invalid fragment: no owner component');
        }
        super(key, parent, _owner.props, _owner.state, _owner.volatile);
        // @ts-ignore
        this.changesBitMap = _owner.changesBitMap;
    }
    
    updateView(_changes: number): void { throw new Error(`not implemented`); }

    hydrateExpressions(values: any[], target: HTMLElement) {
        return this.hydrateInternals(values, target, 'X',
            (v: any, t: Comment) => TSXAir.runtime.hydrateExpression(v, t))
    }

    hydrateComponents(virtualComps: VirtualElement[], target: HTMLElement) {
        return this.hydrateInternals(virtualComps, target, 'C',
            (c: VirtualElement, t: Comment) => TSXAir.runtime.hydrate(c, t.nextElementSibling as HTMLElement))
    }

    private hydrateInternals(values: any[], target: HTMLElement, type: CommentPlaceholder, hydrateFunc: Function): void {
        let expressionIndex = 0;
        let inExpressionString = false;
        const { document, window } = TSXAir.runtime;
        // @ts-ignore
        const { NodeFilter } = window;

        const comments = document.createNodeIterator(target, NodeFilter.SHOW_COMMENT, {
            acceptNode: (node) => {
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

        this.ctx.expressions = values.map(
            v => hydrateFunc(v, comments.nextNode() as Comment)
        );
    }

    comment(index: number, type: CommentPlaceholder) {
        return `<!--${this.fullKey}${type}${index}-->`
    }

    unique(str: string) {
        return this.withUniq(
            this.withUniq(
                this.withUniq(str, 'X'), 'C'), 'E');
    }

    private withUniq(str: string, placeholder: CommentPlaceholder): string {
        const src = str.split(`<!--${placeholder}-->`);
        const res = [];
        let expCount = 0;
        let skipNext = true;
        for (const chunk of src) {
            if (!skipNext) {
                const comment = this.comment(expCount++, placeholder);
                res.push(comment)
                res.push(chunk);
                res.push(comment);
            } else {
                res.push(chunk);
            }
            skipNext = !skipNext;
        }
        return res.join('');
    }
}