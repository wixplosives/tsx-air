export function block(duration: number) {
    // The main thread is now blocked
    const start = Date.now();
    while (Date.now() - start < duration) {
        // block for [duration] mSec
    }
    const end = Date.now();
    return [start, end];
}
