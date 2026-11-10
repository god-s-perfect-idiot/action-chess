import type { ReactNode } from 'react'
import type * as THREE from 'three'
import type { HeroDesign, TopStyle } from '../../game/heroDesigns'
import type { FighterMaterials } from './materials'
import { P } from './Part'
import type { BoneName, Proportions } from './rig'
import { S } from './shapes'

export interface Ctx {
  d: HeroDesign
  pr: Proportions
  M: FighterMaterials
  add: (bone: BoneName, node: ReactNode) => void
  has: (extra: HeroDesign['extras'][number]) => boolean
}

type Sleeve = 'none' | 'short' | 'long' | 'wide' | 'puff'

const TOPS: Record<TopStyle, { sleeve: Sleeve; bulk: number; midriff?: boolean }> = {
  tank: { sleeve: 'none', bulk: 1 },
  tee: { sleeve: 'short', bulk: 1.02 },
  crop: { sleeve: 'short', bulk: 1, midriff: true },
  hoodie: { sleeve: 'long', bulk: 1.14 },
  jacket: { sleeve: 'long', bulk: 1.08 },
  bomber: { sleeve: 'long', bulk: 1.26 },
  longcoat: { sleeve: 'long', bulk: 1.08 },
  robe: { sleeve: 'wide', bulk: 1.1 },
  idolDress: { sleeve: 'puff', bulk: 1 },
  bodysuit: { sleeve: 'long', bulk: 0.97 },
  vest: { sleeve: 'none', bulk: 1.06 },
  gakuran: { sleeve: 'long', bulk: 1.06 },
  kimono: { sleeve: 'wide', bulk: 1.06 },
  scrap: { sleeve: 'long', bulk: 1.14 },
  labcoat: { sleeve: 'long', bulk: 1.06 },
  windbreaker: { sleeve: 'long', bulk: 1.42 },
}

function sides(fn: (s: 1 | -1, l: 'l' | 'r') => void) {
  fn(1, 'l')
  fn(-1, 'r')
}

