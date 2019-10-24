const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, { mode = 'development', devtool = 'source-map' }) => {
  return {
    entry: {
      main: './src'
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
        title: 'TSXAir examples Playground',

      }),
    ],
    performance: {
      hints: false
    },

    devServer: {
      contentBase: 'public',
      hot: true,
      historyApiFallback: true,
      
    },
  }
}
