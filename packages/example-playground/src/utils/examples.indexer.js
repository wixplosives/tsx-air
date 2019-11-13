const { promisify } = require('util');
const { readdir: _readdir, readFile: _readFile } = require('fs');
const { join, resolve } = require('path');

const readdir = promisify(_readdir);
const readFile = promisify(_readFile);

getExamples = async () => {
    return await readdir(join(__dirname, '../examples'));
};

exports.serveExamples = app => {
    app.get('/examples', async (req, res) => res.json(await getExamples()));
    app.get('/examples/*', async (req, res) => {
        try {
            const content = await readFile(resolve(__dirname, '../examples', req.params[0]));
            res.write(content);
            res.end();
        } catch (e) {
            res.status(404).send(e.message);
        }
    });
};