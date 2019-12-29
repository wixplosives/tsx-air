import { Worker } from 'worker_threads';

type AddEndPoint = (url: string, content: string) => Promise<void>;
export interface TestServer {
    addEndpoint: AddEndPoint;
    reset: () => Promise<void>;
    close: () => Promise<number>;
    baseUrl: string;
}

export async function createTestServer(preferredPort=12357): Promise<TestServer> {
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
        serverWorker.once('message', (message: any) => {
            if (message.type === 'done' && message.id === id) {
                resolve();
            } else {
                reject(message);
            }
        });
    }) as Promise<T>;

    return {
        addEndpoint: async (url: string, content: string) => post({ type: 'set', url, content }),
        reset: () => post({ type: 'clear' }),
        close: async () => serverWorker.terminate(),
        baseUrl
    };
}
