export interface JSXAttributeMapping {
    kind: string;
}

export interface JSXHTMLAttribute extends JSXAttributeMapping {
    kind: 'jsx-html-attribute';
    htmlName: string;
}
export function isJSXHTMLAttribute(val: JSXAttributeMapping): val is JSXHTMLAttribute {
    return val.kind === 'jsx-html-attribute';
}
const JSXHTMLAttribute = (htmlName: string) => {
    const res: JSXHTMLAttribute = {
        kind: 'jsx-html-attribute',
        htmlName
    };
    return res;
};


export const nativeAttributeMapping: Record<string, JSXAttributeMapping> = {
    'className': JSXHTMLAttribute('class')
};