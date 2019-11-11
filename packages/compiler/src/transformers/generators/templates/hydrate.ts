import { DomBinding } from './../component-common';

export const hydrateTemplate = ($$propsIdentifier?: any, $$name?: any, $$domContext?: any) =>
    (root:any, $$propsIdentifier:any) => {
        return new $$name($$domContext);
    };

export const domCtxTemplate = (expressionsBinding:DomBinding[]) =>
    JSON.stringify();