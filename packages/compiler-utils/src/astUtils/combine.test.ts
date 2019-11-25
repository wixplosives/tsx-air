import { expect } from 'chai';
import { combineVisitors } from './combine';
import { scan } from './scanner';
import { parseValue } from './parser';

describe('combineVisitors', () => {
    const ast = parseValue({ prop: 'value' });

    it('should execute all the visitors for all nodes, once per', () => {
        const nodes = scan(ast, () => true).map(i => i.node);
        const visited = scan(ast, combineVisitors(() => '1', () => '2', () => '3'));
        expect(visited).to.have.length(4 * 3);
        expect(visited.filter(n => n.node === nodes[0]).map(i => i.metadata)).to.deep.equal(['1', '2', '3']);
        expect(visited.filter(n => n.node === nodes[1]).map(i => i.metadata)).to.deep.equal(['1', '2', '3']);
        expect(visited.filter(n => n.node === nodes[2]).map(i => i.metadata)).to.deep.equal(['1', '2', '3']);
        expect(visited.filter(n => n.node === nodes[3]).map(i => i.metadata)).to.deep.equal(['1', '2', '3']);
    });

    xdescribe('scanner api', () => {
        it('should apply ignoreChildren on a per-visitor basis', () => {
            const visited = scan(ast, combineVisitors(
                () => '1',
                (_, scanner) => { scanner.ignoreChildren(); return '2'; }));
            expect(visited).to.have.length(4 + 1);
        });

        it('should apply stop on a per-visitor basis', () => {
            const visited = scan(ast, combineVisitors(
                () => '1',
                (_, scanner) => { scanner.stop(); return '2'; }));
            expect(visited).to.have.length(4 + 1);
        });
    });
});
