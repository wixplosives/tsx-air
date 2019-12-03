const { promisify } = require('util');
const { readdir: _readdir, readFile: _readFile } = require('fs');
const { join, dirname } = require('path');

const readdir = promisify(_readdir);
const readFile = promisify(_readFile);

const subdir = exports.subdir = (package, path) => join(dirname(require.resolve(join(package, 'package.json'))), path);

getExamples = async () => await readdir(subdir('@wixc3/tsx-air-examples', 'src/examples'));

exports.serveExamples = app => {
    app.get('/examples', async (req, res) => res.json(await getExamples()));
    app.get('/examples/*', async (req, res) => {
        for (const ext of ['', '.tsx', '.ts', '.js']) {
            try {
                const resolvedPath = join(subdir('@wixc3/tsx-air-examples', 'src/examples'), req.params[0] + ext);
                res.write(await readFile(resolvedPath));
                res.end();
                return;
            } catch {
            }
        }
        res.status(404).send(`Unable to resolve "${req.params[0]}"'`);
    });
};