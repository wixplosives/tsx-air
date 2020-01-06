const { workerData, parentPort } = require('worker_threads');
const { createServer } = require('http');

(async (port) => {
    let urls = {};
    let root;
    const app = createServer((req, res)=>{
        if (urls[req.url]) {
            res.writeHead(200);
            res.write(urls[req.url]);
            res.end();
        } else {
            if (root) {
                const { createReadStream } = require('fs');
                const { join } = require('path');
                createReadStream(join(root, req.url), { encoding: 'utf8' }).on('error', () => {
                    res.writeHead(404);
                    res.end();
                }).pipe(res);
            } else {
                res.writeHead(404);
                res.end();
            }
        }
    });
    
    await new Promise(async resolve => {
        let s;
        s = app.listen(port, () => {
            resolve(s);
        });
        s.on('error', () => {
            port++;
            s = s.listen(port, () => {
                resolve(s);
            });
        });
    });

    parentPort.postMessage({ type: 'ready', port });
    parentPort.on('message', (message) => {
        message.processed = true;
        switch (message.type) {
            case 'set':
                urls[message.url] = message.content;
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'root':
                root = message.path;
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'clear':
                urls = {};
                root = undefined;
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            default:
                parentPort.postMessage({
                    id: message.id,
                    type: 'error',
                    error: `Unsupported message type ${message.type}`
                });
        }
    });
})(workerData.preferredPort);