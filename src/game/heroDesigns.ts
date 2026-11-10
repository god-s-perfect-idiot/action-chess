/** Presentation-only character designs for the 32 starters (chess rules untouched). */

export type BodyType =
  | 'athletic'
  | 'lean'
  | 'tall'
  | 'petite'
  | 'heavy'
  | 'titan'
  | 'wiry'

export type Figure = 'm' | 'f'

export interface HeroPalette {
  skin: string
  hair: string
  hairAlt?: string
  /** Main garment (top). */
  primary: string
  /** Lower garment / inner layer. */
  secondary: string
  accent: string
  /** Dark detailing: belts, soles, straps. */
  trim: string
  metal?: string
  eye: string
  /** Unlit energy color for glowing bits + attack fx. */
  glow?: string
}

export type EyeStyle =
  | 'round'
  | 'sharp'
  | 'sleepy'
  | 'closed'
  | 'fierce'
  | 'glow'
  | 'hidden'
export type BrowStyle = 'soft' | 'angry' | 'flat' | 'raised' | 'none'
export type MouthStyle = 'line' | 'smile' | 'grin' | 'frown' | 'open' | 'fang' | 'none'
export type FaceMark =
  | 'freckles'
  | 'scarBrow'
  | 'scarCheek'
  | 'scarEye'
  | 'scarCross'
  | 'nosePaint'
  | 'circuit'
  | 'blush'
  | 'thread'
  | 'soot'
  | 'hawkMarks'

export type HairStyle =
  | 'spiky'
  | 'staticUp'
  | 'messy'
  | 'undercut'
  | 'buzz'
  | 'bun'
  | 'manBun'
  | 'bob'
  | 'coverEye'
  | 'long'
  | 'twinTails'
  | 'mohawk'
  | 'slicked'
  | 'sweptBack'
  | 'hime'
  | 'mane'
  | 'antenna'
  | 'twinTuft'
  | 'fringe'
  | 'shaggy'
  | 'braid'
  | 'braids'
  | 'feathers'
  | 'angular'
  | 'fluffy'
  | 'bowl'
  | 'pomp'
  | 'none'

export type TopStyle =
  | 'tank'
  | 'tee'
  | 'hoodie'
  | 'jacket'
  | 'bomber'
  | 'longcoat'
  | 'robe'
  | 'idolDress'
  | 'bodysuit'
  | 'vest'
  | 'gakuran'
  | 'kimono'
  | 'scrap'
  | 'labcoat'
  | 'windbreaker'
  | 'crop'

export type BottomStyle =
  | 'pants'
  | 'cargo'
  | 'shorts'
  | 'skirt'
  | 'hakama'
  | 'tights'
  | 'baggy'

export type ShoeStyle =
  | 'sneakers'
  | 'boots'
  | 'heels'
  | 'spikes'
  | 'thrusters'
  | 'engines'
  | 'platform'
  | 'talons'
  | 'greaves'
  | 'hexBoots'
  | 'slippers'

export type HandStyle =
  | 'bare'
  | 'wraps'
  | 'gloves'
  | 'mitts'
  | 'gauntletR'
  | 'claws'

export type Extra =
  | 'scarf'
  | 'longScarf'
  | 'goggles'
  | 'headphones'
  | 'headset'
  | 'cape'
  | 'mothWings'
  | 'hawksWings'
  | 'hawksSuit'
  | 'yunoSuit'
  | 'spiritDive'
  | 'halo'
  | 'qMask'
  | 'smileMask'
  | 'blankMask'
  | 'visor'
  | 'shades'
  | 'roundShades'
  | 'pauldrons'
  | 'medals'
  | 'beads'
  | 'hood'
  | 'antennaClips'
  | 'featherScarf'
  | 'gravityRings'
  | 'harness'
  | 'seal'
  | 'mouthguard'
  | 'kneePads'
  | 'elbowPads'
  | 'tiara'
  | 'veil'
  | 'cables'
  | 'helmet'
  | 'fangPendant'
  | 'hairPin'
  | 'shardCoat'
  | 'notePatches'
  | 'sparkCuffs'
  | 'arcSuit'
  | 'dominoMask'
  | 'engineVents'
  | 'springs'
  | 'pouches'
  | 'knifeCharm'
  | 'obi'
  | 'fortressPlate'
  | 'magCoils'
  | 'vectorTee'
  | 'riotGear'
  | 'lemillionSuit'
  | 'finralSuit'
  | 'todoKit'
  | 'minatoSuit'
  | 'byakuyaSuit'
  | 'deadshotSuit'
  | 'nanamiSuit'
  | 'gojoSuit'
  | 'gilgameshSuit'
  | 'overhaulSuit'
  | 'yamamotoSuit'
  | 'escanorSuit'
  | 'escanorPride'
  | 'mobSuit'
  | 'mobAwaken'
  | 'saitamaSuit'
  | 'guySuit'
  | 'eightGates'
  | 'dekuSuit'
  | 'dekuAwaken'
  | 'allMightSuit'
  | 'allMightTruth'
  | 'denjiSuit'
  | 'pochitaHell'
  | 'hakariSuit'
  | 'hakariJackpot'
  | 'kanekiSuit'
  | 'kanekiMask'
  | 'rinkaku'
  | 'moriSuit'
  | 'moriKing'
  | 'arthurSuit'
  | 'arthurAwaken'
  | 'gohanSuit'
  | 'gohanSsj2'
  | 'zenitsuSuit'
  | 'zenitsuAwaken'
  | 'ichigoSuit'
  | 'ichigoMugetsu'
  | 'gaaraSuit'
  | 'shukakuAwaken'

export type Weapon =
  | 'none'
  | 'micStaff'
  | 'needle'
  | 'scalpel'
  | 'cards'
  | 'hook'
  | 'scrapers'
  | 'katana'
  | 'stamp'
  | 'kunai'
  | 'cleaver'
  | 'staff'
  | 'rhitta'
  | 'yeoui'
  | 'excalibur'
  | 'excaliburHuge'
  | 'zangetsu'

export type IdleStyle =
  | 'warmup'
  | 'stretch'
  | 'sumo'
  | 'focused'
  | 'musicBob'
  | 'boxer'
  | 'shy'
  | 'lookout'
  | 'sprinter'
  | 'engineRev'
  | 'ninjaCrouch'
  | 'mirrorGaze'
  | 'idolPose'
  | 'commander'
  | 'prayer'
  | 'cardShuffle'
  | 'crackle'
  | 'speedCrouch'
  | 'slouch'
  | 'jitter'
  | 'armsCrossed'
  | 'scalpelTwirl'
  | 'glitch'
  | 'perch'
  | 'pockets'
  | 'feral'
  | 'coolStand'
  | 'kungfu'
  | 'float'
  | 'wingHover'
  | 'darkIdol'
  | 'lordly'
  | 'iaido'
  | 'flutter'
  | 'cocky'
  | 'tremor'
  | 'railHum'
  | 'millionSmile'
  | 'portalReady'
  | 'clapReady'
  | 'marksman'
  | 'ratioReady'
  | 'kingHover'
  | 'staffLean'
  | 'plagueReady'
  | 'sunshineStance'
  | 'niceGuy'
  | 'deadpan'
  | 'percentRage'
  | 'plusUltra'
  | 'truthStand'
  | 'denjiStand'
  | 'hellCrouch'
  | 'jackpotIdle'
  | 'ghoulReady'
  | 'centipedeIdle'
  | 'moriReady'
  | 'cloudHover'
  | 'knightReady'
  | 'gohanReady'
  | 'ssj2Ready'
  | 'thunderReady'
  | 'ichigoReady'
  | 'mugetsuReady'

