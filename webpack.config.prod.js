const path = require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const dirname = 'E:\\works\\웹지도서비스\\product\\v1';

module.exports = {
    mode: 'production',
    entry: './index.js',
    output: {
        path: path.resolve(dirname, 'dist'),
        publicPath: './dist/', // 배포: './dist/' 개발: '/dist/'
        filename: 'bundle.js'
    },
    plugins: [
        new UglifyJSPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(dirname),
                exclude: /(node_modules)|(dist)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    }
};