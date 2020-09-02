import { AddEndPoint, Delay, Message, Log } from './testserver.types';
import { createServer } from 'http';
import { TimeoutsPromise, delay } from '@tsx-air/utils';
import { getType } from 'mime';
import { parentPort, workerData } from 'worker_threads';

(async (port: number) => {
    let urls: AddEndPoint[] = [];
    let roots: string[] = [];
    let delays: Delay[] = [];
    let delayed: Record<string, TimeoutsPromise[]> = {};

    const app = createServer(async (req, res) => {
        const fail = () => {
            parentPort?.postMessage({ type: 'log', result: 'fail', url: req.url! } as Log);
            res.writeHead(404, 'Missing endpoint');
            res.end();
        };
        const success = () => {
            parentPort?.postMessage({ type: 'log', result: 'success', url: req.url! } as Log);
            res.writeHead(200, 'ok', {
                'content-type': getType(req.url!)!
            });
        };
        const urlMatch = ({ url }: { url: string | RegExp }) =>
            url === req.url || (url instanceof RegExp && url.test(req.url!));
        const applyDelay = () => {
            const dl = delays.find(urlMatch) as Required<Delay>;
            if (dl) {
                const ret = delay(dl.delay);
                delayed[dl.id] = delayed[dl.id] || [];
                delayed[dl.id].push(ret);
                ret.then(() => delayed[dl.id] = delayed[dl.id] && delayed[dl.id].filter(i => i !== ret));
                return ret;
            }
            return Promise.resolve();
        };


        const match = urls.find(urlMatch);
        if (match) {
            success();
            await applyDelay();
            res.write(match.content);
            res.end();
        } else {
            const { createReadStream, existsSync } = require('fs');
            const { join } = require('path');
            if (!roots.some((root: string) => {
                const filePath = join(root, req.url);
                return existsSync(filePath) &&
                    !!applyDelay().then(() => {
                        createReadStream(join(root, req.url)).on('error', fail).on('open', () => {
                            success();
                        }).pipe(res);
                        return true;
                    });
            })) {
                fail();
            }
        }
    });

    await new Promise(async resolve => {
        let s = app.listen(port, () => {
            resolve(s);
        });
        s.on('error', () => {
            port++;
            s = s.listen(port, () => {
                resolve(s);
            });
        });
    });

    const pPort = parentPort!;
    pPort.postMessage({ type: 'ready', port });
    pPort.on('message', (message: Required<Message>) => {
        switch (message.type) {
            case 'set':
                urls.push(message);
                pPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'root':
                roots.unshift(message.path);
                pPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'delay':
                delays.unshift(message);
                pPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'stopDelay':
                const { originalId } = message;
                delays = delays.filter(({ id }) => id !== originalId);
                if (delayed[originalId]) {
                    delayed[originalId]
                        .forEach(d => d.finish());
                }
                delete delayed[originalId];
                pPort.postMessage({ type: 'done', id: message.id });
                break;
            case 'clear':
                urls = [];
                roots = [];
                delays = [];
                delayed = {};
                pPort.postMessage({ type: 'done', id: message.id });
                break;
            default:
                pPort.postMessage({
                    id: message.id,
                    type: 'error',
                    error: `Unsupported message type ${message.type}`
                });
        }
    });
})(workerData.preferredPort);