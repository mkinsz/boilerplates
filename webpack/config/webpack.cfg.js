const path = require('path');

const theme = require('./theme')

module.exports = {
    appDir: path.resolve(__dirname, '../app'),
    buildDir: path.resolve(__dirname, '../build'),
    publicDir: path.resolve(__dirname, '../public'),
    sourceDir: path.resolve(__dirname, '../app/src'),
    assetsDir: path.resolve(__dirname, '../app/assets'),
    staticDir: path.resolve(__dirname, '../static'),
    lessLoader: {
        loader: 'less-loader',
        options: {
            lessOptions: {
                javascriptEnabled: true,
                modifyVars: theme
            }
        }
    }
}