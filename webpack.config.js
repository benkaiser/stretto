var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  entry: {
    app: './src/ts/index.tsx',
    vendor: './src/ts/vendor.ts',
  },
  module: {
    loaders: [
      { test: /\.(tsx|ts)?$/, loader: 'ts' },
      { test: /\.(scss|css)$/, loaders: ['style', 'css', 'sass'] },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
        loader: 'file?limit=1000&name=dist/[hash].[ext]',
      },
    ],
    preLoaders: [
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
  output: {
    path: './dist',
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('vendor', './vendor.bundle.js'),
  ],
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  sassLoader: {
    includePaths: [path.resolve(__dirname, './src/scss')],
  },
};
