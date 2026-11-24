import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const ROOT = path.resolve('public/roster')
const urls = {
  froppy:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/a/a9/Tsuyu_Asui_Action_4.png/revision/latest?cb=20250602031715',
  pinky:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/d/de/Mina_Ashido_Action_2.png/revision/latest?cb=20240615223425',
  cellophane:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/2/25/Hanta_Sero_Action_3.png/revision/latest?cb=20240615224622',
  'grape-juice':
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/a/a6/Minoru_Mineta_Action_3.png/revision/latest?cb=20250602032233',
  anima:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/2/27/Koji_Koda_Action_3.png/revision/latest?cb=20240615225055',
  sugarman:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/2/27/Rikido_Sato_Action_3.png/revision/latest?cb=20240615225102',
  'gang-orca':
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/7/71/Kugo_Sakamata_Hero_Costume_%28Anime%29.png/revision/latest?cb=20251115181417',
  'nejire-chan':
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/2/28/Nejire_Hado_Post-War_%28Anime%29.png/revision/latest?cb=20240525123551',
  kurogiri:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/b/b6/Kurogiri_Villain_Costume.png/revision/latest?cb=20240515054436',
  uravity:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/f/f8/Ochaco_Uraraka_Action_5.png/revision/latest?cb=20250602031334',
  chargebolt:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/d/d0/Denki_Kaminari_Action_5.png/revision/latest?cb=20240615222129',
  tsukuyomi:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/3/39/Fumikage_Tokoyami_Action_4.png/revision/latest?cb=20240615222003',
  'earphone-jack':
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/2/2b/Kyoka_Jiro_Action_4.png/revision/latest?cb=20240615223202',
  dabi: 'https://static.wikia.nocookie.net/bokunoheroacademia/images/a/af/Dabi_Anime_Action.png/revision/latest',
  endeavor:
    'https://static.wikia.nocookie.net/bokunoheroacademia/images/d/d4/Enji_Todoroki_S7_Visual.png/revision/latest?cb=20240615231526',
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            Referer: 'https://myheroacademia.fandom.com/',
          },
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
          res.on('end', () => resolve({ buf: Buffer.concat(chunks), type: res.headers['content-type'] }))
        },
      )
      .on('error', reject)
  })
}

function extFor(type, buf) {
  if (type?.includes('png') || (buf[0] === 0x89 && buf[1] === 0x50)) return 'png'
  if (type?.includes('webp') || buf.toString('utf8', 0, 4) === 'RIFF') return 'webp'
  if (type?.includes('jpeg') || type?.includes('jpg') || (buf[0] === 0xff && buf[1] === 0xd8))
    return 'jpg'
  return 'png'
}

const results = []
for (const [id, url] of Object.entries(urls)) {
  try {
    // clear placeholders
    for (const e of ['png', 'jpg', 'jpeg', 'webp']) {
      const p = path.join(ROOT, `${id}.${e}`)
      if (fs.existsSync(p)) fs.unlinkSync(p)
    }
    const { buf, type } = await get(url)
    if (buf.length < 5000) throw new Error(`too small ${buf.length}`)
    const ext = extFor(type, buf)
    fs.writeFileSync(path.join(ROOT, `${id}.${ext}`), buf)
    results.push({ id, ok: true, bytes: buf.length, ext })
  } catch (e) {
    results.push({ id, ok: false, err: String(e.message || e) })
  }
}
console.log(JSON.stringify(results, null, 2))
console.log(
  `ok ${results.filter((r) => r.ok).length}/${results.length}`,
)
