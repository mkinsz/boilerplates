const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = require('./webpack.cfg');

module.exports = {
    entry: {
        app: config.sourceDir + '/index.js',
        vendor: ['react', 'react-dom', 'redux', 'moment', 'echarts']
    },
    output: {
        path: config.buildDir
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    {
                        loader: '@svgr/webpack',
                        options: {
                            babel: false,
                            icon: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            name: 'static/images/[name].[ext]'
                        }
                    }
                ]
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Boilerplate',
            template: 'public/index.html',
            inject: 'body',
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