export function buildBody(c: Ctx) {
  const { d, pr, M, add, has } = c
  const top = TOPS[d.top]
  const L = pr.limb
  const robeLegs = d.top === 'robe'
  const topMat = M.primary
  /** Flash Manhattan — unified navy suit; skip belt buckle / default piping. */
  const voltSplit = has('arcSuit')
  const engineArmor = has('engineVents')
  const cuff =
    d.top === 'bodysuit'
      ? voltSplit
        ? M.primary
        : engineArmor ||
            has('saitamaSuit') ||
            has('guySuit') ||
            has('eightGates') ||
            has('dekuSuit') ||
            has('dekuAwaken') ||
            has('allMightSuit') ||
            has('allMightTruth')
          ? M.secondary
          : M.accent
      : M.trim

  // ── Pelvis ──
  const pelvisMat = robeLegs || voltSplit ? M.primary : M.secondary
  add(
    'pelvis',
    <P s={S.box(pr.pelvisW, 0.11, pr.pelvisD, 0.04)} m={pelvisMat} p={[0, -0.005, 0]} />,
  )
  if (
    !robeLegs &&
    !voltSplit &&
    d.top !== 'idolDress' &&
    d.bottom !== 'skirt' &&
    !has('saitamaSuit') &&
    !has('dekuSuit') &&
    !has('dekuAwaken') &&
    !has('allMightSuit') &&
    !has('allMightTruth') &&
    !has('gohanSuit') &&
    !has('gohanSsj2') &&
    !has('zenitsuSuit') &&
    !has('zenitsuAwaken') &&
    !has('ichigoSuit') &&
    !has('ichigoMugetsu')
  ) {
    add(
      'pelvis',
      <P s={S.box(pr.pelvisW * 1.04, 0.022, pr.pelvisD * 1.06, 0.01)} m={M.trim} p={[0, 0.04, 0]} />,
    )
    add('pelvis', <P s={S.box(0.03, 0.026, 0.01, 0.004)} m={M.metal} p={[0, 0.04, pr.pelvisD * 0.54]} />)
  }

  // ── Legs ──
  const thR0 = (pr.fem ? 0.055 : 0.051) * L
  const thR1 = 0.037 * L
  const shR0 = 0.035 * L
  const shR1 = 0.025 * L
  const flare =
    robeLegs ? 0.07 : d.bottom === 'hakama' ? 0.06 : d.bottom === 'baggy' ? 0.025 : 0
  const legMatBase = robeLegs || voltSplit ? M.primary : M.secondary

  sides((s, l) => {
    const thigh = `${l}Thigh` as BoneName
    const shin = `${l}Shin` as BoneName
    const legMat = legMatBase
    if (flare > 0) {
      const tTop = thR0 * 1.25
      const tBot = tTop + flare * 0.6
      const sBot = tBot + flare * 0.5
      add(thigh, <P s={S.cyl(tTop, tBot, pr.thigh + 0.02, 12)} m={legMat} p={[0, -pr.thigh / 2, 0]} />)
      add(thigh, <P s={S.sphere(tBot * 0.98, 12, 8)} m={legMat} p={[0, -pr.thigh, 0]} />)
      add(
        shin,
        <P s={S.cyl(tBot, sBot, pr.shin * 0.9, 12)} m={legMat} p={[0, -pr.shin * 0.43, 0]} />,
      )
      if (d.bottom === 'hakama' || robeLegs) {
        add(
          shin,
          <P s={S.box(0.006, pr.shin * 0.8, 0.006, 0.002)} m={M.trim} line={false} p={[0, -pr.shin * 0.42, sBot * 0.92]} r={[-0.15, 0, 0]} />,
        )
      }
      if (d.bottom === 'baggy') {
        add(shin, <P s={S.cyl(sBot * 0.8, sBot * 0.7, 0.04, 12)} m={M.trim} p={[0, -pr.shin + 0.02, 0]} />)
      }
      return
    }

    const fitted = d.bottom === 'tights' ? 0.97 : 1.08
    if (d.bottom === 'shorts' || d.bottom === 'skirt') {
      add(thigh, <P s={S.limb(thR0, thR1, pr.thigh)} m={M.skin} />)
      if (d.bottom === 'shorts') {
        add(
          thigh,
          <P s={S.cyl(thR0 * 1.18, thR0 * 1.12, pr.thigh * 0.42, 12)} m={M.secondary} p={[0, -pr.thigh * 0.19, 0]} />,
        )
        add(shin, <P s={S.limb(shR0, shR1, pr.shin)} m={M.skin} />)
        add(shin, <P s={S.cyl(shR1 * 1.2, shR1 * 1.15, 0.05, 10)} m={M.light} p={[0, -pr.shin + 0.04, 0]} />)
      } else {
        // Over-knee stockings.
        add(thigh, <P s={S.cyl(thR1 * 1.12, thR1 * 1.06, pr.thigh * 0.4, 12)} m={M.trim} p={[0, -pr.thigh * 0.8, 0]} />)
        add(shin, <P s={S.limb(shR0 * 1.04, shR1 * 1.04, pr.shin)} m={M.trim} />)
      }
    } else {
      add(thigh, <P s={S.limb(thR0 * fitted, thR1 * fitted, pr.thigh)} m={legMat} />)
      add(shin, <P s={S.limb(shR0 * fitted, shR1 * fitted, pr.shin)} m={legMat} />)
      if (d.bottom === 'cargo') {
        add(
          thigh,
          <P s={S.box(0.03, 0.07, 0.055, 0.01)} m={M.secondary} p={[s * thR0 * 1.0, -pr.thigh * 0.5, 0]} />,
        )
        add(shin, <P s={S.cyl(shR1 * 1.35, shR1 * 1.3, 0.035, 10)} m={M.secondary} p={[0, -pr.shin + 0.035, 0]} />)
      }
      if (
        d.bottom === 'tights' &&
        d.top === 'bodysuit' &&
        !voltSplit &&
        !engineArmor &&
        !has('saitamaSuit') &&
        !has('guySuit') &&
        !has('eightGates') &&
        !has('dekuSuit') &&
        !has('dekuAwaken') &&
        !has('allMightSuit') &&
        !has('allMightTruth') &&
        !has('kanekiSuit')
      ) {
        add(
          thigh,
          <P s={S.box(0.008, pr.thigh * 0.9, 0.012, 0.003)} m={M.accent} line={false} p={[s * thR0 * 0.92, -pr.thigh * 0.48, 0]} />,
        )
      }
    }
  })

  if (d.bottom === 'skirt' && !robeLegs) {
    const r0 = pr.pelvisW * 0.56
    add('pelvis', <P s={S.cyl(r0, r0 + 0.07, 0.11, 14)} m={M.secondary} p={[0, -0.06, 0]} />)
    add('pelvis', <P s={S.cyl(r0 + 0.072, r0 + 0.08, 0.016, 14)} m={M.accent} p={[0, -0.118, 0]} />)
  }

  // ── Abdomen + chest ──
  const tb = top.bulk
  const abMat = top.midriff ? M.skin : topMat
  add(
    'spine',
    <P s={S.box(pr.waistW * tb, pr.abdomen + 0.05, pr.chestD * 0.86 * tb, 0.04)} m={abMat} p={[0, pr.abdomen / 2, 0]} />,
  )
  if (top.midriff) {
    add('spine', <P s={S.box(0.012, 0.012, 0.004, 0.003)} m={M.skinShade} line={false} p={[0, pr.abdomen * 0.35, pr.chestD * 0.44]} />)
  }
  add(
    'chest',
    <P s={S.box(pr.chestW * tb, pr.chestH, pr.chestD * tb, 0.045)} m={topMat} p={[0, pr.chestH * 0.5, 0]} />,
  )
  if (pr.fem) {
    sides((s) =>
      add(
        'chest',
        <P s={S.sphere(pr.chestW * 0.2, 12, 10)} m={topMat} p={[s * pr.chestW * 0.21, pr.chestH * 0.5, pr.chestD * tb * 0.36]} sc={[1, 0.85, 0.75]} />,
      ),
    )
  } else if (top.sleeve === 'none' && d.top !== 'vest') {
    // Pecs read through a tank.
    sides((s) =>
      add(
        'chest',
        <P s={S.box(pr.chestW * 0.42, pr.chestH * 0.34, 0.03, 0.014)} m={topMat} p={[s * pr.chestW * 0.22, pr.chestH * 0.64, pr.chestD * 0.47]} />,
      ),
    )
  }

  // ── Neck ──
  add('neck', <P s={S.cyl(0.026 * Math.sqrt(L), 0.031 * Math.sqrt(L), pr.neck + 0.04, 10)} m={M.skin} p={[0, pr.neck / 2, 0]} />)

  // ── Arms ──
  const uR0 = 0.034 * L * (top.sleeve === 'long' ? tb : 1)
  const uR1 = 0.027 * L * (top.sleeve === 'long' ? tb : 1)
  const fR0 = 0.027 * L * (top.sleeve === 'long' ? tb : 1)
  const fR1 = 0.021 * L * (top.sleeve === 'long' ? Math.min(tb, 1.15) : 1)
  sides((s, l) => {
    const upper = `${l}Upper` as BoneName
    const fore = `${l}Fore` as BoneName
    const upperMat = top.sleeve === 'none' ? M.skin : topMat
    const foreMat = top.sleeve === 'long' ? topMat : M.skin
    add(upper, <P s={S.sphere(uR0 * 1.22, 12, 10)} m={upperMat} p={[s * 0.004, -0.006, 0]} />)
    add(upper, <P s={S.limb(uR0, uR1, pr.upperArm)} m={upperMat} />)
    add(fore, <P s={S.limb(fR0, fR1, pr.forearm)} m={foreMat} />)
    if (top.sleeve === 'short') {
      add(upper, <P s={S.cyl(uR0 * 1.25, uR0 * 1.3, pr.upperArm * 0.5, 12)} m={topMat} p={[0, -pr.upperArm * 0.22, 0]} />)
    }
    if (top.sleeve === 'puff') {
      add(upper, <P s={S.sphere(uR0 * 1.9, 12, 10)} m={topMat} p={[s * 0.006, -0.02, 0]} />)
      add(upper, <P s={S.torus(uR1 * 1.15, 0.008, Math.PI * 2, 14)} m={M.accent} p={[0, -pr.upperArm * 0.42, 0]} r={[Math.PI / 2, 0, 0]} />)
    }
    if (top.sleeve === 'wide') {
      add(
        fore,
        <P s={S.cyl(fR0 * 1.6, fR0 * 3.1, pr.forearm * 0.95, 14, true)} m={topMat} p={[0, -pr.forearm * 0.52, 0]} />,
      )
      add(upper, <P s={S.cyl(uR0 * 1.25, uR0 * 1.7, pr.upperArm * 1.02, 12)} m={topMat} p={[0, -pr.upperArm * 0.5, 0]} />)
    }
    if (top.sleeve === 'long') {
      add(fore, <P s={S.cyl(fR1 * 1.22, fR1 * 1.25, 0.03, 12)} m={cuff} p={[0, -pr.forearm + 0.012, 0]} />)
    }
  })

  buildTop(c, tb)
  buildShoes(c)
  buildHands(c)
}

