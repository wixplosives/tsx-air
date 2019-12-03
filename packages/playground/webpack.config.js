const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join } = require('path');
const { serveExamples, subdir } = require('./src/utils/examples.indexer');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = (_env, { mode = 'development', devtool = 'source-map' }) => {
    return {
        entry: {
            main: './src/view'
        },
        mode,
        devtool,
        output: {
            filename: mode === 'production' ? 'js/[name].min.js' : 'js/[name].js'
        },
        optimization: {
            usedExports: true
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: '@ts-tools/webpack-loader',
                    options: {
                        configFilePath: require.resolve('./src/tsconfig.json')
                    }
                },
                {
                    test: /\.d\.ts$/,
                    include: /node_modules/,
                    loader: 'raw-loader'
                },
                {
                    test: /\.css$/,
                    exclude: /\.st\.css$/,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            plugins: [new TsconfigPathsPlugin({ configFile: require.resolve('../../tsconfig.base.json') })]
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'TsxAir example playground',
                template: join(__dirname, 'src/view/index.html')
            }),
            // new BundleAnalyzerPlugin()
        ],
        performance: {
            hints: false
        },

        externals: {
            typescript: 'ts',
            'monaco-editor': 'monaco'
        },

        devServer: {
            contentBase: [
                join(__dirname, 'public'),
                subdir('@wixc3/tsx-air-compilers', 'public'),
                subdir('@wixc3/tsx-air-examples', 'src/examples'),
                subdir('typescript','lib'),
                subdir('monaco-editor', 'min')
            ],
            hot: true,
            historyApiFallback: true,
            before: serveExamples
        }
    };
};
