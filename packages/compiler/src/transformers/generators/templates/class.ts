import { bitMask } from './../../helpers';
import { CompDefinition } from './../../../analyzers/types';
import { DomBinding } from './../component-common';
// tslint:disable: no-shadowed-variable
// tslint:disable: no-unused-expression

export const compClassTemplate = ($$name: any, $$propsHandling: any) =>
    class $$name {
        public $$processUpdate(newProps: any, newState: any, changeMap: any) {
            // tslint:disable-next-line: semicolon
            $$propsHandling
        }
    };


export const propsHandling = (dom: DomBinding[], def: CompDefinition) => {
    const mask = bitMask(def);
    def.usedProps.map(prop => {
        if (prop.name.indexOf(def.propsIdentifier!) > 0) {
            return `
            `
        }
    });
};

