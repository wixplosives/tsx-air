const { join, dirname } = require('path');

exports.packagePath = (name, ...innerPath) =>
    join(dirname(require.resolve(join(name, 'package.json'))), ...innerPath)