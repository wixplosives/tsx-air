export interface JSXAttributeMapping {
    kind: string;
}

export interface JsxHtmlAttribute extends JSXAttributeMapping {
    kind: 'jsx-html-attribute';
    htmlName: string;
}
export function isJsxHtmlAttribute(val: JSXAttributeMapping): val is JsxHtmlAttribute {
    return val.kind === 'jsx-html-attribute';
}
const JSXHTMLAttribute = (htmlName: string) => {
    const res: JsxHtmlAttribute = {
        kind: 'jsx-html-attribute',
        htmlName
    };
    return res;
};


export const nativeAttributeMapping: Record<string, JSXAttributeMapping> = {
    'className': JSXHTMLAttribute('class')
};