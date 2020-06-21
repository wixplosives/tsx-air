import { TSXAir } from "./types";

export function when(predicate: any | any[], action: () => void) {
    TSXAir.runtime.when(predicate, action);
}
export const always = () => true;
export async function requestRender(): Promise<void> {  /* todo */ }