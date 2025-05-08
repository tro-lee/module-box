import * as fs from 'node:fs'
import { addDocuments } from './src/common'
import { getExplainCodeGraph } from './src/explain-code-graph/graph'

const documentsJSON = fs.readFileSync('./dist/docs.json', 'utf-8')
const documents = JSON.parse(documentsJSON)
addDocuments(documents)

export const app = await getExplainCodeGraph()
app.name = 'ExplainFunctionGraph'