export type AttackStyle =
  | 'flameKick'
  | 'magPull'
  | 'stomp'
  | 'thrust'
  | 'soundBlast'
  | 'shoulderCharge'
  | 'palmPush'
  | 'hookThrow'
  | 'dashStrike'
  | 'turboKick'
  | 'turboPunch'
  | 'flyingKick'
  | 'shardPalm'
  | 'spotlight'
  | 'powerPunch'
  | 'beam'
  | 'cardThrow'
  | 'thunderDrop'
  | 'gridStrike'
  | 'clawSwipe'
  | 'zap'
  | 'hammerFist'
  | 'slash'
  | 'erase'
  | 'peck'
  | 'slideKick'
  | 'pounce'
  | 'spinKick'
  | 'axeKick'
  | 'darkBeam'
  | 'featherShot'
  | 'micSwing'
  | 'gravitySlam'
  | 'iaido'
  | 'dustBurst'
  | 'tectonicRam'
  | 'railShot'
  | 'phasePunch'
  | 'portalGate'
  | 'boogieWoogie'
  | 'flyingRaijin'
  | 'wristShot'
  | 'ratioSlice'
  | 'senbonzakura'
  | 'murasaki'
  | 'gatesOfBabylon'
  | 'ryujinJakka'
  | 'overhaul'
  | 'emberFlick'
  | 'cruelSun'
  | 'mobPunch'
  | 'percentBlast'
  | 'seriousPunch'
  | 'leafCombo'
  | 'gatesBurn'
  | 'ofaPunch'
  | 'ofaSmash'
  | 'texasSmash'
  | 'unitedSmash'
  | 'chainsawRip'
  | 'heroOfHell'
  | 'jackpotRush'
  | 'jackpotBurst'
  | 'ghoulSlash'
  | 'rinkakuRip'
  | 'moriCombo'
  | 'yeouiCrush'
  | 'plasmaSlash'
  | 'excaliburInferno'
  | 'beamCannon'
  | 'ssj2Combo'
  | 'windSlash'
  | 'whirlwind'
  | 'thunderSlash'
  | 'thunderclapSlash'
  | 'zangetsuSlash'
  | 'getsugaSlash'
  | 'sandBarrage'
  | 'sandCoffin'

export type DeathStyle =
  | 'fallBack'
  | 'crumple'
  | 'spinOut'
  | 'launched'
  | 'dissolve'
  | 'shatter'
  | 'kneel'
  | 'faceplant'

export interface HeroDesign {
  body: BodyType
  figure: Figure
  /** Fine-tune on top of the body preset. */
  tweak?: { height?: number; bulk?: number; shoulders?: number; head?: number }
  palette: HeroPalette
  face: {
    eyes: EyeStyle
    brows: BrowStyle
    mouth: MouthStyle
    marks?: FaceMark[]
  }
  hair: HairStyle
  top: TopStyle
  bottom: BottomStyle
  shoes: ShoeStyle
  hands: HandStyle
  extras: Extra[]
  weapon: Weapon
  idle: IdleStyle
  attack: AttackStyle
  death: DeathStyle
  /** Idle speed multiplier. */
  tempo?: number
  /**
   * Locomotion override. Defaults to piece-type gait in Pieces
   * (pawn/bishop/queen run, rook dash, king walk, knight leap).
   */
  locomotion?: 'run' | 'dash' | 'walk' | 'leap' | 'sprint' | 'vector' | 'fly' | 'teleport'
  /** Local units per full run cycle. Smaller = faster leg cadence. */
  stride?: number
  /** Multiplier on the locomotion travel speed (e.g. 5 = five× sprint). */
  moveSpeedMul?: number
  /** Multiplier on signature attack playback (e.g. 6 = six× faster). */
  attackSpeedMul?: number
}

