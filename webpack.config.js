const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'the-tool.js',
  },
  target: 'node',
  externals: [nodeExternals()],
  devtool: 'eval-source-map',
};
