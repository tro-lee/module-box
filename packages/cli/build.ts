import type { BuildConfig } from 'bun'

const config: BuildConfig = {
  entrypoints: ['./index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  minify: true,
}

try {
  await Bun.build(config)
}
catch (error) {
  console.error(error)
}

console.log('Build completed!')