function buildTop(c: Ctx, tb: number) {
  const { d, pr, M, add } = c
  const cw = pr.chestW * tb
  const cd = pr.chestD * tb
  const front = cd * 0.5
  const ch = pr.chestH

  switch (d.top) {
    case 'tank':
      add('chest', <P s={S.torus(0.05, 0.007, Math.PI, 12)} m={M.trim} line={false} p={[0, ch * 0.98, front * 0.6]} r={[0.25, 0, Math.PI]} />)
      break
    case 'tee':
      add('chest', <P s={S.torus(0.04, 0.008, Math.PI * 2, 14)} m={M.trim} p={[0, ch * 0.99, 0.008]} r={[Math.PI / 2 - 0.2, 0, 0]} />)
      if (!c.has('vectorTee') && !c.has('gohanSuit')) {
        add('chest', <P s={S.box(cw * 0.5, ch * 0.3, 0.012, 0.006)} m={M.accent} line={false} p={[0, ch * 0.55, front + 0.002]} />)
      }
      break
    case 'crop':
      add('chest', <P s={S.box(cw * 1.02, 0.02, cd * 1.02, 0.008)} m={M.accent} p={[0, 0.01, 0]} />)
      break
    case 'hoodie': {
      if (!c.has('hood')) {
        add('chest', <P s={S.torus(0.06, 0.03, Math.PI * 2, 14)} m={M.primary} p={[0, ch * 0.98, -cd * 0.22]} r={[Math.PI / 2 + 0.5, 0, 0]} />)
      }
      add('spine', <P s={S.box(pr.waistW * tb * 0.7, pr.abdomen * 0.55, 0.02, 0.008)} m={M.secondary} p={[0, pr.abdomen * 0.35, pr.chestD * 0.86 * tb * 0.5]} />)
      sides((s) =>
        add('chest', <P s={S.cyl(0.004, 0.004, 0.07, 6)} m={M.light} line={false} p={[s * 0.022, ch * 0.75, front + 0.004]} />),
      )
      add('spine', <P s={S.box(pr.waistW * tb * 1.04, 0.03, pr.chestD * 0.9 * tb, 0.012)} m={M.trim} p={[0, -0.005, 0]} />)
      break
    }
    case 'jacket':
    case 'labcoat': {
      add('chest', <P s={S.box(cw * 0.3, ch * 0.92, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.47, front + 0.002]} />)
      add('spine', <P s={S.box(pr.waistW * tb * 0.3, pr.abdomen, 0.02, 0.008)} m={M.secondary} p={[0, pr.abdomen * 0.5, pr.chestD * 0.86 * tb * 0.5 + 0.002]} />)
      sides((s) => {
        add('chest', <P s={S.box(0.03, ch * 0.5, 0.012, 0.005)} m={M.primary} p={[s * cw * 0.17, ch * 0.72, front + 0.01]} r={[0, 0, s * 0.35]} />)
        add('chest', <P s={S.box(0.04, 0.06, 0.04, 0.012)} m={M.primary} p={[s * cw * 0.2, ch * 1.0, -0.01]} r={[0.3, 0, s * -0.3]} />)
      })
      if (d.top === 'labcoat') addCoatTails(c, M.primary, 0.95, true)
      else add('spine', <P s={S.box(pr.waistW * tb * 1.08, 0.05, pr.chestD * 0.92 * tb, 0.015)} m={M.primary} p={[0, 0.0, 0]} />)
      break
    }
    case 'bomber':
      add('chest', <P s={S.torus(0.05, 0.02, Math.PI * 2, 14)} m={M.trim} p={[0, ch * 0.98, 0]} r={[Math.PI / 2, 0, 0]} />)
      add('spine', <P s={S.box(pr.waistW * tb * 1.08, 0.04, pr.chestD * 0.9 * tb, 0.015)} m={M.trim} p={[0, 0.0, 0]} />)
      add('chest', <P s={S.box(0.008, ch * 0.9, 0.008, 0.003)} m={M.metal} line={false} p={[0, ch * 0.47, front + 0.002]} />)
      add('chest', <P s={S.box(0.05, 0.05, 0.01, 0.01)} m={M.accent} p={[-cw * 0.25, ch * 0.62, front + 0.004]} />)
      break
    case 'longcoat': {
      add('chest', <P s={S.box(cw * 0.26, ch * 0.92, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.47, front + 0.002]} />)
      // High collar.
      add('chest', <P s={S.cyl(0.06, 0.055, 0.07, 14, true)} m={M.primary} p={[0, ch * 1.02, -0.005]} />)
      sides((s) =>
        add('chest', <P s={S.box(0.012, ch * 0.7, 0.012, 0.004)} m={M.accent} line={false} p={[s * cw * 0.15, ch * 0.5, front + 0.008]} />),
      )
      add('spine', <P s={S.box(pr.waistW * tb * 1.05, 0.03, pr.chestD * 0.9 * tb, 0.012)} m={M.trim} p={[0, 0.01, 0]} />)
      addCoatTails(c, M.primary, 1.1, false)
      break
    }
    case 'robe':
      add('chest', <P s={S.box(0.03, ch * 0.9, 0.014, 0.006)} m={M.secondary} p={[0.02, ch * 0.5, front + 0.004]} r={[0, 0, -0.45]} />)
      add('chest', <P s={S.box(0.03, ch * 0.9, 0.014, 0.006)} m={M.secondary} p={[-0.02, ch * 0.5, front + 0.006]} r={[0, 0, 0.45]} />)
      add('spine', <P s={S.box(pr.waistW * tb * 1.1, 0.045, pr.chestD * 0.92 * tb, 0.015)} m={M.secondary} p={[0, 0.02, 0]} />)
      addCoatTails(c, M.primary, 1.25, false)
      break
    case 'idolDress': {
      add('chest', <P s={S.box(0.05, 0.035, 0.03, 0.012)} m={M.accent} p={[0, ch * 0.88, front + 0.01]} />)
      sides((s) =>
        add('chest', <P s={S.cone(0.032, 0.06, 4)} m={M.accent} p={[s * 0.038, ch * 0.88, front + 0.01]} r={[0, 0, s * -Math.PI / 2]} />),
      )
      const r0 = pr.pelvisW * 0.58
      add('pelvis', <P s={S.cyl(r0, r0 + 0.09, 0.1, 16)} m={M.primary} p={[0, -0.05, 0]} />)
      add('pelvis', <P s={S.cyl(r0 + 0.04, r0 + 0.12, 0.06, 16)} m={M.secondary} p={[0, -0.09, 0]} />)
      add('pelvis', <P s={S.torus(r0 + 0.12, 0.01, Math.PI * 2, 20)} m={M.trim} p={[0, -0.12, 0]} r={[Math.PI / 2, 0, 0]} />)
      add('spine', <P s={S.box(pr.waistW * 1.06, 0.035, pr.chestD * 0.9, 0.012)} m={M.accent} p={[0, 0.01, 0]} />)
      break
    }
    case 'bodysuit':
      if (
        !c.has('arcSuit') &&
        !c.has('saitamaSuit') &&
        !c.has('guySuit') &&
        !c.has('eightGates') &&
        !c.has('dekuSuit') &&
        !c.has('dekuAwaken') &&
        !c.has('allMightSuit') &&
        !c.has('allMightTruth')
      ) {
        sides((s) =>
          add('chest', <P s={S.box(0.01, ch * 0.95, 0.012, 0.004)} m={M.accent} line={false} p={[s * cw * 0.49, ch * 0.5, 0]} />),
        )
        add('chest', <P s={S.box(cw * 0.5, 0.018, 0.012, 0.005)} m={M.accent} line={false} p={[0, ch * 0.55, front + 0.003]} r={[0, 0, 0.0]} />)
      }
      add('chest', <P s={S.torus(0.045, 0.012, Math.PI * 2, 14)} m={M.primary} p={[0, ch * 1.0, 0]} r={[Math.PI / 2, 0, 0]} />)
      break
    case 'vest':
      add('chest', <P s={S.box(cw * 0.34, ch * 0.95, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.48, front + 0.002]} />)
      sides((s) => {
        add('chest', <P s={S.box(0.045, 0.04, 0.02, 0.008)} m={M.primary} p={[s * cw * 0.3, ch * 0.45, front + 0.01]} />)
        add('chest', <P s={S.box(0.012, 0.012, 0.012, 0.003)} m={M.metal} line={false} p={[s * cw * 0.3, ch * 0.48, front + 0.022]} />)
      })
      break
    case 'gakuran':
      add('chest', <P s={S.cyl(0.05, 0.052, 0.06, 14)} m={M.primary} p={[0, ch * 1.02, 0]} />)
      for (let i = 0; i < 4; i++) {
        add('chest', <P s={S.sphere(0.009, 8, 6)} m={M.metal} line={false} p={[0, ch * (0.85 - i * 0.22), front + 0.004]} />)
      }
      add('spine', <P s={S.box(pr.waistW * tb * 1.1, 0.06, pr.chestD * 0.92 * tb, 0.015)} m={M.primary} p={[0, 0.0, 0]} />)
      addCoatTails(c, M.primary, 0.55, false)
      break
    case 'kimono':
      add('chest', <P s={S.box(0.026, ch * 0.95, 0.014, 0.006)} m={M.secondary} p={[0.02, ch * 0.5, front + 0.004]} r={[0, 0, -0.5]} />)
      add('chest', <P s={S.box(0.026, ch * 0.95, 0.014, 0.006)} m={M.secondary} p={[-0.025, ch * 0.5, front + 0.007]} r={[0, 0, 0.5]} />)
      break
    case 'scrap':
      add('chest', <P s={S.box(cw * 0.36, ch * 0.3, 0.018, 0.006)} m={M.metal} p={[-cw * 0.18, ch * 0.66, front + 0.006]} r={[0, 0, 0.12]} />)
      add('chest', <P s={S.box(cw * 0.3, ch * 0.24, 0.018, 0.006)} m={M.accent} p={[cw * 0.2, ch * 0.32, front + 0.006]} r={[0, 0, -0.18]} />)
      for (let i = 0; i < 3; i++) {
        add('chest', <P s={S.sphere(0.008, 6, 6)} m={M.metal} line={false} p={[-cw * 0.32 + i * 0.03, ch * 0.78, front + 0.016]} />)
      }
      sides((s, l) =>
        add(`${l}Upper` as BoneName, <P s={S.box(0.07, 0.05, 0.075, 0.012)} m={M.metal} p={[s * 0.01, 0.025, 0]} r={[0, 0, s * -0.3]} />),
      )
      add('chest', <P s={S.torus(0.06, 0.022, Math.PI * 2, 14)} m={M.secondary} p={[0, ch * 0.98, 0]} r={[Math.PI / 2, 0, 0]} />)
      break
    case 'windbreaker':
      add('chest', <P s={S.box(0.01, ch * 0.95, 0.01, 0.003)} m={M.trim} line={false} p={[0, ch * 0.48, front + 0.002]} />)
      add('chest', <P s={S.box(cw * 1.01, 0.03, cd * 1.01, 0.012)} m={M.secondary} p={[0, ch * 0.55, 0]} />)
      add('chest', <P s={S.cyl(0.065, 0.07, 0.08, 14, true)} m={M.primary} p={[0, ch * 1.0, 0]} />)
      add('spine', <P s={S.box(pr.waistW * tb * 1.05, 0.08, pr.chestD * 0.95 * tb, 0.03)} m={M.primary} p={[0, -0.01, 0]} />)
      break
  }
}

