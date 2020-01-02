const { parentPort, workerData } = require('worker_threads');
const app = require('express')();
require('./examples.indexer').serveExamples(app);
let {port} = workerData; 
const server = app.listen(port);
server.on('error', () => {
    port++;
    server.listen(port);
})
server.on('listening', () => {
    parentPort.postMessage(port);
});