const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { merge } = require('webpack-merge');

const config = require('./webpack.cfg');
const common = require('./webpack.base');

console.log('Env: ', process.env.NODE_ENV)

module.exports = merge(common, {
    mode: "production",
    devtool: false,
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: config.staticDir,
                    to: config.buildDir
                },
            ],
        }),
    ],
});
