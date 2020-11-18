const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.base');


module.exports = merge({
  mode: 'production',
  entry: {
    reactd: path.resolve(__dirname, '../src/index.js')
  },
  output: {
    path: path.resolve(__dirname, '../lib'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  }
}, common);