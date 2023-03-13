import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
export default [
  {
    input: './src/index.ts',
    output: {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs.js',
    },
    plugins: [json(), resolve(), commonjs(), typescript()],
    external:['aws-sdk/clients/s3']
  }, {
    input: './src/index.ts',
    output: {
      dir: 'lib',
      format: 'esm',
      entryFileNames: '[name].esm.js',
    },
    plugins: [json(), resolve(), commonjs(), typescript()],
    external:['aws-sdk/clients/s3']
  }
];