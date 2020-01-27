import { Worker } from 'worker_threads';
import { Message, Done } from './testserver.types';

export async function createTestServer(preferredPort = 12357): Promise<TestServer> {
    const serverWorker = new Worker(
        `require(${JSON.stringify(require.resolve('./testserver.worker'))})`, 
        { workerData: { preferredPort }, 
        eval: true, 
        execArgv: ['-r', '@ts-tools/node/r', '-r', 'tsconfig-paths/register'] });
    const baseUrl: string = await new Promise((resolve, reject) => {
        serverWorker.once('message', m => {
            if (m.type === 'ready') {
                resolve(`http://localhost:${m.port}`);
            } else {
                reject(m);
            }
        });
    });
    let messageId = 0;
    const post = (m: Message): Promise<number> => new Promise((resolve, reject) => {
        const id = messageId++;
        const msg = {
            ...m, id
        } as Message;
        serverWorker.postMessage(msg);
        const waitUntilDone = (message: Done) => {
            if (message.id === id) {
                serverWorker.off('message', waitUntilDone);
                if (message.type === 'done') {
                    resolve(message.id);
                } else {
                    reject(message);
                }
            }
        };
        serverWorker.on('message', waitUntilDone);
    });

    return {
        addStaticRoot: async (path: string) =>
            post({ type: 'root', path }).then(() => void (0)),
        addEndpoint: async (url: string | RegExp, content: string) =>
            post({ type: 'set', url, content }).then(() => void (0)),
        reset: () =>
            post({ type: 'clear' }).then(() => void (0)),
        close:  () =>
            serverWorker.terminate().then(()=>void(0)),
        setDelay: async (url: string | RegExp, delay: number) =>
            post({ type: 'delay', url, delay })
                .then((originalId: number) => () => (post({ type: 'stopDelay', originalId }).then(() => void (0)))),
        baseUrl
    };
}


export interface TestServer {
    addStaticRoot: (path: string) => Promise<void>;
    addEndpoint: AddEndPointFn;
    setDelay: (url: string | RegExp, delay: number) => Promise<StopDelayFn>;
    reset: () => Promise<void>;
    close: () => Promise<void>;
    readonly baseUrl: string;
}

type AddEndPointFn = (url: string | RegExp, content: string) => Promise<void>;
type StopDelayFn = () => Promise<void>;
