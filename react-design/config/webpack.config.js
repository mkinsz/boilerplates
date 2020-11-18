const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.base');

const pkgName = 'react-design';
let filename = pkgName.toLowerCase() + '.umd';
if (process.env.npm_lifecycle_script.includes('production')) {
  filename += '.min';
}
filename += '.js';

module.exports = merge({
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename,
    library: pkgName,
    libraryTarget: 'umd'
  },
}, common);