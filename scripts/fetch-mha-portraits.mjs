/**
 * Best-effort portrait fetch for MHA push ids.
 * Tries docs/pushes/mha-32.yaml refs, then common fandom filename guesses.
 */
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const YAML = path.join(ROOT, 'docs/pushes/mha-32.yaml')
const OUT = path.join(ROOT, 'public/roster')

const ids = [
  'froppy', 'pinky', 'cellophane', 'grape-juice', 'anima', 'sugarman', 'gang-orca',
  'nejire-chan', 'kurogiri',
  'uravity', 'chargebolt', 'tsukuyomi', 'earphone-jack', 'dabi',
  'endeavor',
]

function parseRefs(yaml) {
  const map = new Map()
  let cur = null
  for (const line of yaml.split(/\r?\n/)) {
    const idM = line.match(/^\s+- id:\s+(\S+)/)
    if (idM) cur = idM[1]
    const artM = line.match(/^\s+art:\s+(\S+)/)
    const photoM = line.match(/^\s+photo:\s+(\S+)/)
    if (!cur) continue
    if (!map.has(cur)) map.set(cur, {})
    if (artM) map.get(cur).art = artM[1]
    if (photoM) map.get(cur).photo = photoM[1]
  }
  return map
}

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; war-chesst-portrait-fetch/1.0)',
          Accept: 'image/*,*/*',
        },
        timeout: 20000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          get(res.headers.location).then(resolve, reject)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

function extFromUrl(url, buf) {
  const m = url.toLowerCase().match(/\.(png|jpe?g|webp)(?:\?|$)/)
  if (m) return m[1] === 'jpeg' ? 'jpg' : m[1]
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf.toString('utf8', 0, 4) === 'RIFF') return 'webp'
  return 'jpg'
}

const yaml = fs.readFileSync(YAML, 'utf8')
const refs = parseRefs(yaml)

const results = []
for (const id of ids) {
  const existing = ['png', 'jpg', 'jpeg', 'webp'].some((e) =>
    fs.existsSync(path.join(OUT, `${id}.${e}`)),
  )
  if (existing) {
    results.push({ id, status: 'skip-exists' })
    continue
  }
  const r = refs.get(id) || {}
  const candidates = [r.art, r.photo].filter(Boolean)
  let ok = false
  for (const url of candidates) {
    try {
      const buf = await get(url)
      if (buf.length < 2000) throw new Error('too small')
      // reject HTML error pages
      const head = buf.toString('utf8', 0, 200).toLowerCase()
      if (head.includes('<!doctype') || head.includes('<html')) throw new Error('html')
      const ext = extFromUrl(url, buf)
      fs.writeFileSync(path.join(OUT, `${id}.${ext}`), buf)
      results.push({ id, status: 'ok', bytes: buf.length, url })
      ok = true
      break
    } catch (e) {
      results.push({ id, status: 'fail', url, err: String(e.message || e) })
    }
  }
  if (!ok && candidates.length === 0) results.push({ id, status: 'no-url' })
}

console.log(JSON.stringify(results, null, 2))
const ok = results.filter((r) => r.status === 'ok' || r.status === 'skip-exists').length
console.log(`\nportraits ready: ${ok}/${ids.length}`)
