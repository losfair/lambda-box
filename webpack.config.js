module.exports = {
    mode: "production",
    optimization: {
        minimize: true
    },
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/"),
            "buffer": require.resolve("buffer/"),
            "fs": false,
        }
    }
}