const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { join } = require('path');
const { serveExamples } = require('./src/utils/examples.indexer');
const { packagePath } = require('@tsx-air/utils/packages');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (_env, { mode = 'development', devtool = 'source-map' }) => {
    return {
        entry: {
            main: './src/view',
            nadav: './src/nadavs-example'
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
                        configFilePath: require.resolve('./tsconfig.dev.json')
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
            plugins: [new TsconfigPathsPlugin({ configFile: require.resolve('./tsconfig.dev.json') })]
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'TsxAir example playground',
                template: join(__dirname, 'src/view/index.html'),
            })
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
                packagePath('@tsx-air/playground', 'public'),
                packagePath('@tsx-air/examples', 'public'),
                packagePath('@tsx-air/examples', 'src/examples'),
                packagePath('typescript', 'lib'),
                packagePath('monaco-editor', 'min')
            ],
            hot: true,
            historyApiFallback: true,
            before: serveExamples
        }
    };
};
