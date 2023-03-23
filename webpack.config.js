const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    entry: path.resolve(path.join(__dirname, 'src', 'index.js')),
    output: {
        path: path.join(__dirname, 'dist/js'),
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: '**',
                    context: './node_modules/jquery-ui/themes/base/',
                    to: '../css'
                },
                {
                    from: 'worker*.js',
                    context: './src/workers/',
                    to: '../js'
                },{
                    from: '*.json',
                    context: './src/data/',
                    to: '../data'
                }
            ],
        }),
    ],
};