export const HERO_DESIGNS: Record<string, HeroDesign> = {
  // ───────────── Block Dawn ─────────────
  'dawn-cinder': {
    // Night form — frail bartender, small ember attacks.
    body: 'wiry',
    figure: 'm',
    tweak: { height: 0.96, bulk: 0.82, shoulders: 0.86, head: 1.06 },
    palette: {
      skin: '#f0d0b4',
      hair: '#e07028',
      hairAlt: '#b05018',
      primary: '#f2eee6',
      secondary: '#2a4a38',
      accent: '#8a3a28',
      trim: '#1a1814',
      metal: '#c8a050',
      eye: '#6a88b0',
      glow: '#ff8a2a',
    },
    face: { eyes: 'round', brows: 'raised', mouth: 'line' },
    hair: 'slicked',
    top: 'tee',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['escanorSuit'],
    weapon: 'none',
    idle: 'shy',
    attack: 'emberFlick',
    death: 'crumple',
    tempo: 0.85,
  },
  'dawn-latch': {
    // One Punch Man — bored Caped Baldy. Runs in, throws normal punches.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, bulk: 1.04, shoulders: 1.06, head: 1.02 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f0c8a4',
      primary: '#f0d020',
      secondary: '#e8c818',
      accent: '#e02028',
      trim: '#1a1a1e',
      metal: '#e8c040',
      eye: '#2a2a2e',
      glow: '#ffd050',
    },
    face: { eyes: 'sleepy', brows: 'flat', mouth: 'line' },
    hair: 'none',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['saitamaSuit'],
    weapon: 'none',
    idle: 'armsCrossed',
    attack: 'powerPunch',
    death: 'launched',
    tempo: 0.92,
    locomotion: 'run',
  },
  'dawn-stamp': {
    // Normal Mob — stiff bowl-cut schoolboy, walk + awkward punch.
    body: 'petite',
    figure: 'm',
    tweak: { height: 0.94, bulk: 0.9, shoulders: 0.92, head: 1.08 },
    palette: {
      skin: '#f0c8a8',
      hair: '#1a1820',
      hairAlt: '#2a2830',
      primary: '#12141a',
      secondary: '#16181e',
      accent: '#3a8a48',
      trim: '#0a0b0e',
      metal: '#e8c858',
      eye: '#2a221c',
      glow: '#a060e8',
    },
    face: { eyes: 'round', brows: 'flat', mouth: 'line' },
    hair: 'bowl',
    top: 'gakuran',
    bottom: 'pants',
    shoes: 'sneakers',
    hands: 'bare',
    extras: ['mobSuit'],
    weapon: 'none',
    idle: 'deadpan',
    attack: 'mobPunch',
    death: 'crumple',
    tempo: 0.7,
    locomotion: 'walk',
    stride: 0.48,
    moveSpeedMul: 0.55,
  },
  'dawn-needle': {
    // Might Guy — green jumpsuit, olive flak, orange warmers. Runs in, punch/kick combo.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.06, bulk: 1.08, shoulders: 1.1, head: 1.02 },
    palette: {
      skin: '#e8b888',
      hair: '#141218',
      hairAlt: '#2a2430',
      primary: '#1a5a38',
      secondary: '#8a9a48',
      accent: '#e07028',
      trim: '#1a2840',
      metal: '#c8ccd4',
      eye: '#3a2418',
      glow: '#ff6a28',
    },
    face: { eyes: 'fierce', brows: 'none', mouth: 'grin' },
    hair: 'bowl',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['guySuit'],
    weapon: 'none',
    idle: 'niceGuy',
    attack: 'leafCombo',
    death: 'launched',
    tempo: 1.2,
    /** Classic Leaf dash — arms swept back, head down. */
    locomotion: 'dash',
    stride: 0.48,
    moveSpeedMul: 1.85,
  },
  'dawn-chord': {
    // Deku — Gamma suit. Runs in, Full Cowl punches that explode on impact.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.0, bulk: 1.02, shoulders: 1.04, head: 1.04 },
    palette: {
      skin: '#f0c8a4',
      hair: '#1a4a38',
      hairAlt: '#0e2a22',
      primary: '#1b5e55',
      secondary: '#164a44',
      accent: '#c62828',
      trim: '#1a1a1e',
      metal: '#c8ccd4',
      eye: '#2a8a58',
      glow: '#40ff88',
    },
    face: { eyes: 'round', brows: 'soft', mouth: 'smile', marks: ['freckles'] },
    hair: 'messy',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['dekuSuit'],
    weapon: 'none',
    idle: 'focused',
    attack: 'ofaPunch',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.5,
    moveSpeedMul: 1.4,
  },
  'dawn-grit': {
    // All Might — thin True Form. Runs in, Texas Smash punch.
    body: 'wiry',
    figure: 'm',
    tweak: { height: 1.1, bulk: 0.72, shoulders: 0.82, head: 1.08 },
    palette: {
      skin: '#e8c4a0',
      hair: '#e8c838',
      hairAlt: '#c8a018',
      primary: '#1a4a98',
      secondary: '#143878',
      accent: '#c01828',
      trim: '#12161e',
      metal: '#e8c040',
      eye: '#40c8ff',
      glow: '#ffe040',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'grin', marks: ['soot', 'scarCheek'] },
    hair: 'twinTuft',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['allMightTruth'],
    weapon: 'none',
    idle: 'truthStand',
    attack: 'texasSmash',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 1.35,
  },
  'dawn-wisp': {
    // Denji — lanky Public Safety kid. Runs in; attack pulls the cord into Chainsaw Man.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.04, bulk: 0.92, shoulders: 0.96, head: 1.02 },
    palette: {
      skin: '#f0c8a4',
      hair: '#e8c040',
      hairAlt: '#c89828',
      primary: '#f4f2ee',
      secondary: '#3a3e48',
      accent: '#c82828',
      trim: '#5a3a28',
      metal: '#c8ccd4',
      eye: '#8a4830',
      glow: '#ff6a18',
    },
    face: { eyes: 'sleepy', brows: 'soft', mouth: 'fang', marks: ['soot'] },
    hair: 'messy',
    top: 'tee',
    bottom: 'pants',
    shoes: 'sneakers',
    hands: 'bare',
    extras: ['denjiSuit'],
    weapon: 'none',
    idle: 'denjiStand',
    attack: 'chainsawRip',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.5,
    moveSpeedMul: 1.25,
  },
  'dawn-hook': {
    // Hakari — bulky dark-green puffer, khaki baggies. Runs in, punch→kick combo.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.12, shoulders: 1.14, head: 1.02 },
    palette: {
      skin: '#d4a078',
      hair: '#e8d090',
      hairAlt: '#c8a858',
      primary: '#162820',
      secondary: '#b8a888',
      accent: '#e8c040',
      trim: '#0e1612',
      metal: '#d4b050',
      eye: '#2a2418',
      glow: '#b8ff48',
    },
    face: { eyes: 'sharp', brows: 'angry', mouth: 'smile' },
    hair: 'pomp',
    top: 'bomber',
    bottom: 'baggy',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['hakariSuit'],
    weapon: 'none',
    idle: 'pockets',
    attack: 'jackpotRush',
    death: 'launched',
    tempo: 1.1,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 1.35,
  },
  'dawn-rush': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.06, bulk: 1.08, shoulders: 1.1 },
    palette: {
      skin: '#e8c4a4',
      hair: '#1a2438',
      hairAlt: '#3a4a68',
      primary: '#f5f7fb',
      secondary: '#1a2438',
      accent: '#c9a04a',
      trim: '#121820',
      metal: '#9aa4b2',
      eye: '#1a2230',
      glow: '#6eb4ff',
    },
    face: { eyes: 'hidden', brows: 'none', mouth: 'none' },
    hair: 'none',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'engines',
    hands: 'gloves',
    extras: ['engineVents'],
    weapon: 'none',
    idle: 'engineRev',
    attack: 'turboPunch',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'sprint',
    /** Short stride → frantic engine cadence. */
    stride: 0.52,
    /** Inhuman pace — ~3× default sprint across the file. */
    moveSpeedMul: 3,
  },
  'dawn-vault': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.1, shoulders: 1.12 },
    palette: {
      skin: '#f0c4a0',
      hair: '#f0d048',
      hairAlt: '#e8b020',
      primary: '#f6f5f1',
      secondary: '#1a2a58',
      accent: '#f0c820',
      trim: '#8b1528',
      metal: '#d4a820',
      eye: '#2a4a9a',
      glow: '#2a9a7a',
    },
    face: { eyes: 'round', brows: 'raised', mouth: 'grin' },
    hair: 'spiky',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['lemillionSuit'],
    weapon: 'none',
    idle: 'millionSmile',
    attack: 'phasePunch',
    death: 'dissolve',
    tempo: 1.1,
    locomotion: 'teleport',
  },
  'dawn-deadshot': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, shoulders: 1.08, bulk: 1.04 },
    palette: {
      skin: '#c89068',
      hair: '#1a1410',
      primary: '#c41e2a',
      secondary: '#1a1e28',
      accent: '#d4a020',
      trim: '#0c0e14',
      metal: '#c8d0dc',
      eye: '#ff2020',
      glow: '#ff3a3a',
    },
    face: { eyes: 'hidden', brows: 'none', mouth: 'none' },
    hair: 'none',
    top: 'bodysuit',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['deadshotSuit', 'pauldrons', 'pouches', 'kneePads'],
    weapon: 'none',
    idle: 'marksman',
    attack: 'wristShot',
    death: 'crumple',
    tempo: 0.85,
  },
  'dawn-aria': {
    body: 'tall',
    figure: 'm',
    tweak: { height: 1.08, bulk: 0.96, shoulders: 1.02 },
    palette: {
      skin: '#f0c8a8',
      hair: '#f4f6fa',
      hairAlt: '#d8dce8',
      primary: '#12141c',
      secondary: '#1a1c28',
      accent: '#8b5cf6',
      trim: '#0a0c12',
      metal: '#c8ccd4',
      eye: '#7ec8ff',
      glow: '#c084fc',
    },
    face: { eyes: 'hidden', brows: 'soft', mouth: 'smile' },
    hair: 'staticUp',
    top: 'gakuran',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['gojoSuit'],
    weapon: 'none',
    idle: 'pockets',
    attack: 'murasaki',
    death: 'launched',
    tempo: 0.95,
    locomotion: 'run',
  },
  'dawn-boss': {
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.12, shoulders: 1.14, head: 0.96 },
    palette: {
      skin: '#d4a070',
      hair: '#f2eee6',
      hairAlt: '#c8c0b4',
      primary: '#12141a',
      secondary: '#16181e',
      accent: '#6a3a8a',
      trim: '#0a0b0e',
      metal: '#8a6240',
      eye: '#2a221c',
      glow: '#ff6a18',
    },
    face: { eyes: 'fierce', brows: 'none', mouth: 'line', marks: ['scarCross'] },
    hair: 'none',
    top: 'kimono',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['yamamotoSuit'],
    weapon: 'staff',
    idle: 'staffLean',
    attack: 'ryujinJakka',
    death: 'dissolve',
    tempo: 0.42,
    locomotion: 'walk',
    stride: 0.62,
    moveSpeedMul: 0.38,
  },
  'dawn-nanami': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.06, bulk: 1.04, shoulders: 1.06 },
    palette: {
      skin: '#e8c4a0',
      hair: '#d8b868',
      hairAlt: '#b89848',
      primary: '#3a6aa8',
      secondary: '#d0c0a0',
      accent: '#d4b050',
      trim: '#3a2a1c',
      metal: '#c0c4c8',
      eye: '#4a3228',
      glow: '#3a8a48',
    },
    face: { eyes: 'sharp', brows: 'flat', mouth: 'line' },
    hair: 'slicked',
    top: 'tee',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['nanamiSuit'],
    weapon: 'cleaver',
    idle: 'ratioReady',
    attack: 'ratioSlice',
    death: 'kneel',
    tempo: 0.7,
  },
  'dawn-riddle': {
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.04, bulk: 0.96, shoulders: 1.02 },
    palette: {
      skin: '#f0c8a8',
      hair: '#c4a070',
      hairAlt: '#8a6a48',
      primary: '#6b7a48',
      secondary: '#3a2a22',
      accent: '#d4b050',
      trim: '#161412',
      metal: '#c4ccd6',
      eye: '#7a4aaa',
      glow: '#d8e2ec',
    },
    face: { eyes: 'sharp', brows: 'soft', mouth: 'line' },
    hair: 'messy',
    top: 'kimono',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['finralSuit'],
    weapon: 'none',
    idle: 'portalReady',
    attack: 'portalGate',
    death: 'dissolve',
    tempo: 0.95,
    locomotion: 'teleport',
  },
  'dawn-volt': {
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.05, bulk: 0.98, shoulders: 1.06 },
    palette: {
      skin: '#e8c4a8',
      hair: '#e03820',
      hairAlt: '#ff6030',
      primary: '#1a4068',
      secondary: '#0c1830',
      accent: '#3ce8ff',
      trim: '#060c18',
      metal: '#c8f4ff',
      eye: '#5af0ff',
      glow: '#7af8ff',
    },
    face: { eyes: 'glow', brows: 'flat', mouth: 'line' },
    hair: 'spiky',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['dominoMask', 'arcSuit'],
    weapon: 'none',
    idle: 'speedCrouch',
    attack: 'gridStrike',
    death: 'launched',
    tempo: 1.2,
    locomotion: 'sprint',
    stride: 0.48,
    /** Speed Force blur — five× default sprint across the file. */
    moveSpeedMul: 5,
  },

  // ───────────── Night Circuit ─────────────
  'night-rust': {
    // Kaneki — black fringe, eyepatch, black combat suit. Fast run + razor slash.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.02, bulk: 0.94, shoulders: 0.98, head: 1.02 },
    palette: {
      skin: '#e8c8b0',
      hair: '#141218',
      hairAlt: '#2a2430',
      primary: '#12141a',
      secondary: '#1a1c22',
      accent: '#e8e8ee',
      trim: '#0a0b0e',
      metal: '#c8ccd4',
      eye: '#6a7080',
      glow: '#c01828',
    },
    face: { eyes: 'sharp', brows: 'soft', mouth: 'line' },
    hair: 'coverEye',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'sneakers',
    hands: 'claws',
    extras: ['kanekiSuit'],
    weapon: 'none',
    idle: 'ghoulReady',
    attack: 'ghoulSlash',
    death: 'launched',
    tempo: 1.1,
    locomotion: 'run',
    stride: 0.46,
    moveSpeedMul: 1.85,
  },
  'night-static': {
    // Arthur Boyle — Company 8 bunker coat, plasma Excalibur. Runs in, fire-sword cuts.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.06, shoulders: 1.1, head: 1.0 },
    palette: {
      skin: '#f0c8a4',
      hair: '#e8d070',
      hairAlt: '#c8a848',
      primary: '#2a2e36',
      secondary: '#1a1e26',
      accent: '#3ce0ff',
      trim: '#5a3a28',
      metal: '#c8a050',
      eye: '#3a78d0',
      glow: '#5af0ff',
    },
    face: { eyes: 'fierce', brows: 'flat', mouth: 'line' },
    hair: 'manBun',
    top: 'jacket',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['arthurSuit'],
    weapon: 'excalibur',
    idle: 'knightReady',
    attack: 'plasmaSlash',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 1.0,
  },
  'night-brick': {
    // Jin Mori — white tee, jacket at waist, green goggles. Sprints in, punch→kick.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, bulk: 1.02, shoulders: 1.04, head: 1.04 },
    palette: {
      skin: '#e8b890',
      hair: '#3a2418',
      hairAlt: '#1a120e',
      primary: '#f4f2ee',
      secondary: '#3a5a98',
      accent: '#c82828',
      trim: '#2a3448',
      metal: '#3a9848',
      eye: '#2a2218',
      glow: '#48c858',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'grin' },
    hair: 'spiky',
    top: 'tee',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'bare',
    extras: ['moriSuit', 'goggles'],
    weapon: 'none',
    idle: 'moriReady',
    attack: 'leafCombo',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'run',
    stride: 0.54,
    moveSpeedMul: 1.15,
  },
  'night-vein': {
    // Gohan — orange gi, navy sash. Runs in, Special Beam Cannon.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.08, shoulders: 1.1, head: 1.0 },
    palette: {
      skin: '#f0c8a4',
      hair: '#141218',
      hairAlt: '#2a2430',
      primary: '#e87820',
      secondary: '#1a2a58',
      accent: '#c01828',
      trim: '#12161e',
      metal: '#c8a878',
      eye: '#2a221c',
      glow: '#6ab0ff',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'line' },
    hair: 'spiky',
    top: 'tee',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['gohanSuit'],
    weapon: 'none',
    idle: 'gohanReady',
    attack: 'beamCannon',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.5,
    moveSpeedMul: 1.4,
  },
  'night-null': {
    // Yuno — Golden Dawn wind mage. Runs the file; air-blade cuts from the grimoire.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.05, bulk: 0.94, shoulders: 1.0, head: 1.0 },
    palette: {
      skin: '#f0c8a8',
      hair: '#1a1820',
      hairAlt: '#0c0c10',
      primary: '#f2eee8',
      secondary: '#1a2848',
      accent: '#c02828',
      trim: '#12141a',
      metal: '#d4b050',
      eye: '#c89828',
      glow: '#5ad878',
    },
    face: { eyes: 'sharp', brows: 'soft', mouth: 'line' },
    hair: 'messy',
    top: 'kimono',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['yunoSuit'],
    weapon: 'none',
    idle: 'focused',
    attack: 'windSlash',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.48,
    moveSpeedMul: 1.4,
  },
  'night-crow': {
    // Zenitsu — yellow triangle haori, dark gakuran, sheathed katana draw-cut.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.0, bulk: 0.94, shoulders: 0.98, head: 1.04 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f5d84a',
      hairAlt: '#e87820',
      primary: '#2a2218',
      secondary: '#f5d040',
      accent: '#ffe020',
      trim: '#121016',
      metal: '#c8ccd4',
      eye: '#5a3a18',
      glow: '#ffe848',
    },
    face: { eyes: 'sleepy', brows: 'raised', mouth: 'frown', marks: ['blush'] },
    hair: 'bowl',
    top: 'gakuran',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['zenitsuSuit'],
    weapon: 'katana',
    idle: 'thunderReady',
    attack: 'thunderSlash',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.48,
    moveSpeedMul: 1.05,
  },
  'night-oil': {
    // Ichigo — orange spikes, black shihakushō, oversized Zangetsu. Runs in, heavy slash.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.02, shoulders: 1.06, head: 1.0 },
    palette: {
      skin: '#f0c8a4',
      hair: '#e87828',
      hairAlt: '#c85818',
      primary: '#12141a',
      secondary: '#16181e',
      accent: '#c01828',
      trim: '#0a0b0e',
      metal: '#c8ccd4',
      eye: '#5a3a28',
      glow: '#ff6a28',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'line' },
    hair: 'spiky',
    top: 'kimono',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['ichigoSuit'],
    weapon: 'zangetsu',
    idle: 'ichigoReady',
    attack: 'zangetsuSlash',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 1.15,
  },
  'night-fang': {
    // Gaara — red spikes, eye rings, 愛 mark, burgundy coat, sand gourd; runs + sand attacks.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.0, bulk: 0.96, shoulders: 1.0, head: 1.02 },
    palette: {
      skin: '#f0c8a8',
      hair: '#c02828',
      hairAlt: '#8a1818',
      primary: '#6a1828',
      secondary: '#2a2c30',
      accent: '#c01828',
      trim: '#12141a',
      metal: '#5a6058',
      eye: '#48a898',
      glow: '#d4a868',
    },
    face: { eyes: 'sharp', brows: 'none', mouth: 'line' },
    hair: 'spiky',
    top: 'longcoat',
    bottom: 'pants',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['gaaraSuit'],
    weapon: 'none',
    idle: 'armsCrossed',
    attack: 'sandBarrage',
    death: 'launched',
    tempo: 1.0,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 0.95,
  },
  'night-sonic': {
    body: 'athletic',
    figure: 'm',
    tweak: { bulk: 1.04, shoulders: 1.08, height: 1.02 },
    palette: {
      // Bare torso — primary matches skin so the tank reads as skin.
      skin: '#c48a68',
      hair: '#e02028',
      hairAlt: '#ff4a3a',
      primary: '#c48a68',
      secondary: '#2a2c32',
      accent: '#b01820',
      trim: '#121416',
      metal: '#7a1418',
      eye: '#d02830',
      glow: '#ff5a40',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'grin', marks: ['scarBrow'] },
    hair: 'spiky',
    top: 'tank',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'bare',
    extras: ['riotGear'],
    weapon: 'none',
    idle: 'armsCrossed',
    attack: 'tectonicRam',
    death: 'shatter',
    tempo: 0.95,
    locomotion: 'run',
  },
  'night-hex': {
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.06, bulk: 1.08, shoulders: 1.12 },
    palette: {
      // Bare torso — primary matches skin so the tank reads as skin.
      skin: '#c48a68',
      hair: '#141218',
      hairAlt: '#2a2430',
      primary: '#c48a68',
      secondary: '#1a2740',
      accent: '#f2eee6',
      trim: '#0c0c10',
      metal: '#2a2420',
      eye: '#3a2418',
      glow: '#4ab8ff',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'grin', marks: ['scarEye'] },
    hair: 'manBun',
    top: 'tank',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['obi', 'todoKit'],
    weapon: 'none',
    idle: 'clapReady',
    attack: 'boogieWoogie',
    death: 'launched',
    tempo: 0.95,
    locomotion: 'teleport',
  },
  'night-eclipse': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, bulk: 0.96, shoulders: 1.04 },
    palette: {
      skin: '#e0b898',
      hair: '#d4b878',
      hairAlt: '#a88848',
      primary: '#c4a06a',
      secondary: '#b08c58',
      accent: '#e01828',
      trim: '#141418',
      metal: '#d4a840',
      eye: '#c88818',
      glow: '#f0c040',
    },
    face: { eyes: 'sharp', brows: 'soft', mouth: 'smile', marks: ['hawkMarks'] },
    hair: 'messy',
    top: 'bomber',
    bottom: 'cargo',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['hawksWings', 'hawksSuit', 'goggles'],
    weapon: 'none',
    idle: 'wingHover',
    attack: 'featherShot',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'leap',
    moveSpeedMul: 1.45,
  },
  'night-nova': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.05, bulk: 1.04, shoulders: 1.12 },
    palette: {
      skin: '#f0d0b8',
      hair: '#f0d040',
      hairAlt: '#d4a820',
      primary: '#e8c040',
      secondary: '#1a2848',
      accent: '#c01828',
      trim: '#141820',
      metal: '#f0d050',
      eye: '#d01828',
      glow: '#ffe060',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'grin' },
    hair: 'spiky',
    top: 'bodysuit',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['gilgameshSuit'],
    weapon: 'none',
    idle: 'kingHover',
    attack: 'gatesOfBabylon',
    death: 'launched',
    tempo: 0.7,
    locomotion: 'fly',
    moveSpeedMul: 1.25,
  },
  'night-void': {
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, bulk: 0.98, shoulders: 1.04 },
    palette: {
      skin: '#e0b898',
      hair: '#5a3848',
      hairAlt: '#3a2434',
      primary: '#3d4a30',
      secondary: '#14161a',
      accent: '#5a2a68',
      trim: '#5a3a28',
      metal: '#d4a848',
      eye: '#e0b020',
      glow: '#9a1828',
    },
    face: { eyes: 'sharp', brows: 'angry', mouth: 'none' },
    hair: 'messy',
    top: 'bomber',
    bottom: 'pants',
    shoes: 'sneakers',
    hands: 'gloves',
    extras: ['overhaulSuit'],
    weapon: 'none',
    idle: 'plagueReady',
    attack: 'overhaul',
    death: 'kneel',
    tempo: 0.5,
    locomotion: 'walk',
    stride: 0.42,
    /** Methodical king pace — deliberate, never a sprint. */
    moveSpeedMul: 0.55,
    /** Slow reach → touch → total dismember. */
    attackSpeedMul: 0.85,
  },
  'night-razor': {
    body: 'tall',
    figure: 'm',
    tweak: { height: 1.06, bulk: 0.88, shoulders: 0.94 },
    palette: {
      skin: '#e8d0c0',
      hair: '#1a1820',
      hairAlt: '#2c2834',
      primary: '#12141a',
      secondary: '#16181e',
      accent: '#8ecbb8',
      trim: '#0a0b0e',
      metal: '#6a4a82',
      eye: '#8a9098',
      glow: '#ff8ec8',
    },
    face: { eyes: 'sharp', brows: 'flat', mouth: 'line' },
    hair: 'long',
    top: 'kimono',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['byakuyaSuit'],
    weapon: 'katana',
    idle: 'iaido',
    attack: 'senbonzakura',
    death: 'shatter',
    tempo: 0.55,
  },
  'night-moth': {
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.04, bulk: 0.96, shoulders: 1.02 },
    palette: {
      skin: '#f0c8a8',
      hair: '#f5d84a',
      hairAlt: '#d4b028',
      primary: '#f2f0ea',
      secondary: '#5a6b38',
      accent: '#c01828',
      trim: '#1a2840',
      metal: '#c8ccd4',
      eye: '#3a78d0',
      glow: '#ffe040',
    },
    face: { eyes: 'sharp', brows: 'soft', mouth: 'line' },
    hair: 'spiky',
    top: 'vest',
    bottom: 'pants',
    shoes: 'slippers',
    hands: 'wraps',
    extras: ['minatoSuit'],
    weapon: 'kunai',
    idle: 'ninjaCrouch',
    attack: 'flyingRaijin',
    death: 'launched',
    tempo: 1.05,
    // Hold on the pad, hurl a marked kunai, snap onto the mark — no leap arc.
    locomotion: 'teleport',
  },
  'night-plasma': {
    body: 'wiry',
    figure: 'm',
    tweak: { height: 1.03, bulk: 0.9, shoulders: 0.94 },
    palette: {
      skin: '#f4ebe4',
      hair: '#f2f2f4',
      hairAlt: '#c8c8d0',
      primary: '#17191f',
      secondary: '#d6d6dc',
      accent: '#f4f4f8',
      trim: '#0c0e12',
      metal: '#e8e8ee',
      eye: '#ff2030',
      glow: '#ff4058',
    },
    face: { eyes: 'glow', brows: 'flat', mouth: 'grin' },
    hair: 'shaggy',
    top: 'tee',
    bottom: 'pants',
    shoes: 'sneakers',
    hands: 'bare',
    extras: ['vectorTee'],
    weapon: 'none',
    idle: 'cocky',
    attack: 'railShot',
    death: 'launched',
    tempo: 0.95,
    /** No run — shove air vectors and ride the kick. */
    locomotion: 'vector',
    moveSpeedMul: 1.35,
    /** Vector-redirected strike — ~6× normal attack tempo. */
    attackSpeedMul: 6,
  },
}

