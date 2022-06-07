// config.overrides.js
module.exports = {
  webpack: (config, env) => {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
      zlib: false
      // etc.
    });
    config.resolve.fallback = fallback;
    // config.ignoreWarnings = [/Failed to parse source map/];  // gets rid of a billion source map warnings
    return config;
  },
};
/*

      path: require.resolve("path-browserify"),
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
*/