const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/', // 배포: './dist/' 개발: '/dist/'
        filename: 'bundle.js'
    },
    plugins: [
        //new UglifyJSPlugin(),
        new webpack.HotModuleReplacementPlugin() //개발때만
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(__dirname),
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