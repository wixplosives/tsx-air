const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');
const { serveExamples } = require('./src/utils/examples.indexer');

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
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json'],
      plugins: [new TsconfigPathsPlugin({ configFile: require.resolve('../../tsconfig.base.json') })]
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'TsxAir example playground',
        template: resolve(__dirname, 'src/view/index.html')
      })
    ],
    performance: {
      hints: false
    },

    externals: {
      typescript: 'ts'
    },

    devServer: {
      contentBase: [
        resolve(__dirname, 'public'),
        resolve(__dirname, 'src/examples'),
        resolve(__dirname, '../../node_modules')
      ],
      hot: true,
      historyApiFallback: true,
      before: serveExamples
    },
  }
}
