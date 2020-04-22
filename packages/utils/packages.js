const { join, dirname } = require('path');

const winSafePath = (path) => path.substr(0,1).toUpperCase() + path.substr(1);
exports.packagePath = (name, ...innerPath) => 
    winSafePath(join(dirname(require.resolve(join(name, 'package.json'))), ...innerPath));

exports.winSafePath = winSafePath;

