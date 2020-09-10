const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = require('./webpack.cfg')

module.exports = {
    mode: "production",
    entry: {
        app: config.sourceDir + '/index.js',
    },
    output: {
        filename: "js/bundle.js",
        path: config.buildDir
    },
    optimization: {
        minimize: true,
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
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
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Boilerplate',
            template: 'public/index.html',
            inject: 'body',
            dllName: ['static/vendor.dll.js'], //添加好了后
        }),
        new webpack.DllReferencePlugin({
            manifest: require(config.staticDir + '/vendor-manifest.json')
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: config.staticDir, to: config.buildDir + '/static' },
            ],
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '@': config.appDir,
            'jQuery': config.assetsDir + '/js/jquery.min.js'
        },
    }
};
