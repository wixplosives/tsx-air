const { promisify } = require('util');
const { statSync, readdir: _readdir, createReadStream, existsSync } = require('fs');
const { join } = require('path');

const readdir = promisify(_readdir);
const { packagePath } = require('@tsx-air/utils/packages');
const examples = packagePath('@tsx-air/examples', 'src/examples');

const getExamples = async () => (await (await readdir(examples)))
    .filter(i => statSync(join(examples, i)).isDirectory());

exports.serveExamples = app => {
    app.get('/examples', async (_, res) => res.json(await getExamples()));
    app.get('/examples/*', async (req, res) => {
        for (const ext of ['', '.tsx', '.ts', '.js']) {
            const resolvedPath = join(examples, req.params[0] + ext);
            if (existsSync(resolvedPath)) {
                createReadStream(resolvedPath, { encoding: 'utf8' }).on('error', () => {
                    res.status(503).send(`Error reading "${req.params[0]}"'`);
                }).pipe(res);
                return;
            }
        }
        res.status(404).send(`Unable to resolve "${req.params[0]}"'`);
    });
};