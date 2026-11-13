import type { HeroDesign } from './heroDesigns'

/**
 * Non-playable king bodyguards. Presentation only — never dealt onto the board.
 * Komamura guards Yamamoto; Chronostasis guards Overhaul.
 */

export interface ProtectorDef {
  id: string
  forKingId: string
  codename: string
  trueName: string
  blurb: string
  look: string
  design: HeroDesign
}

const KOMAMURA: HeroDesign = {
  body: 'titan',
  figure: 'm',
  tweak: { height: 1.02, bulk: 1.14, shoulders: 1.18, head: 1.06 },
  palette: {
    skin: '#c49a6c',
    hair: '#8a6240',
    hairAlt: '#6a4828',
    primary: '#12141a',
    secondary: '#16181e',
    accent: '#8a4030',
    trim: '#0a0b0e',
    metal: '#c8a050',
    eye: '#2a1810',
    glow: '#e8c878',
  },
  face: { eyes: 'hidden', brows: 'none', mouth: 'none' },
  hair: 'none',
  top: 'kimono',
  bottom: 'hakama',
  shoes: 'slippers',
  hands: 'bare',
  extras: ['komamuraSuit'],
  weapon: 'katana',
  idle: 'komamuraLean',
  attack: 'iaido',
  death: 'kneel',
  tempo: 0.55,
  locomotion: 'walk',
  stride: 0.7,
  moveSpeedMul: 0.55,
}

const CHRONOSTASIS: HeroDesign = {
  body: 'lean',
  figure: 'm',
  tweak: { height: 0.98, bulk: 0.9, shoulders: 0.94, head: 1.0 },
  palette: {
    skin: '#e8d0c0',
    hair: '#3a3438',
    hairAlt: '#1a1618',
    primary: '#d8d4d0',
    secondary: '#14161a',
    accent: '#8a1828',
    trim: '#2a2018',
    metal: '#d4a848',
    eye: '#e0b020',
    glow: '#c09030',
  },
  face: { eyes: 'hidden', brows: 'none', mouth: 'none' },
  hair: 'none',
  top: 'longcoat',
  bottom: 'pants',
  shoes: 'boots',
  hands: 'bare',
  extras: ['chronostasisSuit', 'hood'],
  weapon: 'katana',
  idle: 'chronoReach',
  attack: 'iaido',
  death: 'crumple',
  tempo: 0.7,
  locomotion: 'walk',
  stride: 0.55,
  moveSpeedMul: 0.7,
}

export const PROTECTORS: ProtectorDef[] = [
  {
    id: 'komamura',
    forKingId: 'yamamoto',
    codename: 'Komamura',
    trueName: 'Sajin Komamura',
    blurb: 'Body-flickers in when Yamamoto is locked — Tenken drawn, standing between the Captain-Commander and the file.',
    look: 'Wolf head, black shihakushō, white captain haori with red-gold shoulder armor, forearm & ankle plates, katana',
    design: KOMAMURA,
  },
  {
    id: 'chronostasis',
    forKingId: 'overhaul',
    codename: 'Chronostasis',
    trueName: 'Hari Kurono',
    blurb: 'Body-flickers in when Overhaul is locked — plague beak under the hood, blade out, clocking the threat.',
    look: 'Pale hooded coat with red lining, long plague beak, gold-rim lenses, black pants & boots, katana',
    design: CHRONOSTASIS,
  },
]

const byKing = new Map(PROTECTORS.map((p) => [p.forKingId, p]))
const byId = new Map(PROTECTORS.map((p) => [p.id, p]))

export function protectorForKing(heroId: string | null | undefined): ProtectorDef | null {
  if (!heroId) return null
  return byKing.get(heroId) ?? null
}

export function getProtectorById(id: string | null | undefined): ProtectorDef | null {
  if (!id) return null
  return byId.get(id) ?? null
}
