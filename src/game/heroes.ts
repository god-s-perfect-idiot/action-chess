import type { PieceColor, PieceType, Square } from './types'

export type HeroStat = 1 | 2 | 3 | 4 | 5

export interface HeroDef {
  id: string
  codename: string
  trueName: string
  piece: PieceType
  color: PieceColor
  startSquare: Square
  blurb: string
  gimmick: string
  look: string
  stats: { pwr: HeroStat; spd: HeroStat; sty: HeroStat }
}

/**
 * Full roster — presentation only; chess rules unchanged.
 * Starting sides are shuffled each game (`createTrackedPieces`), so any hero
 * can appear on either team. `color` / `startSquare` are authorship defaults.
 */
export const HEROES: HeroDef[] = [
  // --- Block Dawn pawns ---
  {
    id: 'dawn-cinder',
    codename: 'Escanor',
    trueName: 'Escanor',
    piece: 'p',
    color: 'w',
    startSquare: 'a2',
    blurb: 'Timid by night — a flicker of flame. At noon he awakens, and Pride answers with Rhitta.',
    gimmick: 'Sunshine',
    look: 'Ginger side-part & mustache; green bartender vest by night, shirtless titan with Divine Axe Rhitta by day',
    stats: { pwr: 2, spd: 2, sty: 5 },
  },
  {
    id: 'dawn-latch',
    codename: 'One Punch Man',
    trueName: 'Saitama',
    piece: 'p',
    color: 'w',
    startSquare: 'b2',
    blurb: 'Bored bald hero in yellow. Normal: he jogs in and punches. Awakened Serious Mode: he teleports — and one punch ends it.',
    gimmick: 'Serious Series',
    look: 'Bald, yellow jumpsuit, white cape, red gloves & boots, gold belt buckle — deadpan until Serious',
    stats: { pwr: 5, spd: 4, sty: 2 },
  },
  {
    id: 'dawn-stamp',
    codename: 'Mob',
    trueName: 'Shigeo Kageyama',
    piece: 'p',
    color: 'w',
    startSquare: 'c2',
    blurb: 'Quiet steps, a stiff punch — until ???% opens and purple eats the file.',
    gimmick: '???%',
    look: 'Bowl cut, black gakuran, deadpan stare; awakens into flickering purple/black psychic form',
    stats: { pwr: 5, spd: 2, sty: 4 },
  },
  {
    id: 'dawn-needle',
    codename: 'Might Guy',
    trueName: 'Might Guy',
    piece: 'p',
    color: 'w',
    startSquare: 'd2',
    blurb: 'Youth burns bright — Naruto-runs the file, then a taijutsu burst of cross, hook, and kick. Awakened Eight Gates: he teleports into a blistering combo that leaves them charred.',
    gimmick: 'Eight Gates',
    look: 'Bowl cut, thick brows, green jumpsuit, olive flak, orange leg warmers — crimson steam when the Eighth Gate opens',
    stats: { pwr: 5, spd: 5, sty: 4 },
  },
  {
    id: 'dawn-chord',
    codename: 'Deku',
    trueName: 'Izuku Midoriya',
    piece: 'p',
    color: 'w',
    startSquare: 'e2',
    blurb:
      'Runs the file on Full Cowl — Detroit-smash punches that detonate on impact. Awakened: he blinks in and chains explosive punch-kick combos.',
    gimmick: 'One For All',
    look: 'Messy green curls, freckles, teal Gamma suit, silver respirator, red belt & iron-sole boots — cyan OFA sparks when awakened',
    stats: { pwr: 5, spd: 4, sty: 4 },
  },
  {
    id: 'dawn-grit',
    codename: 'All Might',
    trueName: 'Toshinori Yagi',
    piece: 'p',
    color: 'w',
    startSquare: 'f2',
    blurb:
      'Gaunt True Form runs the file and Texas-Smashes. Awakened: the muscle Symbol of Peace leaps in with explosive punches.',
    gimmick: 'One For All',
    look: 'Twin blond tufts, torn blue/red/yellow suit when thin — awakens into the buff hero form',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'dawn-wisp',
    codename: 'Chainsaw Man',
    trueName: 'Denji',
    piece: 'p',
    color: 'w',
    startSquare: 'g2',
    blurb:
      'Public Safety grunt who runs the file in a wrinkled shirt. On attack he yanks the cord and becomes Chainsaw Man — limbs fly. Awakened Hero of Hell: four arms, total dismemberment.',
    gimmick: 'Chainsaw',
    look: 'Messy blond, white shirt + black tie, charcoal pants, white/red sneakers — devil forms sprout orange then hell-black saws',
    stats: { pwr: 5, spd: 4, sty: 3 },
  },
  {
    id: 'dawn-hook',
    codename: 'Hakari',
    trueName: 'Kinji Hakari',
    piece: 'p',
    color: 'w',
    startSquare: 'h2',
    blurb:
      'Runs in grinning, hands still in the puffer — then a clean punch-kick rush. Awakened Jackpot: golden-green aura, near untouchable, explosive fists.',
    gimmick: 'Idle Death Gamble',
    look: 'Sandy pompadour, dark green puffer, khaki baggies, hoop earrings, thin mustache',
    stats: { pwr: 4, spd: 4, sty: 5 },
  },

  // --- Block Dawn officers ---
  {
    id: 'dawn-rush',
    codename: 'Ingenium',
    trueName: 'Tenya Iida',
    piece: 'r',
    color: 'w',
    startSquare: 'a1',
    blurb: 'Normal sprint, inhuman pace — calf flames and engine-boosted fists.',
    gimmick: 'Turbo Recoil',
    look: 'White engine armor, knight helm, muffler stacks, navy undersuit, gold pivots',
    stats: { pwr: 3, spd: 5, sty: 3 },
  },
  {
    id: 'dawn-vault',
    codename: 'Lemillion',
    trueName: 'Mirio Togata',
    piece: 'n',
    color: 'w',
    startSquare: 'b1',
    blurb: 'Phases under the board, drags them into the floor, then pops out to take the head.',
    gimmick: 'Permeation',
    look: 'Spiky blond, gold visor, white suit with 1,000,000 crest, red cape & gauntlets, navy tights',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'dawn-deadshot',
    codename: 'Deadshot',
    trueName: 'Floyd Lawton',
    piece: 'b',
    color: 'w',
    startSquare: 'c1',
    blurb: 'Locks the diagonal, then puts two in the same hole from across the board.',
    gimmick: 'Wrist Barrage',
    look: 'Silver target helm, red eyepiece, gold wrist-guns, crosshair belt',
    stats: { pwr: 5, spd: 3, sty: 4 },
  },
  {
    id: 'dawn-aria',
    codename: 'GOJO',
    trueName: 'Satoru Gojo',
    piece: 'q',
    color: 'w',
    startSquare: 'd1',
    blurb: 'Hands in pockets until the gap collapses — then purple eats the file.',
    gimmick: 'Hollow Purple',
    look: 'White spikes, black blindfold, high-collar jujutsu blacks',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'dawn-boss',
    codename: 'YAMAMOTO',
    trueName: 'Genryūsai Shigekuni Yamamoto',
    piece: 'k',
    color: 'w',
    startSquare: 'e1',
    blurb: 'Slow staff steps — then Ryūjin Jakka burns the front block to ash.',
    gimmick: 'Ryūjin Jakka',
    look: 'Bald, scarred brow, waist-long white beard, black shihakushō, white captain haori, wooden staff',
    stats: { pwr: 5, spd: 1, sty: 5 },
  },
  {
    id: 'dawn-nanami',
    codename: 'Nanami',
    trueName: 'Kento Nanami',
    piece: 'b',
    color: 'w',
    startSquare: 'f1',
    blurb: 'Measures the diagonal at 7:3 — then the cleaver finishes overtime.',
    gimmick: 'Ratio Slice',
    look: 'Blond side-part, green rimless goggles, blue shirt, spotted tie, blunt wrapped cleaver',
    stats: { pwr: 4, spd: 3, sty: 4 },
  },
  {
    id: 'dawn-riddle',
    codename: 'Finral',
    trueName: 'Finral Roulacase',
    piece: 'n',
    color: 'w',
    startSquare: 'g1',
    blurb: 'Opens a silver portal on the pad — steps through, L done.',
    gimmick: 'Spatial Gate',
    look: 'Messy sandy hair, purple eyes, Black Bulls cloak, olive tunic, floating grimoire',
    stats: { pwr: 2, spd: 5, sty: 4 },
  },
  {
    id: 'dawn-volt',
    codename: 'Flash Manhattan',
    trueName: 'Wally West',
    piece: 'r',
    color: 'w',
    startSquare: 'h1',
    blurb: 'Speed Force fused with atomic sight — a cyan streak that rewrites the file mid-sprint.',
    gimmick: 'Speed Force Discharge',
    look: 'Navy/cyan speed suit, glowing bolt crest, Flash cowl with Manhattan forehead mark, red spikes',
    stats: { pwr: 3, spd: 5, sty: 4 },
  },

  // --- Night Circuit pawns ---
  {
    id: 'night-rust',
    codename: 'Kaneki',
    trueName: 'Ken Kaneki',
    piece: 'p',
    color: 'b',
    startSquare: 'a7',
    blurb:
      'Eyepatch ghoul — he runs the file fast and carves with a razor slash. Awakened Centipede: white hair, mask on, rinkaku tails that dismember.',
    gimmick: 'Rinkaku',
    look: 'Black fringe & eyepatch, black combat suit — awakens into white hair, centipede mask, four crimson kagune',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'night-static',
    codename: 'Arthur Pendragon',
    trueName: 'Arthur Boyle',
    piece: 'p',
    color: 'b',
    startSquare: 'b7',
    blurb:
      'Company 8 knight — he runs the file with plasma Excalibur, carving fire into every cut. Awakened: the blade balloons into a colossal sword that incinerates the pad.',
    gimmick: 'Excalibur',
    look: 'Blond topknot, blue eyes, dark bunker coat with neon cyan stripes, bronze crossguard Excalibur — huge ignited blade when awakened',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'night-brick',
    codename: 'Jin Mori',
    trueName: 'Jin Mori',
    piece: 'p',
    color: 'b',
    startSquare: 'c7',
    blurb:
      'God of High School — he sprints the file and stacks punches into kicks. Awakened Monkey King: rides Geindun, grows Yeoui, and flattens the square.',
    gimmick: 'Renewal',
    look: 'Spiky dark hair, green forehead goggles, white tee, jacket at the waist, blue pants, red boots — Monkey King: circlet, tiger sash, stone pillar, cloud',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'night-vein',
    codename: 'Gohan',
    trueName: 'Son Gohan',
    piece: 'p',
    color: 'b',
    startSquare: 'd7',
    blurb:
      'Runs the file in Piccolo orange — fingers to the brow, Special Beam Cannon. Awakened SSJ2: he vanishes, then a devastating punch-kick combo ends it.',
    gimmick: 'Potential Unleashed',
    look: 'Black spikes & orange gi with navy sash; SSJ2 flips gold hair, purple gi, red wraps, and crackling blue lightning',
    stats: { pwr: 5, spd: 4, sty: 4 },
  },
  {
    id: 'night-null',
    codename: 'Yuno',
    trueName: 'Yuno Grinberryall',
    piece: 'p',
    color: 'b',
    startSquare: 'e7',
    blurb:
      'Runs the file on wind magic — razor air cuts from the grimoire. Awakened Spirit Dive: fairy wings, green glow, flight, and crushing whirlwinds.',
    gimmick: 'Spirit Dive',
    look: 'Golden Dawn cape, messy black cowlick, amber eyes; Spirit Dive flips green wings, crown, and mana glow',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },
  {
    id: 'night-crow',
    codename: 'Zenitsu',
    trueName: 'Zenitsu Agatsuma',
    piece: 'p',
    color: 'b',
    startSquare: 'f7',
    blurb:
      'Runs the file with a sheathed Nichirin draw-cut. Awakened Thunder Breathing: yellow lightning shell, Flash-pace sprint, and lightning-powered katana slashes.',
    gimmick: 'Thunder Breathing',
    look: 'Yellow triangle haori, bowl-cut blond, dark gakuran; awaken encases him in yellow thunder',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
  {
    id: 'night-oil',
    codename: 'Ichigo',
    trueName: 'Ichigo Kurosaki',
    piece: 'p',
    color: 'b',
    startSquare: 'g7',
    blurb:
      'Shinigami substitute — he runs the file and carves with oversized Zangetsu. Awakened Final Getsuga: long black hair, void cloak, and a dark-dimension slash that erases the pad.',
    gimmick: 'Getsuga Tenshō',
    look: 'Spiky orange, black shihakushō, white sash, red beads, huge cleaver Zangetsu — Mugetsu flips long black hair, bandage seals, and an arm of black void',
    stats: { pwr: 5, spd: 5, sty: 5 },
  },
  {
    id: 'night-fang',
    codename: 'Gaara',
    trueName: 'Gaara',
    piece: 'p',
    color: 'b',
    startSquare: 'h7',
    blurb:
      'Kazekage of the sand — he runs the file and hurls crushing sand from the gourd. Awakened Shukaku: teleports through sand and entombs foes in a sand coffin.',
    gimmick: 'Sand Coffin',
    look: 'Red spikes, eye rings, forehead 愛, burgundy coat, gray flak, sand gourd — Shukaku flips to a sand tanuki shell with purple seals and one spiked tail',
    stats: { pwr: 5, spd: 3, sty: 4 },
  },

  // --- Night Circuit officers ---
  {
    id: 'night-sonic',
    codename: 'Red Riot',
    trueName: 'Eijiro Kirishima',
    piece: 'r',
    color: 'b',
    startSquare: 'a8',
    blurb: 'Hardens into Unbreakable form — runs the file as living armor, then smashes through with rocky fists.',
    gimmick: 'Unbreakable',
    look: 'Spiky crimson hair, jagged black jaw mask, gear pauldrons, bare torso, red R-belt waist-cape, baggy blacks, combat boots',
    stats: { pwr: 5, spd: 3, sty: 2 },
  },
  {
    id: 'night-hex',
    codename: 'Todo',
    trueName: 'Aoi Todo',
    piece: 'n',
    color: 'b',
    startSquare: 'b8',
    blurb: 'Claps once — Boogie Woogie swaps him behind you for a blue-flash smash.',
    gimmick: 'Boogie Woogie',
    look: 'High man-bun, left-eye scar, bare muscle, white obi over navy hakama',
    stats: { pwr: 5, spd: 4, sty: 3 },
  },
  {
    id: 'night-eclipse',
    codename: 'Hawks',
    trueName: 'Keigo Takami',
    piece: 'b',
    color: 'b',
    startSquare: 'c8',
    blurb: 'Owns the diagonal from the air — feather volleys pin anything that moves.',
    gimmick: 'Fierce Wings',
    look: 'Ash-blond sweep, yellow goggles, tan aviator jacket, huge crimson wings',
    stats: { pwr: 3, spd: 5, sty: 5 },
  },
  {
    id: 'night-nova',
    codename: 'Gilgamesh',
    trueName: 'Gilgamesh',
    piece: 'q',
    color: 'b',
    startSquare: 'd8',
    blurb: 'King of Heroes — flies in, opens the Gates of Babylon, rains blades until nothing stands.',
    gimmick: 'Gates of Babylon',
    look: 'Spiky blond, crimson eyes, ornate gold armor, red waist-cape',
    stats: { pwr: 5, spd: 4, sty: 5 },
  },
  {
    id: 'night-void',
    codename: 'Overhaul',
    trueName: 'Kai Chisaki',
    piece: 'k',
    color: 'b',
    startSquare: 'e8',
    blurb: 'Slow steps — one gloved touch and whatever stands in front comes apart.',
    gimmick: 'Overhaul',
    look: 'Plague beak mask, olive bomber, purple fur collar, white surgical gloves',
    stats: { pwr: 5, spd: 1, sty: 4 },
  },
  {
    id: 'night-razor',
    codename: 'Byakuya',
    trueName: 'Byakuya Kuchiki',
    piece: 'b',
    color: 'b',
    startSquare: 'f8',
    blurb: 'One cut — Senbonzakura blooms; pink petals carve the diagonal.',
    gimmick: 'Senbonzakura',
    look: 'Long black hair, white kenseikan, mint scarf, captain haori, Senbonzakura',
    stats: { pwr: 4, spd: 4, sty: 5 },
  },
  {
    id: 'night-moth',
    codename: 'Minato',
    trueName: 'Minato Namikaze',
    piece: 'n',
    color: 'b',
    startSquare: 'g8',
    blurb: 'Flash-throws a marked kunai, teleports above, Rasengan down.',
    gimmick: 'Flying Thunder God',
    look: 'Spiky blonde, leaf headband, white flame-hem haori, green flak, Flying Raijin kunai',
    stats: { pwr: 4, spd: 5, sty: 5 },
  },
  {
    id: 'night-plasma',
    codename: 'Accelerator',
    trueName: 'Accelerator',
    piece: 'r',
    color: 'b',
    startSquare: 'h8',
    blurb: 'Touch a vector and it answers to him — reflect, redirect, then erase the file.',
    gimmick: 'Vector Reflect',
    look: 'Albino white shag, blood-red eyes, black tee with white vector glyphs, pale grey pants',
    stats: { pwr: 4, spd: 5, sty: 4 },
  },
]

const byId = new Map(HEROES.map((h) => [h.id, h]))
const byStart = new Map(
  HEROES.map((h) => [`${h.color}:${h.startSquare}` as const, h]),
)

export function getHeroById(id: string | undefined | null): HeroDef | undefined {
  if (!id) return undefined
  return byId.get(id)
}

export function getHeroByStart(
  color: PieceColor,
  startSquare: Square,
): HeroDef | undefined {
  return byStart.get(`${color}:${startSquare}`)
}
