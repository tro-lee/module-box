export interface FilterFilesOptions {
  exclude?: string[]
  include?: string[]
}

export function filterFiles(files: string[], options: FilterFilesOptions) {
  return files.filter(
    (file) => {
      const basicFilter = ['.tsx', '.ts'].some(ext => file.endsWith(ext))
        && !file.includes('node_modules')
        && !file.startsWith('.')

      if (options.exclude && options.exclude.length > 0) {
        if (options.exclude.some(excludePath => file.includes(excludePath))) {
          return false
        }
      }

      if (options.include && options.include.length > 0) {
        return basicFilter
          && options.include.some(includePath => file.includes(includePath))
      }

      return basicFilter
    },
  )
}
