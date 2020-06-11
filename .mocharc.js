module.exports = {
    require: ['@ts-tools/node/r', 'tsconfig-paths/register'],
    extension: ['js', 'json', 'ts', 'tsx'],
    colors: true,
    retries: process.env.CI ? 5 : 1,
    timeout: process.env.CI ? 35000 : 15000,
    "enable-source-maps": true
};