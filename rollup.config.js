import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'gretel.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es'
  },
  plugins: [nodeResolve(), commonjs()]
};

