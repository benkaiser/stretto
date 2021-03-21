const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    main: './src/js/index.js',
    serviceworker: './src/js/serviceworker.js',
  },
  mode: process.env === 'prod' ? 'production' : 'development',
  output: {
    path: path.join(__dirname, 'static', 'js'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/env', {
              "targets": "last 2 chrome version"
            }]],
            plugins: [
              ['@babel/plugin-proposal-decorators', { 'legacy': true }],
              ['@babel/plugin-transform-react-jsx'],
              '@babel/plugin-proposal-object-rest-spread'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ]
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'jquery': path.join(__dirname, 'stubs/jquery.js')
    }
  },
  watchOptions: {
      aggregateTimeout: 500,
      poll: 1000
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        PRODUCTION: process.env === 'prod',
      }
    }),
  ]
};
