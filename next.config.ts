import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable WebAssembly support for Stockfish.js
  webpack: (config) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Enable WebWorker support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    return config;
  },

  // Environment variables configuration
  env: {
    STOCKFISH_THREADS: process.env.STOCKFISH_THREADS,
    STOCKFISH_HASH: process.env.STOCKFISH_HASH,
    DEFAULT_ENGINE_DEPTH: process.env.DEFAULT_ENGINE_DEPTH,
    DEFAULT_SKILL_LEVEL: process.env.DEFAULT_SKILL_LEVEL,
  },

  // Headers for WASM support
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
