const { workerData, parentPort } = require('worker_threads');
const { createServer } = require('http');
const m = require('mime');

(async (port) => {
    let urls = {};
    let roots = [];
    const app = createServer((req, res) => {
        const fail = () => {
            res.writeHead(404, 'Missing endpoint');
            res.end();
        }

        if (urls[req.url]) {
            res.writeHead(200, 'ok', {
                'content-type': m.getType(req.url)
            });
            res.write(urls[req.url]);
            res.end();
        } else {
            const { createReadStream, existsSync } = require('fs');
            const { join } = require('path');
            roots.some(root => {
                const filePath = join(root, req.url);
                if (existsSync(filePath)) {
                    return !!createReadStream(join(root, req.url)).on('error', fail).on('open', () => {
                        res.writeHead(200, 'ok', {
                            'Content-Type': m.getType(req.url)
                        });
                    }).pipe(res);
                }
            }) || fail();
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
                roots.unshift(message.path);
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'clear':
                urls = {};
                roots = [];
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