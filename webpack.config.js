const webpack = require("webpack");

module.exports = {
    entry: "./src/index.ts",
    mode: "production",
    resolve: {
        fallback: {},
        extensions: ['.ts', '.js'],
    },
    optimization: {
      minimize: false,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
    ],
}