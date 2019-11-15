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
        for (const ext of ['', '.tsx', '.ts', '.js']) {
            try {
                const resolvedPath = resolve(__dirname, '../examples', req.params[0] + ext);
                res.write(await readFile(resolvedPath));
                res.end();
                return;
            } catch {
            }
        }
        res.status(404).send(`
                requested: "${req.params[0]}"
                resolved: "${resolvedPath}"
                error: ${e.message}`);
    });
};