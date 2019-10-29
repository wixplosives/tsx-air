import { Visitor } from './scanner';
export const combineVisitors = (...visitors: Visitor[]): Visitor => (node, scanner) => {
    const stopped = new Set();
    visitors.forEach(visitor => {
        if (stopped.has(visitor)) {
            return;
        }
        const metadata = visitor(node, {
            ...scanner, stop: () => {
                stopped.add(visitor);
            }
        });
        if (metadata) {
            scanner.report({ metadata, node });
        }
    });
};