const FALLBACK_W: HeroDesign = HERO_DESIGNS['dawn-cinder']
const FALLBACK_B: HeroDesign = HERO_DESIGNS['night-rust']

/**
 * Per-hero awakened overrides for promoted pawns.
 * Fill these in as character designs land — same look for every q/r/b/n choice.
 * Missing entries fall back to `placeholderAwaken(base)`.
 */
export const AWAKENED_DESIGNS: Partial<Record<string, HeroDesign>> = {
  'dawn-cinder': {
    // Day form — Pride of the Lion, Divine Axe Rhitta, Cruel Sun.
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.14, bulk: 1.28, shoulders: 1.32, head: 0.92 },
    palette: {
      skin: '#f2d4b8',
      hair: '#e07028',
      hairAlt: '#b05018',
      // Shirtless — primary matches skin so the tank reads as bare muscle.
      primary: '#f2d4b8',
      secondary: '#2a4a38',
      accent: '#f0c040',
      trim: '#5a3a28',
      metal: '#e8c858',
      eye: '#6a88b0',
      glow: '#ff6a18',
    },
    face: { eyes: 'fierce', brows: 'flat', mouth: 'line' },
    hair: 'slicked',
    top: 'tank',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['escanorPride'],
    weapon: 'rhitta',
    idle: 'sunshineStance',
    attack: 'cruelSun',
    death: 'launched',
    tempo: 0.72,
    locomotion: 'walk',
    stride: 0.7,
    moveSpeedMul: 0.85,
  },
  'dawn-latch': {
    // Serious Mode — same suit, sharper face; teleports in, one explosive punch.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.18, shoulders: 1.16, head: 0.98 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f0c8a4',
      primary: '#f0d020',
      secondary: '#e8c818',
      accent: '#e02028',
      trim: '#1a1a1e',
      metal: '#e8c040',
      eye: '#101014',
      glow: '#ff6030',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'line' },
    hair: 'none',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['saitamaSuit'],
    weapon: 'none',
    idle: 'focused',
    attack: 'seriousPunch',
    death: 'launched',
    tempo: 1.05,
    locomotion: 'teleport',
    moveSpeedMul: 2.4,
  },
  'dawn-needle': {
    // Eighth Gate — crimson steam, red hair up, teleport in, burning punch.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.14, shoulders: 1.16, head: 1.0 },
    palette: {
      skin: '#a84838',
      hair: '#ff2020',
      hairAlt: '#ff6030',
      primary: '#143828',
      secondary: '#6a7a38',
      accent: '#ff4020',
      trim: '#1a2840',
      metal: '#c8ccd4',
      eye: '#ffffff',
      glow: '#ff4820',
    },
    face: { eyes: 'glow', brows: 'none', mouth: 'open' },
    hair: 'staticUp',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['eightGates'],
    weapon: 'none',
    idle: 'focused',
    attack: 'gatesBurn',
    death: 'launched',
    tempo: 1.35,
    locomotion: 'teleport',
    moveSpeedMul: 2.6,
    /** Blistering taijutsu — Gates speed reads as a near-instant flurry. */
    attackSpeedMul: 2.2,
  },
  'dawn-stamp': {
    // ???% — spiky hair, white-out eyes, purple/black psychic flicker, explosive beams.
    body: 'lean',
    figure: 'm',
    tweak: { height: 0.98, bulk: 0.94, shoulders: 0.96, head: 1.06 },
    palette: {
      skin: '#1a1218',
      hair: '#0c0a10',
      hairAlt: '#a040e8',
      primary: '#0c0a10',
      secondary: '#161018',
      accent: '#c040ff',
      trim: '#060408',
      metal: '#e8e8f0',
      eye: '#ffffff',
      glow: '#ff40c8',
    },
    face: { eyes: 'glow', brows: 'none', mouth: 'line' },
    hair: 'staticUp',
    top: 'gakuran',
    bottom: 'pants',
    shoes: 'sneakers',
    hands: 'bare',
    extras: ['mobAwaken'],
    weapon: 'none',
    idle: 'percentRage',
    attack: 'percentBlast',
    death: 'launched',
    tempo: 1.35,
    locomotion: 'dash',
    stride: 0.38,
    moveSpeedMul: 4.2,
    attackSpeedMul: 2.4,
  },
  'dawn-chord': {
    // Full Cowl 100% — battle-torn Gamma suit, cyan OFA aura; teleports in, punch→kick detonations.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.02, bulk: 1.1, shoulders: 1.1, head: 1.02 },
    palette: {
      skin: '#f0c8a4',
      hair: '#1a5a44',
      hairAlt: '#40ff88',
      primary: '#164a44',
      secondary: '#123830',
      accent: '#c62828',
      trim: '#121416',
      metal: '#d0d4dc',
      eye: '#40ff88',
      glow: '#2affc8',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'open', marks: ['freckles'] },
    hair: 'staticUp',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['dekuAwaken'],
    weapon: 'none',
    idle: 'focused',
    attack: 'ofaSmash',
    death: 'launched',
    tempo: 1.2,
    locomotion: 'teleport',
    moveSpeedMul: 2.5,
    attackSpeedMul: 1.25,
  },
  'dawn-grit': {
    // Muscle form — Symbol of Peace. Leaps in fast, chains explosive punches.
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.14, bulk: 1.34, shoulders: 1.38, head: 0.9 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f0d048',
      hairAlt: '#e8b020',
      primary: '#1a4a98',
      secondary: '#143878',
      accent: '#c01828',
      trim: '#12161e',
      metal: '#e8c040',
      eye: '#1a1a20',
      glow: '#ffe060',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'grin' },
    hair: 'twinTuft',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['allMightSuit'],
    weapon: 'none',
    idle: 'plusUltra',
    attack: 'unitedSmash',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'leap',
    moveSpeedMul: 2.4,
    attackSpeedMul: 1.2,
  },
  'dawn-wisp': {
    // Hero of Hell — four-armed Chainsaw Devil. Brutal full-body dismemberment.
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.12, bulk: 1.32, shoulders: 1.38, head: 0.95 },
    palette: {
      skin: '#1a2438',
      hair: '#121820',
      hairAlt: '#2a3448',
      primary: '#162038',
      secondary: '#0e1524',
      accent: '#c01828',
      trim: '#080c14',
      metal: '#a8b0bc',
      eye: '#e8e8f0',
      glow: '#ff40a8',
    },
    face: { eyes: 'hidden', brows: 'none', mouth: 'none' },
    hair: 'none',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'greaves',
    hands: 'claws',
    extras: ['pochitaHell'],
    weapon: 'none',
    idle: 'hellCrouch',
    attack: 'heroOfHell',
    death: 'shatter',
    tempo: 1.2,
    locomotion: 'dash',
    stride: 0.42,
    moveSpeedMul: 1.85,
    attackSpeedMul: 1.15,
  },
  'dawn-hook': {
    // Jackpot — golden-green aura, domain grin; blinks in, detonating punch rush.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.1, bulk: 1.18, shoulders: 1.2, head: 1.02 },
    palette: {
      skin: '#d4a078',
      hair: '#f0e070',
      hairAlt: '#a8ff40',
      primary: '#1a3828',
      secondary: '#c8b898',
      accent: '#ffe040',
      trim: '#0c1810',
      metal: '#ffe868',
      eye: '#d0ff48',
      glow: '#c8ff38',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'grin' },
    hair: 'pomp',
    top: 'bomber',
    bottom: 'baggy',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['hakariSuit', 'hakariJackpot'],
    weapon: 'none',
    idle: 'jackpotIdle',
    attack: 'jackpotBurst',
    death: 'launched',
    tempo: 1.25,
    locomotion: 'teleport',
    moveSpeedMul: 3.2,
    attackSpeedMul: 1.4,
  },
  'night-rust': {
    // Centipede — white hair, ghoul mask, black suit, four rinkaku; superfast dismembering.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.06, shoulders: 1.08, head: 1.0 },
    palette: {
      skin: '#e8c8b0',
      hair: '#f2f0f4',
      hairAlt: '#d0ccd4',
      primary: '#101218',
      secondary: '#16181e',
      accent: '#e8e8ee',
      trim: '#08090c',
      metal: '#c8ccd4',
      eye: '#ff2030',
      glow: '#c01828',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'none' },
    hair: 'messy',
    top: 'bodysuit',
    bottom: 'tights',
    shoes: 'sneakers',
    hands: 'claws',
    extras: ['kanekiSuit', 'kanekiMask', 'rinkaku'],
    weapon: 'none',
    idle: 'centipedeIdle',
    attack: 'rinkakuRip',
    death: 'launched',
    tempo: 1.3,
    locomotion: 'dash',
    stride: 0.38,
    moveSpeedMul: 3.6,
    attackSpeedMul: 1.35,
  },
  'night-static': {
    // Awakened knight — fat wide blue plasma Excalibur, fire damage on the slam.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.14, shoulders: 1.16, head: 0.98 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f0d878',
      hairAlt: '#c8a848',
      primary: '#22262e',
      secondary: '#161a22',
      accent: '#3ce0ff',
      trim: '#5a3a28',
      metal: '#e8c050',
      eye: '#5af0ff',
      glow: '#5af0ff',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'grin' },
    hair: 'manBun',
    top: 'jacket',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'gloves',
    extras: ['arthurSuit', 'arthurAwaken'],
    weapon: 'excaliburHuge',
    idle: 'knightReady',
    attack: 'excaliburInferno',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'run',
    stride: 0.52,
    moveSpeedMul: 1.1,
    attackSpeedMul: 1.15,
  },
  'night-vein': {
    // SSJ2 — gold spikes, purple gi, red wraps; teleports in, devastating punch→kick.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.06, bulk: 1.16, shoulders: 1.18, head: 0.98 },
    palette: {
      skin: '#f0c8a4',
      hair: '#f0d040',
      hairAlt: '#ffe868',
      primary: '#3a2a58',
      secondary: '#2a1e42',
      accent: '#c01828',
      trim: '#12141a',
      metal: '#c8ccd4',
      eye: '#40c8a8',
      glow: '#5af0ff',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'line' },
    hair: 'staticUp',
    top: 'tank',
    bottom: 'pants',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['gohanSsj2'],
    weapon: 'none',
    idle: 'ssj2Ready',
    attack: 'ssj2Combo',
    death: 'launched',
    tempo: 1.2,
    locomotion: 'teleport',
    moveSpeedMul: 2.6,
    attackSpeedMul: 1.3,
  },
  'night-brick': {
    // Monkey King — circlet, tiger sash, Yeoui, Geindun cloud ride; grows the pillar and crushes.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.04, bulk: 1.08, shoulders: 1.1, head: 1.02 },
    palette: {
      skin: '#e8b890',
      hair: '#2a1a12',
      hairAlt: '#14100c',
      primary: '#1a1410',
      secondary: '#7a9ab8',
      accent: '#c01828',
      trim: '#3a2a18',
      metal: '#8a8880',
      eye: '#ff2030',
      glow: '#ffe040',
    },
    face: { eyes: 'glow', brows: 'angry', mouth: 'grin' },
    hair: 'spiky',
    top: 'crop',
    bottom: 'baggy',
    shoes: 'boots',
    hands: 'wraps',
    extras: ['moriKing'],
    weapon: 'yeoui',
    idle: 'cloudHover',
    attack: 'yeouiCrush',
    death: 'launched',
    tempo: 1.2,
    locomotion: 'fly',
    moveSpeedMul: 2.2,
    attackSpeedMul: 1.15,
  },
  'night-null': {
    // Spirit Dive — fairy wings, green mana glow, flight, whirlwind assault.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.06, bulk: 0.96, shoulders: 1.04, head: 1.0 },
    palette: {
      skin: '#f0c8a8',
      hair: '#1a1820',
      hairAlt: '#0c0c10',
      primary: '#e8f4e0',
      secondary: '#143828',
      accent: '#40ff88',
      trim: '#0c1810',
      metal: '#a8ffd0',
      eye: '#60ff98',
      glow: '#40ff88',
    },
    face: { eyes: 'glow', brows: 'soft', mouth: 'line' },
    hair: 'messy',
    top: 'kimono',
    bottom: 'pants',
    shoes: 'boots',
    hands: 'bare',
    extras: ['yunoSuit', 'spiritDive'],
    weapon: 'none',
    idle: 'flutter',
    attack: 'whirlwind',
    death: 'launched',
    tempo: 1.15,
    locomotion: 'fly',
    moveSpeedMul: 1.7,
    attackSpeedMul: 1.15,
  },
  'night-fang': {
    // Shukaku — sand tanuki shell, purple seal veins, spiked tail; teleports in sand, entombs foes.
    body: 'titan',
    figure: 'm',
    tweak: { height: 1.12, bulk: 1.32, shoulders: 1.4, head: 1.08 },
    palette: {
      skin: '#f0c8a8',
      hair: '#c02828',
      hairAlt: '#8a1818',
      primary: '#c8a878',
      secondary: '#2a2c30',
      accent: '#6a2868',
      trim: '#12141a',
      metal: '#3a3c40',
      eye: '#e8d878',
      glow: '#e8c878',
    },
    face: { eyes: 'glow', brows: 'none', mouth: 'grin' },
    hair: 'none',
    top: 'tank',
    bottom: 'pants',
    shoes: 'slippers',
    hands: 'claws',
    extras: ['shukakuAwaken'],
    weapon: 'none',
    idle: 'feral',
    attack: 'sandCoffin',
    death: 'dissolve',
    tempo: 1.1,
    locomotion: 'teleport',
    moveSpeedMul: 2.2,
    attackSpeedMul: 1.1,
  },
  'night-crow': {
    // Thunder Breathing awaken — asleep eyes, yellow thunder shell, Flash-pace sprint, lightning katana.
    body: 'lean',
    figure: 'm',
    tweak: { height: 1.0, bulk: 0.96, shoulders: 1.0, head: 1.04 },
    palette: {
      skin: '#f0c8a4',
      hair: '#ffe848',
      hairAlt: '#ff9020',
      primary: '#2a2218',
      secondary: '#ffe020',
      accent: '#ffe848',
      trim: '#121016',
      metal: '#fff8c8',
      eye: '#ffe848',
      glow: '#ffe848',
    },
    face: { eyes: 'closed', brows: 'flat', mouth: 'line' },
    hair: 'bowl',
    top: 'gakuran',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'bare',
    extras: ['zenitsuSuit', 'zenitsuAwaken'],
    weapon: 'katana',
    idle: 'speedCrouch',
    attack: 'thunderclapSlash',
    death: 'launched',
    tempo: 1.25,
    locomotion: 'sprint',
    stride: 0.48,
    moveSpeedMul: 5,
    attackSpeedMul: 1.35,
  },
  'night-oil': {
    // Final Getsuga Tenshō — long black hair, grey seals, void cloak; fast dash + dark-dimension slash.
    body: 'athletic',
    figure: 'm',
    tweak: { height: 1.08, bulk: 1.12, shoulders: 1.14, head: 0.98 },
    palette: {
      skin: '#6a7888',
      hair: '#0c0e14',
      hairAlt: '#1a2030',
      // Bare torso — primary matches skin so the tank reads as sealed flesh.
      primary: '#6a7888',
      secondary: '#080a10',
      accent: '#1a2438',
      trim: '#040508',
      metal: '#2a3448',
      eye: '#c8d0dc',
      glow: '#2848a8',
    },
    face: { eyes: 'fierce', brows: 'angry', mouth: 'none' },
    hair: 'long',
    top: 'tank',
    bottom: 'hakama',
    shoes: 'slippers',
    hands: 'wraps',
    extras: ['ichigoMugetsu'],
    weapon: 'none',
    idle: 'mugetsuReady',
    attack: 'getsugaSlash',
    death: 'dissolve',
    tempo: 1.2,
    locomotion: 'dash',
    stride: 0.38,
    moveSpeedMul: 3.8,
    attackSpeedMul: 1.25,
  },
}

