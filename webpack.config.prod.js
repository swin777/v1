const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const timestamp = +new Date();

module.exports = {
    mode: 'production',
    entry: ['babel-polyfill', './index.js'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: './dist/',
        filename: 'bundle.'+timestamp+'.js'
    },
    plugins: [
        new UglifyJSPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(__dirname),
                exclude: /(node_modules)|(dist)/,
                use: {
                    loader: 'babel-loader',
                    // query: {
                    //     plugins: ['transform-runtime'],
                    //     presets: ['es2015']
                    // }
                }
            }
        ]
    }
};