const { parentPort } = require('worker_threads');
const { get } = require('http');

parentPort.on('message', async ({ type, url, id }) => {
    switch (type) {
        case 'get':
            get(url, response => {
                result = '';
                response.on('data', d => result = result + d);
                response.on('error', e => parentPort.postMessage({ id, result: e, time: Date.now() }));
                response.on('end', () => parentPort.postMessage({ id, result, time: Date.now() }));
            });
            break;
        default:
            parentPort.postMessage('Unsupported message type');
    }
});