/** Temporary awaken look until each pawn gets a authored override. */
export function placeholderAwaken(base: HeroDesign): HeroDesign {
  const glow = base.palette.glow ?? base.palette.accent
  const extras = base.extras.includes('halo')
    ? base.extras
    : ([...base.extras, 'halo'] as HeroDesign['extras'])
  return {
    ...base,
    tweak: {
      height: (base.tweak?.height ?? 1) * 1.04,
      bulk: (base.tweak?.bulk ?? 1) * 1.06,
      shoulders: (base.tweak?.shoulders ?? 1) * 1.05,
      head: base.tweak?.head,
    },
    palette: {
      ...base.palette,
      accent: glow,
      glow,
      eye: glow,
    },
    face: {
      ...base.face,
      eyes: base.face.eyes === 'hidden' ? 'hidden' : 'glow',
      brows: base.face.brows === 'none' ? 'none' : 'angry',
      mouth:
        base.face.mouth === 'none'
          ? 'none'
          : base.face.mouth === 'fang'
            ? 'fang'
            : 'grin',
    },
    extras,
    idle: base.idle === 'shy' || base.idle === 'slouch' ? 'focused' : base.idle,
    tempo: (base.tempo ?? 1) * 1.12,
    // Leave locomotion unset so post-promo gait follows chess role (q/r/b/n).
    locomotion: undefined,
  }
}

export function getHeroDesign(
  heroId: string | null | undefined,
  color: 'w' | 'b',
  opts?: { awakened?: boolean },
): HeroDesign {
  const base =
    (heroId && HERO_DESIGNS[heroId]) ||
    (color === 'w' ? FALLBACK_W : FALLBACK_B)
  if (!opts?.awakened) return base
  if (heroId && AWAKENED_DESIGNS[heroId]) return AWAKENED_DESIGNS[heroId]!
  return placeholderAwaken(base)
}
