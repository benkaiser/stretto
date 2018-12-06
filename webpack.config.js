const path = require('path');

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.join(__dirname, 'static', 'js'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: [
            'transform-decorators-legacy',
            [
              'transform-react-jsx'
            ],
            'transform-object-rest-spread'
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
    extensions: ['', '.js', '.jsx'],
    alias: {
      'jquery': path.join(__dirname, 'stubs/jquery.js')
    }
  }
};
