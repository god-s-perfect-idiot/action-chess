import type { HeroDef } from './heroes'
import {
  AWAKENED_DESIGNS,
  getHeroDesign,
  type HeroDesign,
} from './heroDesigns'
import { PIECE_CODENAME, type PieceType } from './types'

export type RosterClass = 'all' | PieceType

export interface AbilityCard {
  key: 'P' | 'Q' | 'R'
  label: string
  name: string
  blurb: string
}

export interface HeroRosterProfile {
  pieceLabel: string
  canAwaken: boolean
  difficulty: 1 | 2 | 3
  tags: string[]
  abilities: AbilityCard[]
  accent: string
  primary: string
  secondary: string
}

const PIECE_PASSIVE: Record<PieceType, { name: string; blurb: string }> = {
  p: {
    name: 'File Advance',
    blurb: 'Pushes the file one step at a time — promotion unlocks an awakened form.',
  },
  r: {
    name: 'File Lock',
    blurb: 'Owns rank and file lanes — straight-line pressure across the board.',
  },
  n: {
    name: 'L-Leap',
    blurb: 'Jumps the L — ignores blockers and lands where lanes cannot reach.',
  },
  b: {
    name: 'Diagonal Cut',
    blurb: 'Owns the long diagonals — angles in from squares the file cannot see.',
  },
  q: {
    name: 'Board Presence',
    blurb: 'Combines rook and bishop reach — the heaviest footprint on the board.',
  },
  k: {
    name: 'Command Seat',
    blurb: 'Slow, guarded steps — the match ends when this fighter falls.',
  },
}

const LOCO_BLURB: Record<string, string> = {
  run: 'Standard sprint across the pad.',
  dash: 'Low Naruto-dash — arms back, head down.',
  walk: 'Deliberate walk — never rushes the file.',
  leap: 'Bounding leap with hang-time between pads.',
  sprint: 'Inhuman sprint — blur across the file.',
  vector: 'Rides redirected vectors instead of running.',
  fly: 'Airborne travel — never touches the floor.',
  teleport: 'Blink relocation — no travel arc.',
}

function titleCase(raw: string): string {
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function firstSentence(text: string): string {
  const trimmed = text.trim()
  const m = trimmed.match(/^(.+?[.!?])(?:\s|$)/)
  return m?.[1] ?? trimmed
}

/** 1 easy · 2 medium · 3 hard — SPD + exotic locomotion push difficulty up. */
export function heroDifficulty(hero: HeroDef, design: HeroDesign): 1 | 2 | 3 {
  const loco = design.locomotion ?? 'run'
  const complex =
    loco === 'teleport' ||
    loco === 'vector' ||
    loco === 'fly' ||
    loco === 'sprint'
  let score = hero.stats.spd + (complex ? 2 : 0)
  if (hero.piece === 'q' || hero.piece === 'k') score += 1
  if (hero.piece === 'p' && AWAKENED_DESIGNS[hero.id]) score += 1
  if (score <= 3) return 1
  if (score <= 6) return 2
  return 3
}

function passiveCard(hero: HeroDef, design: HeroDesign): AbilityCard {
  const base = PIECE_PASSIVE[hero.piece]
  const loco = design.locomotion ?? 'run'
  const locoLine = LOCO_BLURB[loco] ?? LOCO_BLURB.run
  return {
    key: 'P',
    label: 'Passive',
    name: base.name,
    blurb: `${base.blurb} ${locoLine}`,
  }
}

function skillCard(hero: HeroDef, design: HeroDesign): AbilityCard {
  return {
    key: 'Q',
    label: 'Skill',
    name: hero.gimmick,
    blurb: `${firstSentence(hero.blurb)} Signature: ${titleCase(design.attack)}.`,
  }
}

function ultimateCard(hero: HeroDef, design: HeroDesign): AbilityCard {
  const awakened = AWAKENED_DESIGNS[hero.id]
  if (awakened) {
    return {
      key: 'R',
      label: 'Ultimate',
      name: `${hero.gimmick} — Awaken`,
      blurb: `Promotion flips the kit. Attack becomes ${titleCase(awakened.attack)}; move shifts to ${awakened.locomotion ?? design.locomotion ?? 'run'}.`,
    }
  }
  if (hero.piece === 'k') {
    return {
      key: 'R',
      label: 'Ultimate',
      name: 'Last Stand',
      blurb: `${hero.gimmick} when the king is pressed — check and mate flash the signature.`,
    }
  }
  if (hero.piece === 'q') {
    return {
      key: 'R',
      label: 'Ultimate',
      name: hero.gimmick,
      blurb: `Climax form of ${titleCase(design.attack)} — the board's heaviest finisher.`,
    }
  }
  return {
    key: 'R',
    label: 'Ultimate',
    name: `${hero.gimmick} Finisher`,
    blurb: `Full commit on ${titleCase(design.attack)}. ${firstSentence(hero.look)}`,
  }
}

export function getHeroRosterProfile(hero: HeroDef): HeroRosterProfile {
  const design = getHeroDesign(hero.id, hero.color)
  const canAwaken = hero.piece === 'p' && Boolean(AWAKENED_DESIGNS[hero.id])
  const difficulty = heroDifficulty(hero, design)
  const tags = [
    PIECE_CODENAME[hero.piece],
    ...(canAwaken ? ['Awaken'] : []),
    ...(design.locomotion && design.locomotion !== 'run'
      ? [titleCase(design.locomotion)]
      : []),
  ]

  return {
    pieceLabel: PIECE_CODENAME[hero.piece],
    canAwaken,
    difficulty,
    tags,
    abilities: [
      passiveCard(hero, design),
      skillCard(hero, design),
      ultimateCard(hero, design),
    ],
    accent: design.palette.accent,
    primary: design.palette.primary,
    secondary: design.palette.secondary,
  }
}

export function filterRoster(
  heroes: HeroDef[],
  opts: {
    classTab: RosterClass
    query: string
  },
): HeroDef[] {
  const q = opts.query.trim().toLowerCase()
  return heroes.filter((h) => {
    if (opts.classTab !== 'all' && h.piece !== opts.classTab) return false
    if (!q) return true
    const hay = `${h.codename} ${h.trueName} ${h.gimmick} ${PIECE_CODENAME[h.piece]}`.toLowerCase()
    return hay.includes(q)
  })
}

export function difficultyLabel(d: 1 | 2 | 3): string {
  return d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Hard'
}
