module.exports = {
    require: ['@ts-tools/node/r', 'tsconfig-paths/register'],
    extension: ['js', 'json', 'ts', 'tsx'],
    colors: true,
    retries: process.env.CI ? 1 : 1,
    timeout: process.env.CI ? 10 : 2000
};
