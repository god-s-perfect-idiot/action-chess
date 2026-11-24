import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')
const extrasPath = path.join(root, 'src/scene/fighters/Extras.tsx')
const snippetPath = path.join(root, 'scripts/mha-suits-snippet.tsx')

const content = fs.readFileSync(extrasPath, 'utf8')
const snippet = fs.readFileSync(snippetPath, 'utf8')
const start = "  if (has('froppySuit')) {"
const end = "  if (has('kanekiSuit')) {"
const i0 = content.indexOf(start)
const i1 = content.indexOf(end)
if (i0 < 0 || i1 < 0 || i1 <= i0) {
  console.error('markers not found', { i0, i1 })
  process.exit(1)
}
fs.writeFileSync(extrasPath, content.slice(0, i0) + snippet + content.slice(i1))
console.log('spliced', snippet.length, 'chars')