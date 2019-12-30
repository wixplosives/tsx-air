import { FrameBase } from 'puppeteer';

export async function htmlMatch(page: FrameBase, matches: HTMLMatcher) {
    // const found = await page.$$(matches.cssQuery);
    // const { cssQuery,
    //     name,
    //     children,
    //     decedents,
    //     instances,
    //     pageInstances,
    //     textContent,
    // } = matches;
    return true;
}

export interface HTMLMatcher {
    cssQuery: string;
    name?: string;
    children?: ChildrenDescriptor[];
    decedents?: ChildrenDescriptor[];
    instances?: Count;
    pageInstances?: Count;
    textContent?: Text;
}

type Count = Range | number;
export interface Range {
    above?: number;
    below?: number;
}

export type ChildrenDescriptor = Count | HTMLMatcher;

export interface Text {
    ignoreWhiteSpace: boolean | 'leading' | 'trailing';
    ignoreLineBreaks: boolean | 'leading' | 'trailing' | 'double';
    content: string;
}

