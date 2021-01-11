module.exports = {
    mode: "production",
    optimization: {
        minimize: true
    },
    resolve: {
        fallback: {
            "path": require.resolve("path-browserify"),
        }
    }
}