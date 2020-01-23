module.exports = {
    require: ['@ts-tools/node/r', 'tsconfig-paths/register'],
    extension: ['js', 'json', 'ts', 'tsx'],
    colors: true,
    retries: process.env.CI ? 5 : 1,
    timeout: process.env.CI ? 10000 : 2000
};
