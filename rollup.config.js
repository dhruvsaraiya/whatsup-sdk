import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodePolyfills from "rollup-plugin-node-polyfills";
import replace from "@rollup/plugin-replace";
import pkg from "./package.json";
const input = ["src/index.js"];
const configPath = { path: ".env" };
if (process.env && process.env.NODE_ENV) {
  configPath.path = ".env." + process.env.NODE_ENV;
}
const envRaw = require("dotenv").config(configPath).parsed || {};
const common = [
  commonjs({ include: /node_modules/ }),
  nodePolyfills(),
  json(),
  replace({
    preventAssignment: true,
    __whatsup: JSON.stringify({ env: { ...envRaw } }),
  }),
  nodeResolve(),
];
export default [
  {
    // UMD
    input,
    plugins: [
      ...common,
      babel({
        babelHelpers: "bundled",
        exclude: /node_modules/,
      }),
      terser(),
    ],
    output: [
      {
        file: `dist/${pkg.name}.min.js`,
        format: "umd",
        name: "Whatsup", // this is the name of the global object
        esModule: false,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // ESM and CJS
  {
    input,
    plugins: [
      ...common,
      babel({
        exclude: /node_modules/,
        babelrc: true,
      }),
    ],
    output: [
      {
        dir: "dist/esm",
        format: "esm",
        exports: "named",
        sourcemap: false,
      },
      {
        dir: "dist/cjs",
        format: "cjs",
        exports: "named",
        sourcemap: false,
      },
    ],
  },
];
