const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { merge } = require('webpack-merge');

const config = require('./webpack.cfg');
const common = require('./webpack.base');

console.log('Env: ', process.env.NODE_ENV)

module.exports = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        pathinfo: true,
    },
    optimization: {
        namedModules: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    config.lessLoader
                ]
            }
        ]
    },
    devServer: {
        compress: true,
        open: false,
        host: '0.0.0.0',
        port: 9529,
        hot: true,
        https: false,
        inline: true,
        historyApiFallback: true, // refresh get 404
        disableHostCheck: true,
        quiet: false,
        overlay: {
            warnings: true,
            errors: true
        }
    },
    plugins: [
        new webpack.DefinePlugin({ PRODUCTION: JSON.stringify(false) }),
        new webpack.HotModuleReplacementPlugin(), //模块热替换
        new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    stats: {
        children: false
    }
});
