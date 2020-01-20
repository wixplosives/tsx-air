import { Worker } from 'worker_threads';

export type AddEndPoint = (url: string, content: string) => Promise<void>;
export interface TestServer {
    addStaticRoot: (path: string) => Promise<void>;
    addEndpoint: AddEndPoint;
    reset: () => Promise<void>;
    close: () => Promise<number>;
    readonly baseUrl: string;
}

export async function createTestServer(preferredPort = 12357): Promise<TestServer> {
    const serverWorker = new Worker(require.resolve('./testserver.worker'), { workerData: { preferredPort } });
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
    const post = <T = void>(m: any) => new Promise((resolve, reject) => {
        const id = messageId++;
        const msg = {
            ...m, id
        };
        serverWorker.postMessage(msg);
        const waitUntilDone = (message: any) => {
            if (message.id === id) {
                serverWorker.off('message', waitUntilDone);
                if (message.type === 'done') {
                    resolve();
                } else {
                    reject(message);
                }
            }
        };
        serverWorker.on('message', waitUntilDone);
    }) as Promise<T>;

    return {
        addStaticRoot: async (path: string) => post({ type: 'root', path }),
        addEndpoint: async (url: string, content: string) => post({ type: 'set', url, content }),
        reset: () => post({ type: 'clear' }),
        close: async () => serverWorker.terminate(),
        baseUrl
    };
}
