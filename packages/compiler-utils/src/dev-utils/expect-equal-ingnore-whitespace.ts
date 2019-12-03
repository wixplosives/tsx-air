export const expectEqualIgnoreWhiteSpace = (actual: string, expected: string) => {
    const splitActual = actual.split(/\s+/);
    const splitExpected = expected.split(/\s+/);
    for (let i = 0; i < splitExpected.length; i++) {
        if (splitExpected[i] !== splitActual[i]) {
            throw new Error(`expected equal non white space: word ${i}
- expected: ${splitExpected[i]}
- actual: ${splitActual[i]}

- full expected: ${expected} 
- full actual: ${actual} `);
        }
    }

};