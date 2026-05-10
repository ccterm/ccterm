import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Configuration } from 'webpack';

const nativeModules = [
  '@homebridge/node-pty-prebuilt-multiarch',
];

const config: Configuration[] = [
  // Main process
  {
    entry: './src/main/index.ts',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist/main'),
      filename: 'index.js',
    },
    externals: {
      ...nativeModules.reduce((acc, mod) => ({ ...acc, [mod]: `commonjs ${mod}` }), {}),
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: { loader: 'ts-loader', options: { transpileOnly: true } },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  // Preload
  {
    entry: './src/preload/index.ts',
    target: 'electron-preload',
    output: {
      path: path.resolve(__dirname, 'dist/preload'),
      filename: 'index.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: { loader: 'ts-loader', options: { transpileOnly: true } },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
  },
  // Renderer
  {
    entry: './src/renderer/index.tsx',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'index.js',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: { loader: 'ts-loader', options: { transpileOnly: true } },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
      }),
    ],
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.jsx', '.css'],
    },
  },
];

export default config;