/** Coat tails hang from a swaying bone at the back of the pelvis. */
function addCoatTails(c: Ctx, m: THREE.Material, length: number, open: boolean) {
  const { pr, add, M } = c
  const len = pr.thigh * length
  const w = pr.pelvisW * 1.15
  add('tails', <P s={S.panel(w, len, 0.022, -0.04)} m={m} p={[0, -len / 2, -0.008]} r={[0.03, 0, 0]} />)
  sides((s) => {
    add(
      'tails',
      <P
        s={S.panel(pr.pelvisD * 0.95, len * 0.96, 0.02)}
        m={m}
        p={[s * w * 0.52, -len * 0.48, pr.pelvisD * 0.42]}
        r={[0, s * Math.PI / 2, s * -0.06]}
      />,
    )
    if (!open) {
      add(
        'tails',
        <P s={S.panel(w * 0.32, len * 0.9, 0.018)} m={m} p={[s * w * 0.34, -len * 0.45, pr.pelvisD * 0.98]} r={[0, 0, s * -0.08]} />,
      )
    }
  })
  add('tails', <P s={S.box(w * 1.02, 0.014, 0.024, 0.005)} m={M.trim} line={false} p={[0, -len + 0.006, -0.008]} />)
}

function buildShoes(c: Ctx) {
  const { d, pr, M, add, has } = c
  const A = pr.ankle
  const FL = pr.footL
  const fw = 0.068 * Math.sqrt(pr.limb)
  const shR1 = 0.025 * pr.limb
  // Custom boots are fully built in extras.
  if (
    has('lemillionSuit') ||
    has('finralSuit') ||
    has('yunoSuit') ||
    has('todoKit') ||
    has('minatoSuit') ||
    has('byakuyaSuit') ||
    has('gojoSuit') ||
    has('gilgameshSuit') ||
    has('overhaulSuit') ||
    has('escanorSuit') ||
    has('escanorPride') ||
    has('saitamaSuit') ||
    has('mobSuit') ||
    has('guySuit') ||
    has('eightGates') ||
    has('dekuSuit') ||
    has('dekuAwaken') ||
    has('allMightSuit') ||
    has('allMightTruth') ||
    has('denjiSuit') ||
    has('kanekiSuit') ||
    has('gohanSuit') ||
    has('gohanSsj2') ||
    has('moriSuit') ||
    has('moriKing') ||
    has('zenitsuSuit') ||
    has('zenitsuAwaken') ||
    has('ichigoSuit') ||
    has('ichigoMugetsu') ||
    has('gaaraSuit') ||
    has('shukakuAwaken')
  )
    return

  sides((s, l) => {
    const foot = `${l}Foot` as BoneName
    const shin = `${l}Shin` as BoneName
    const sole = (m: THREE.Material, h: number) =>
      add(foot, <P s={S.box(fw, h, FL + 0.05, h * 0.4)} m={m} p={[0, -A + h / 2, FL * 0.32]} />)
    const upper = (m: THREE.Material, h: number, wScale = 0.92) =>
      add(foot, <P s={S.box(fw * wScale, h, FL + 0.02, 0.02)} m={m} p={[0, -A + 0.02 + h / 2, FL * 0.28]} />)
    const shaft = (m: THREE.Material, h: number, r = 1.4) =>
      add(shin, <P s={S.cyl(shR1 * r, shR1 * r * 1.08, h, 12)} m={m} p={[0, -pr.shin + h / 2 - 0.01, 0]} />)

    switch (d.shoes) {
      case 'sneakers':
        sole(M.light, 0.024)
        upper(M.accent, 0.05)
        add(foot, <P s={S.box(fw * 0.94, 0.008, 0.05, 0.003)} m={M.light} line={false} p={[s * 0.001, -A + 0.05, FL * 0.4]} r={[0.3, 0, 0]} />)
        break
      case 'boots':
        if (has('arcSuit')) {
          sole(M.primary, 0.024)
          upper(M.primary, 0.06)
          shaft(M.primary, 0.15)
        } else {
          sole(M.dark, 0.024)
          upper(M.trim, 0.06)
          shaft(M.trim, 0.15)
          add(shin, <P s={S.cyl(shR1 * 1.58, shR1 * 1.58, 0.016, 12)} m={M.metal} p={[0, -pr.shin + 0.13, 0]} />)
        }
        break
      case 'heels':
        add(foot, <P s={S.box(fw * 0.8, 0.04, FL + 0.03, 0.016)} m={M.trim} p={[0, -A + 0.034, FL * 0.38]} r={[0.12, 0, 0]} />)
        add(foot, <P s={S.cyl(0.006, 0.01, 0.05, 6)} m={M.trim} p={[0, -A + 0.025, -0.01]} />)
        shaft(M.trim, 0.2, 1.25)
        break
      case 'spikes':
        add(foot, <P s={S.box(fw * 0.86, 0.045, FL + 0.05, 0.018)} m={M.accent} p={[0, -A + 0.024, FL * 0.32]} />)
        add(foot, <P s={S.box(fw * 0.9, 0.012, FL * 0.7, 0.004)} m={M.light} line={false} p={[0, -A + 0.035, FL * 0.38]} r={[0, s * 0.4, 0]} />)
        for (let i = 0; i < 3; i++) {
          add(foot, <P s={S.cone(0.006, 0.016, 4)} m={M.metal} line={false} p={[(i - 1) * 0.02, -A - 0.004, FL * 0.6]} r={[Math.PI, 0, 0]} />)
        }
        break
      case 'thrusters':
        sole(M.dark, 0.028)
        upper(M.secondary, 0.06)
        shaft(M.secondary, 0.12)
        add(foot, <P s={S.cyl(0.02, 0.026, 0.05, 10)} m={M.metal} p={[0, -A + 0.04, -0.04]} r={[-1.2, 0, 0]} />)
        add(foot, <P s={S.cone(0.018, 0.06, 8)} m={M.glow} line={false} shadow={false} p={[0, -A + 0.03, -0.08]} r={[-1.9, 0, 0]} />)
        break
      case 'engines': {
        // Revs greaves — white plate boots, grey soles, gold ankle pivots, heel jets.
        sole(M.metal, 0.026)
        upper(M.primary, 0.058)
        add(foot, <P s={S.box(fw * 0.88, 0.018, FL * 0.55, 0.006)} m={M.primary} p={[0, -A + 0.055, FL * 0.42]} r={[0.25, 0, 0]} />)
        shaft(M.primary, 0.18, 1.65)
        add(shin, <P s={S.box(0.08 * pr.limb, pr.shin * 0.55, 0.07 * pr.limb, 0.016)} m={M.primary} p={[0, -pr.shin * 0.55, 0.01]} />)
        add(shin, <P s={S.box(0.055 * pr.limb, 0.04, 0.03, 0.01)} m={M.metal} p={[0, -pr.shin * 0.4, 0.04 * pr.limb]} />)
        add(shin, <P s={S.cyl(0.016 * pr.limb, 0.016 * pr.limb, 0.014, 12)} m={M.accent} p={[s * 0.04 * pr.limb, -pr.shin + 0.04, 0]} r={[0, 0, Math.PI / 2]} />)
        add(shin, <P s={S.cyl(0.022 * pr.limb, 0.03 * pr.limb, 0.045, 10)} m={M.metal} p={[0, -pr.shin * 0.78, -0.045 * pr.limb]} r={[0.4, 0, 0]} />)
        // Baked nozzle glow — live jets in HeroFighter carry the big plume.
        add(shin, <P s={S.sphere(0.024 * pr.limb, 10, 8)} m={M.glow} line={false} shadow={false} p={[0, -pr.shin * 0.88, -0.06 * pr.limb]} sc={[1.1, 0.7, 1.1]} />)
        add(foot, <P s={S.box(fw * 0.5, 0.02, 0.045, 0.006)} m={M.glow} line={false} shadow={false} p={[0, -A + 0.028, -0.02]} />)
        break
      }
      case 'platform':
        sole(M.light, 0.05)
        upper(M.accent, 0.05)
        add(foot, <P s={S.box(fw * 1.0, 0.012, FL + 0.052, 0.004)} m={M.trim} line={false} p={[0, -A + 0.03, FL * 0.32]} />)
        break
      case 'talons':
        upper(M.trim, 0.05, 0.86)
        shaft(M.trim, 0.1)
        for (let i = 0; i < 3; i++) {
          add(foot, <P s={S.cone(0.012, 0.05, 5)} m={M.metal} p={[(i - 1) * 0.022, -A + 0.012, FL + 0.03]} r={[Math.PI / 2 + 0.3, 0, (i - 1) * -0.3]} />)
        }
        break
      case 'greaves':
        sole(M.dark, 0.026)
        upper(M.trim, 0.06)
        add(shin, <P s={S.box(0.06 * pr.limb, pr.shin * 0.62, 0.03, 0.012)} m={M.metal} p={[0, -pr.shin * 0.58, shR1 * 1.2]} />)
        add(shin, <P s={S.box(0.03, 0.03, 0.01, 0.006)} m={M.glow} line={false} p={[0, -pr.shin * 0.45, shR1 * 1.2 + 0.016]} />)
        break
      case 'hexBoots':
        sole(M.dark, 0.026)
        upper(M.trim, 0.055)
        add(shin, <P s={S.cyl(shR1 * 1.9, shR1 * 1.9, 0.12, 6)} m={M.secondary} p={[0, -pr.shin + 0.06, 0]} />)
        add(shin, <P s={S.cyl(shR1 * 1.95, shR1 * 1.95, 0.012, 6)} m={M.glow} line={false} p={[0, -pr.shin + 0.1, 0]} />)
        break
      case 'slippers':
        add(foot, <P s={S.box(fw * 0.86, 0.022, FL + 0.04, 0.01)} m={M.light} p={[0, -A + 0.011, FL * 0.32]} />)
        add(foot, <P s={S.box(fw * 0.8, 0.035, FL * 0.7, 0.014)} m={M.skin} p={[0, -A + 0.035, FL * 0.3]} />)
        add(foot, <P s={S.box(fw * 0.82, 0.01, 0.01, 0.003)} m={M.trim} line={false} p={[0, -A + 0.03, FL * 0.55]} />)
        break
    }
  })
}

