import type { BuildConfig } from "bun";

const config: BuildConfig = {
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  target: "node",
  format: "esm",
  minify: true,
  sourcemap: "external",
  external: [
    "@babel/core",
    "@babel/plugin-syntax-import-source", 
    "@babel/preset-react",
    "@babel/preset-typescript",
    "comment-parser",
    "fast-xml-parser"
  ]
};

await Bun.build(config);

console.log("Build completed!");
