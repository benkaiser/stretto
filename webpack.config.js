const path = require('path');

module.exports = {
  entry: {
    main: './src/js/index.js',
    serviceworker: './src/js/serviceworker.js',
  },
  mode: 'development',
  output: {
    path: path.join(__dirname, 'static', 'js'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/env'],
          plugins: [
            ['@babel/plugin-proposal-decorators', { 'legacy': true }],
            ['@babel/plugin-transform-react-jsx'],
            '@babel/plugin-proposal-object-rest-spread'
          ]
        }
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
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
  }
};