function buildHands(c: Ctx) {
  const { d, pr, M, add, has } = c
  const h = pr.hand
  const voltGauntlets = has('arcSuit')
  // Custom gauntlets / gloves are fully built in extras.
  if (
    has('lemillionSuit') ||
    has('gilgameshSuit') ||
    has('saitamaSuit') ||
    has('dekuSuit') ||
    has('dekuAwaken') ||
    has('allMightSuit') ||
    has('allMightTruth')
  )
    return
  sides((s, l) => {
    const hand = `${l}Hand` as BoneName
    const fore = `${l}Fore` as BoneName
    let mat: THREE.Material = M.skin
    let scale = 1
    if (d.hands === 'wraps') mat = M.light
    if (d.hands === 'gloves' || d.hands === 'claws')
      mat = voltGauntlets ? M.primary : has('engineVents') ? M.secondary : has('overhaulSuit') ? M.light : M.trim
    if (d.hands === 'mitts') {
      mat = M.accent
      scale = 1.5
    }
    if (d.hands === 'gauntletR' && s === -1) {
      mat = M.metal
      scale = 1.45
    }
    const hw = h * 2 * scale
    add(hand, <P s={S.box(hw, h * 2.3 * scale, h * 1.7 * scale, h * 0.6 * scale)} m={mat} p={[0, -h * 1.05 * scale, 0.002]} />)
    add(hand, <P s={S.capsule(h * 0.42 * scale, h * 0.7 * scale)} m={mat} p={[-s * hw * 0.5, -h * 0.75 * scale, h * 0.55]} r={[0.4, 0, s * 0.4]} />)

    if (d.hands === 'wraps') {
      add(fore, <P s={S.cyl(0.024 * pr.limb, 0.022 * pr.limb, 0.05, 10)} m={M.light} p={[0, -pr.forearm + 0.02, 0]} />)
    }
    if (d.hands === 'gloves') {
      if (voltGauntlets) {
        // Navy speedster gloves — same suit navy + cyan cuff ring.
        add(fore, <P s={S.cyl(0.028 * pr.limb, 0.03 * pr.limb, pr.forearm * 0.72, 12)} m={M.primary} p={[0, -pr.forearm * 0.62, 0]} />)
        add(fore, <P s={S.cyl(0.031 * pr.limb, 0.031 * pr.limb, 0.018, 12)} m={M.glow} line={false} shadow={false} p={[0, -pr.forearm * 0.32, 0]} />)
        add(fore, <P s={S.box(0.014 * pr.limb, 0.04, 0.01, 0.003)} m={M.accent} line={false} p={[0.03 * pr.limb, -pr.forearm * 0.5, 0]} r={[0, 0, 0.4]} />)
      } else if (has('engineVents')) {
        // Navy glove + white knuckle plate over the engine gauntlet cuff.
        add(hand, <P s={S.box(hw * 0.85, h * 0.9, h * 0.55, h * 0.2)} m={M.primary} p={[0, -h * 1.15, h * 0.35]} />)
        add(fore, <P s={S.cyl(0.026 * pr.limb, 0.026 * pr.limb, 0.028, 10)} m={M.secondary} p={[0, -pr.forearm + 0.01, 0]} />)
      } else if (has('lemillionSuit') || has('overhaulSuit')) {
        // Gauntlets / surgical cuffs are built in extras — skip default cuff.
      } else {
        add(fore, <P s={S.cyl(0.025 * pr.limb, 0.025 * pr.limb, 0.03, 10)} m={M.trim} p={[0, -pr.forearm + 0.01, 0]} />)
      }
    }
    if (d.hands === 'mitts') {
      add(fore, <P s={S.cyl(0.032 * pr.limb, 0.036 * pr.limb, 0.07, 12)} m={M.accent} p={[0, -pr.forearm + 0.03, 0]} />)
      add(hand, <P s={S.cyl(h * 0.9, h * 0.9, 0.01, 10)} m={M.glow} line={false} shadow={false} p={[0, -h * 1.4, h * 1.3]} r={[Math.PI / 2, 0, 0]} />)
    }
    if (d.hands === 'gauntletR' && s === -1) {
      add(fore, <P s={S.cyl(0.036 * pr.limb, 0.04 * pr.limb, pr.forearm * 0.6, 8)} m={M.metal} p={[0, -pr.forearm * 0.68, 0]} />)
      add(fore, <P s={S.box(0.03, pr.forearm * 0.4, 0.012, 0.005)} m={M.glow} line={false} p={[0, -pr.forearm * 0.68, 0.036 * pr.limb + 0.004]} />)
      add(hand, <P s={S.box(hw * 1.05, h * 0.6, h * 0.5, h * 0.2)} m={M.accent} p={[0, -h * 1.8, h * 0.7]} />)
    }
    if (d.hands === 'claws') {
      for (let i = 0; i < 3; i++) {
        add(hand, <P s={S.cone(0.006, 0.06, 4)} m={M.metal} p={[(i - 1) * h * 0.7, -h * 2.6, h * 0.4]} r={[Math.PI + 0.3, 0, 0]} />)
      }
    }
  })
}

export { sides }
