const webpack = require("webpack");

module.exports = {
    entry: "./src/index.ts",
    mode: "production",
    resolve: {
        fallback: {
          "buffer": require.resolve("buffer/"),
        },
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
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
}