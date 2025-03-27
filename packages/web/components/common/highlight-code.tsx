import Prism from 'prismjs'

import 'prismjs/themes/prism-twilight.css'
import 'prismjs/components/prism-typescript'

export function HighlightCode({ code, language }: { code: string, language: string }) {
  const prismCode = Prism.highlight(
    code,
    Prism.languages.typescript,
    language,
  )

  return (
    <pre className={`language-${language}`} dangerouslySetInnerHTML={{ __html: prismCode }} />
  )
}
