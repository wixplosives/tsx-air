const { workerData, parentPort } = require('worker_threads');
const { createServer } = require('http');
const m = require('mime');
const { delay } = require('@tsx-air/utils');

(async (port) => {
    let urls = [];
    let roots = [];
    let delays = [];
    let delayed = {};

    const app = createServer(async (req, res) => {
        const fail = () => {
            res.writeHead(404, 'Missing endpoint');
            res.end();
        }

        const urlMatch = ({ url }) =>
            url === req.url || (url instanceof RegExp && url.test(req.url));
            
        const applyDelay = () => {
            const dl = delays.find(urlMatch);
            if (dl) {
                const ret = delay(dl.delay);
                delayed[dl.id] = delayed[dl.id] || [];
                delayed[dl.id].push(ret);
                ret.then(() => delayed[dl.id] = delayed[dl.id] && delayed[dl.id].filter(i => i !== ret));
                return ret;
            }
            return Promise.resolve();
        }

        const match = urls.find(urlMatch);
        if (match) {
            res.writeHead(200, 'ok', {
                'content-type': m.getType(req.url)
            });
            await applyDelay();
            res.write(match.content);
            res.end();
        } else {
            const { createReadStream, existsSync } = require('fs');
            const { join } = require('path');
            roots.some(root => {
                const filePath = join(root, req.url);
                if (existsSync(filePath)) {
                    return !!applyDelay().then(() =>{
                        res.writeHead(200, 'ok', {
                            'Content-Type': m.getType(req.url)
                        });
                        createReadStream(join(root, req.url)).on('error', fail).on('open', () => {
                        }).pipe(res)}
                    );
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
        switch (message.type) {
            case 'set':
                urls.push(message);
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'root':
                roots.unshift(message.path);
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'delay':
                delays.unshift(message);
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'stopDelay':
                const { originalId } = message;
                delays = delays.filter(({ id }) => id !== originalId);
                delayed[originalId] && delayed[originalId]
                    .forEach(d => d.finish());
                delete delayed[originalId];
                parentPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'clear':
                urls = [];
                roots = [];
                delays = [];
                delayed = {};
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