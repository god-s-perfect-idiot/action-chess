import type { Ctx } from './Outfit'
import { sides } from './Outfit'
import { P } from './Part'
import type { BoneName } from './rig'
import { S } from './shapes'

export function buildExtras(c: Ctx) {
  const { d, pr, M, add, has } = c
  const ch = pr.chestH
  const cd = pr.chestD
  const cw = pr.chestW
  const L = pr.limb

  if (has('scarf') || has('longScarf')) {
    add('neck', <P s={S.torus(0.045 * Math.sqrt(L), 0.022, Math.PI * 2, 14)} m={M.accent} p={[0, 0.012, 0]} r={[Math.PI / 2 - 0.15, 0, 0]} />)
    add('neck', <P s={S.torus(0.04 * Math.sqrt(L), 0.02, Math.PI * 2, 14)} m={M.accent} p={[0, 0.035, 0.004]} r={[Math.PI / 2 + 0.1, 0, 0]} />)
    if (has('longScarf')) {
      add('cape', <P s={S.panel(0.06, 0.42, 0.012, 0.01)} m={M.accent} p={[0.03, -0.18, -0.01]} r={[0.25, 0, -0.08]} />)
      add('cape', <P s={S.panel(0.055, 0.34, 0.012, 0.01)} m={M.accent} p={[-0.035, -0.14, -0.02]} r={[0.35, 0, 0.12]} />)
      add('cape', <P s={S.box(0.065, 0.02, 0.016, 0.006)} m={M.trim} line={false} p={[0.03 + 0.045, -0.385, -0.06]} r={[0.25, 0, -0.08]} />)
    } else {
      add('chest', <P s={S.panel(0.05, 0.16, 0.012)} m={M.accent} p={[0.04, ch * 0.78, cd * 0.55]} r={[-0.15, 0, 0.15]} />)
    }
  }
  if (has('featherScarf')) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      add(
        'neck',
        <P s={S.shard(0.022, 0.07, 0.008)} m={i % 2 ? M.accent : M.primary} p={[Math.sin(a) * 0.05, 0.01, Math.cos(a) * 0.05]} r={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]} />,
      )
    }
  }
  if (has('headphones')) {
    add('neck', <P s={S.torus(0.058, 0.01, Math.PI * 1.3, 16)} m={M.trim} p={[0, 0.0, -0.005]} r={[Math.PI / 2, 0, Math.PI * 0.85]} />)
    sides((s) => {
      add('neck', <P s={S.cyl(0.03, 0.03, 0.025, 14)} m={M.accent} p={[s * 0.058, 0.0, 0.025]} r={[0, 0, Math.PI / 2]} />)
      add('neck', <P s={S.cyl(0.02, 0.02, 0.008, 12)} m={M.glow} line={false} p={[s * 0.072, 0.0, 0.025]} r={[0, 0, Math.PI / 2]} />)
    })
  }
  if (has('cables')) {
    sides((s) =>
      add('cape', <P s={S.panel(0.012, 0.45, 0.006, 0.01)} m={s === 1 ? M.accent : M.glow} p={[s * 0.05, -0.12, -0.02]} r={[0.4, 0, s * 0.25]} />),
    )
  }
  if (has('cape')) {
    const len = pr.hipH * 0.9 + ch * 0.6
    const w = cw * 1.3
    add('cape', <P s={S.panel(w, len, 0.022, -w * 0.28)} m={M.secondary} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
    add('cape', <P s={S.panel(w * 0.94, len * 0.97, 0.012, -w * 0.27)} m={M.lining} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.06, 0, 0]} />)
    add('chest', <P s={S.torus(cw * 0.42, 0.025, Math.PI, 16)} m={M.secondary} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    sides((s) => add('chest', <P s={S.cyl(0.02, 0.02, 0.012, 10)} m={M.metal} p={[s * cw * 0.32, ch * 0.92, cd * 0.48]} r={[Math.PI / 2, 0, 0]} />))
  }
  if (has('mothWings')) {
    sides((s, l) => {
      const bone = (l === 'l' ? 'wingL' : 'wingR') as BoneName
      add(bone, <P s={S.panel(0.24, 0.28, 0.01, 0.03)} m={M.accent} p={[s * 0.13, 0.04, 0]} r={[0, 0, s * -0.35]} />)
      add(bone, <P s={S.panel(0.16, 0.2, 0.01, 0.02)} m={M.secondary} p={[s * 0.1, -0.16, 0.002]} r={[0, 0, s * 0.45]} />)
      add(bone, <P s={S.sphere(0.03, 10, 8)} m={M.trim} line={false} p={[s * 0.16, 0.07, 0.008]} sc={[1, 1, 0.25]} />)
      add(bone, <P s={S.sphere(0.016, 8, 6)} m={M.glow} line={false} p={[s * 0.16, 0.07, 0.012]} sc={[1, 1, 0.25]} />)
    })
    add('chest', <P s={S.torus(cw * 0.42, 0.03, Math.PI, 16)} m={M.light} p={[0, ch * 0.96, -0.005]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
  }
  if (has('hawksWings')) {
    // Fierce Wings — tall layered crimson feathers on wing bones.
    sides((s, l) => {
      const bone = (l === 'l' ? 'wingL' : 'wingR') as BoneName
      add(bone, <P s={S.sphere(0.04, 10, 8)} m={M.trim} line={false} p={[s * 0.04, 0.02, -0.01]} sc={[1.1, 0.7, 0.55]} />)
      // Primary sail — tall outer vane.
      add(bone, <P s={S.panel(0.34, 0.52, 0.012, 0.05)} m={M.accent} p={[s * 0.2, 0.12, -0.02]} r={[0.12, s * 0.15, s * -0.55]} />)
      add(bone, <P s={S.panel(0.26, 0.4, 0.01, 0.035)} m={M.accent} p={[s * 0.16, -0.08, -0.01]} r={[0.2, s * 0.1, s * -0.2]} />)
      // Layered flight feathers.
      for (let i = 0; i < 7; i++) {
        const t = i / 6
        add(
          bone,
          <P
            s={S.shard(0.04 + t * 0.02, 0.14 + t * 0.1, 0.012)}
            m={i % 2 ? M.accent : M.trim}
            p={[s * (0.1 + t * 0.22), 0.22 - t * 0.42, -0.03 - t * 0.01]}
            r={[0.35 + t * 0.4, s * (0.2 + t * 0.15), s * (-0.7 + t * 0.35)]}
          />,
        )
      }
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        add(
          bone,
          <P
            s={S.shard(0.03, 0.1 + t * 0.06, 0.01)}
            m={M.accent}
            p={[s * (0.06 + t * 0.12), 0.08 - t * 0.28, -0.015]}
            r={[0.5, s * 0.25, s * (-0.35 + t * 0.2)]}
          />,
        )
      }
    })
    add('chest', <P s={S.torus(cw * 0.38, 0.022, Math.PI, 14)} m={M.trim} p={[0, ch * 0.92, -0.02]} r={[Math.PI / 2 + 0.35, 0, Math.PI]} />)
  }
  if (has('hawksSuit')) {
    // Aviator kit — white fleece collar/cuffs, gold chest motif, H-belt, black headset.
    const r = pr.headR
    add('chest', <P s={S.torus(0.07, 0.038, Math.PI * 1.65, 18)} m={M.light} p={[0, ch * 1.0, -0.01]} r={[Math.PI / 2 + 0.15, 0, Math.PI * 0.08]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.72, 0.03, 0.01)} m={M.trim} p={[0, ch * 0.42, cd * 0.5]} />)
    // Gold curved chest lines + center disc.
    for (const s of [-1, 1] as const) {
      add('chest', <P s={S.box(0.018, ch * 0.42, 0.012, 0.005)} m={M.metal} p={[s * cw * 0.12, ch * 0.48, cd * 0.56]} r={[0, 0, s * 0.55]} />)
      add('chest', <P s={S.box(0.014, ch * 0.28, 0.01, 0.004)} m={M.metal} p={[s * cw * 0.2, ch * 0.4, cd * 0.55]} r={[0, 0, s * 0.85]} />)
    }
    add('chest', <P s={S.cyl(0.028, 0.028, 0.014, 14)} m={M.metal} p={[0, ch * 0.52, cd * 0.58]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.torus(0.02, 0.004, Math.PI * 2, 14)} m={M.glow} line={false} p={[0, ch * 0.52, cd * 0.6]} />)
    // Fleece cuffs.
    sides((_s, l) => {
      add(`${l}Fore` as BoneName, <P s={S.cyl(0.045 * L, 0.048 * L, 0.05, 12)} m={M.light} p={[0, -pr.forearm * 0.82, 0]} />)
    })
    // Gold H belt buckle.
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.04, pr.chestD * 1.02, 0.012)} m={M.trim} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.box(0.055, 0.045, 0.02, 0.008)} m={M.metal} p={[0, pr.abdomen * 0.12, pr.chestD * 0.52]} />)
    add('spine', <P s={S.box(0.028, 0.008, 0.008, 0.003)} m={M.trim} line={false} p={[0, pr.abdomen * 0.12, pr.chestD * 0.54]} />)
    add('spine', <P s={S.box(0.008, 0.028, 0.008, 0.003)} m={M.trim} line={false} p={[0, pr.abdomen * 0.12, pr.chestD * 0.54]} />)
    // Black headset over the ears.
    add('head', <P s={S.torus(r * 0.95, r * 0.04, Math.PI * 1.15, 16)} m={M.trim} p={[0, r * 0.15, -r * 0.08]} r={[Math.PI / 2, 0, Math.PI * 0.92]} />)
    sides((s) => {
      add('head', <P s={S.cyl(r * 0.22, r * 0.22, r * 0.14, 12)} m={M.trim} p={[s * r * 0.92, r * 0.05, 0]} r={[0, 0, Math.PI / 2]} />)
      add('head', <P s={S.cyl(r * 0.14, r * 0.14, r * 0.04, 10)} m={M.metal} line={false} p={[s * r * 1.02, r * 0.05, 0]} r={[0, 0, Math.PI / 2]} />)
    })
  }
  if (has('seal')) {
    add('cape', <P s={S.cyl(0.11, 0.11, 0.02, 24)} m={M.accent} p={[0, -ch * 0.4, -0.03]} r={[Math.PI / 2, 0, 0]} />)
    add('cape', <P s={S.torus(0.085, 0.01, Math.PI * 2, 24)} m={M.glow} line={false} p={[0, -ch * 0.4, -0.042]} />)
    add('cape', <P s={S.box(0.1, 0.018, 0.01, 0.004)} m={M.trim} line={false} p={[0, -ch * 0.4, -0.044]} />)
    add('cape', <P s={S.box(0.018, 0.1, 0.01, 0.004)} m={M.trim} line={false} p={[0, -ch * 0.4, -0.044]} />)
  }
  if (has('pauldrons')) {
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.12 * Math.sqrt(L), 0.07, 0.12 * Math.sqrt(L), 0.022)} m={M.metal} p={[s * 0.02, 0.03, 0]} r={[0, 0, s * -0.28]} />)
      add(up, <P s={S.box(0.11 * Math.sqrt(L), 0.025, 0.11 * Math.sqrt(L), 0.01)} m={M.accent} p={[s * 0.035, -0.01, 0]} r={[0, 0, s * -0.28]} />)
    })
  }
  if (has('medals')) {
    for (let i = 0; i < 3; i++) {
      add('chest', <P s={S.box(0.026, 0.01, 0.006, 0.002)} m={i === 1 ? M.accent : M.glow} line={false} p={[cw * 0.24 + (i - 1) * 0.028, ch * 0.72, cd * 0.54]} />)
    }
    add('chest', <P s={S.cyl(0.018, 0.018, 0.008, 10)} m={M.metal} p={[cw * 0.24, ch * 0.6, cd * 0.55]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.cone(0.012, 0.025, 5)} m={M.accent} line={false} p={[cw * 0.24, ch * 0.6, cd * 0.57]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.torus(0.04, 0.005, Math.PI * 0.8, 12)} m={M.metal} line={false} p={[-cw * 0.3, ch * 0.75, cd * 0.48]} r={[0, 0, Math.PI * 1.1]} />)
  }
  if (has('beads')) {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const drop = Math.max(0, Math.cos(a)) * 0.07
      add(
        'neck',
        <P s={S.sphere(i === 0 ? 0.016 : 0.01, 8, 6)} m={i === 0 ? M.glow : M.accent} line={i === 0} p={[Math.sin(a) * 0.06, -drop - 0.01, Math.cos(a) * 0.055 + 0.01]} />,
      )
    }
    sides((s, l) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(`${l}Fore` as BoneName, <P s={S.sphere(0.008, 6, 4)} m={M.accent} line={false} p={[Math.cos(a) * 0.026 * L, -pr.forearm * 0.82, Math.sin(a) * 0.026 * L]} />)
      }
      void s
    })
  }
  if (has('harness')) {
    sides((s) =>
      add('chest', <P s={S.box(0.016, ch * 1.12, 0.012, 0.004)} m={M.trim} p={[s * cw * 0.12, ch * 0.5, cd * 0.52]} r={[0, 0, s * 0.42]} />),
    )
    add('chest', <P s={S.cyl(0.018, 0.018, 0.012, 10)} m={M.metal} p={[0, ch * 0.5, cd * 0.56]} r={[Math.PI / 2, 0, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.15, 0.018, pr.chestD * 0.95, 0.006)} m={M.trim} p={[0, pr.abdomen * 0.3, 0]} />)
  }
  if (has('kneePads')) {
    sides((_s, l) =>
      add(`${l}Shin` as BoneName, <P s={S.box(0.06 * L, 0.06, 0.04, 0.016)} m={M.trim} p={[0, -0.01, 0.032 * L]} />),
    )
  }
  if (has('elbowPads')) {
    sides((_s, l) =>
      add(`${l}Fore` as BoneName, <P s={S.box(0.05 * L, 0.05, 0.05 * L, 0.014)} m={M.trim} p={[0, -0.005, -0.012]} />),
    )
  }
  if (has('fangPendant')) {
    add('neck', <P s={S.torus(0.05, 0.004, Math.PI * 2, 14)} m={M.trim} line={false} p={[0, -0.02, 0.02]} r={[Math.PI / 2 - 0.6, 0, 0]} />)
    add('chest', <P s={S.cone(0.012, 0.045, 5)} m={M.metal} p={[0, ch * 0.78, cd * 0.56]} r={[Math.PI, 0, 0]} />)
  }
  if (has('shardCoat')) {
    const spots: [string, number, number, number, number][] = [
      ['chest', cw * 0.3, ch * 0.7, cd * 0.52, 0.4],
      ['chest', -cw * 0.34, ch * 0.4, cd * 0.52, -0.6],
      ['chest', cw * 0.42, ch * 0.25, cd * 0.4, 1.2],
      ['tails', 0.05, -0.12, -0.03, 0.2],
      ['tails', -0.06, -0.22, -0.03, -0.5],
      ['lUpper', 0.03, -0.05, 0.0, 0.8],
      ['rUpper', -0.03, -0.08, 0.0, -0.8],
    ]
    spots.forEach(([b, x, y, z, rot]) =>
      add(b as BoneName, <P s={S.shard(0.02, 0.05, 0.008)} m={M.metal} p={[x, y, z]} r={[0.2, 0.3, rot]} />),
    )
  }
  if (has('notePatches')) {
    add('chest', <P s={S.sphere(0.014, 8, 6)} m={M.accent} line={false} p={[-cw * 0.25, ch * 0.4, cd * 0.53]} sc={[1.2, 0.9, 0.4]} />)
    add('chest', <P s={S.box(0.005, 0.04, 0.005, 0.002)} m={M.accent} line={false} p={[-cw * 0.25 + 0.012, ch * 0.4 + 0.02, cd * 0.53]} />)
    add('lUpper', <P s={S.sphere(0.012, 8, 6)} m={M.accent} line={false} p={[0.03 * L, -0.06, 0.0]} sc={[0.4, 0.9, 1.2]} />)
  }
  if (has('sparkCuffs') || has('gravityRings')) {
    const rings = has('gravityRings')
    sides((s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.torus(0.045 * L, 0.007, Math.PI * 2, 18)} m={M.glow} shadow={false} p={[0, -pr.forearm * 0.75, 0]} r={[Math.PI / 2 + 0.3, 0, 0]} />)
      if (rings) {
        add(fore, <P s={S.torus(0.058 * L, 0.006, Math.PI * 2, 18)} m={M.accent} shadow={false} p={[0, -pr.forearm * 0.55, 0]} r={[Math.PI / 2 - 0.3, 0.3, 0]} />)
      } else {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2
          add(fore, <P s={S.shard(0.008, 0.026, 0.004)} m={M.glowAlt} line={false} shadow={false} p={[Math.cos(a) * 0.04 * L, -pr.forearm * 0.7, Math.sin(a) * 0.04 * L]} r={[0, a, 0.6]} />)
        }
      }
      void s
    })
  }
  if (has('engineVents')) {
    // Revs engine armor — white plates, navy joints, muffler stacks, waist tubes.
    add('chest', <P s={S.box(cw * 0.92, ch * 0.62, 0.04, 0.012)} m={M.primary} p={[0, ch * 0.52, cd * 0.5]} />)
    add('chest', <P s={S.box(cw * 0.42, ch * 0.28, 0.02, 0.006)} m={M.primary} p={[0, ch * 0.7, cd * 0.56]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.04, ch * 0.4, 0.035, 0.01)} m={M.secondary} p={[s * cw * 0.46, ch * 0.55, cd * 0.12]} />)
      add('chest', <P s={S.cyl(0.014, 0.014, 0.012, 10)} m={M.accent} p={[s * cw * 0.42, ch * 0.78, cd * 0.48]} r={[Math.PI / 2, 0, 0]} />)
    })

    // Three grey midsection tubes + navy strap / gold buckle.
    for (let i = 0; i < 3; i++) {
      const y = pr.abdomen * (0.72 - i * 0.22)
      add(
        'spine',
        <P s={S.torus(Math.max(pr.waistW, pr.chestD) * 0.52, 0.015, Math.PI * 2, 18)} m={M.metal} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} />,
      )
    }
    add('spine', <P s={S.box(0.034, pr.abdomen * 0.62, 0.02, 0.006)} m={M.secondary} p={[0, pr.abdomen * 0.5, pr.chestD * 0.48]} />)
    add('spine', <P s={S.box(0.028, 0.04, 0.014, 0.005)} m={M.accent} p={[0, pr.abdomen * 0.5, pr.chestD * 0.54]} />)

    // Winged pauldrons sweeping up / back + shoulder gold pivots.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.13 * Math.sqrt(L), 0.055, 0.16 * Math.sqrt(L), 0.02)} m={M.primary} p={[s * 0.02, 0.04, -0.02]} r={[-0.35, s * 0.2, s * -0.45]} />)
      add(up, <P s={S.box(0.08 * Math.sqrt(L), 0.04, 0.11 * Math.sqrt(L), 0.014)} m={M.primary} p={[s * 0.04, 0.08, -0.08]} r={[-0.7, s * 0.15, s * -0.35]} />)
      add(up, <P s={S.cyl(0.016, 0.016, 0.014, 10)} m={M.accent} p={[s * 0.05, 0.01, 0.04]} r={[Math.PI / 2, 0, 0]} />)
      add(up, <P s={S.box(0.07 * L, pr.upperArm * 0.45, 0.06 * L, 0.014)} m={M.secondary} p={[s * 0.01, -pr.upperArm * 0.35, 0]} />)
    })

    // Three muffler stacks rising from the upper back.
    for (let i = 0; i < 3; i++) {
      const s = i - 1
      const y = ch * (0.62 + Math.abs(s) * 0.04)
      const z = -cd * 0.72
      add(
        'chest',
        <P
          s={S.cyl(0.02, 0.024, 0.16 + Math.abs(s) * 0.02, 10)}
          m={M.metal}
          p={[s * cw * 0.18, y, z]}
          r={[-1.05 - Math.abs(s) * 0.08, s * 0.18, s * 0.08]}
        />,
      )
      add(
        'chest',
        <P
          s={S.cyl(0.016, 0.02, 0.022, 10)}
          m={M.trim}
          p={[s * cw * 0.18, y + 0.07, z - 0.06]}
          r={[-1.05 - Math.abs(s) * 0.08, s * 0.18, s * 0.08]}
        />,
      )
    }

    // White thigh bands + forearm gauntlets over the navy suit.
    sides((s, l) => {
      const thigh = `${l}Thigh` as BoneName
      const fore = `${l}Fore` as BoneName
      add(thigh, <P s={S.box(0.08 * L, 0.07, 0.07 * L, 0.016)} m={M.primary} p={[0, -pr.thigh * 0.38, 0]} />)
      add(thigh, <P s={S.box(0.06 * L, 0.018, 0.05 * L, 0.006)} m={M.metal} p={[0, -pr.thigh * 0.32, 0.01]} />)
      add(fore, <P s={S.box(0.07 * L, pr.forearm * 0.62, 0.065 * L, 0.016)} m={M.primary} p={[0, -pr.forearm * 0.52, 0]} />)
      add(fore, <P s={S.cyl(0.032 * L, 0.032 * L, 0.018, 12)} m={M.metal} p={[0, -pr.forearm * 0.28, 0]} />)
      add(fore, <P s={S.cyl(0.012, 0.012, 0.01, 8)} m={M.accent} p={[s * 0.028 * L, -pr.forearm * 0.42, 0.03 * L]} r={[Math.PI / 2, 0, 0]} />)
    })
  }
  if (has('quicksilverSuit')) {
    // Quicksilver — blue speed suit, white diagonal zigzag, black trunks, white gauntlets/boots.
    // Red Rush / Speed reuse this kit with maroon or forest palettes (+ crest / goggles).
    const z = cd * 0.55
    const rush = has('redRushCowl')
    // Diagonal lightning stripe — right shoulder → left hip (white on QS/Speed, scarlet on Rush).
    ;[
      [cw * 0.34, ch * 0.92, 0.1, 0.055, -0.55],
      [cw * 0.18, ch * 0.72, 0.12, 0.05, -0.7],
      [cw * 0.02, ch * 0.52, 0.11, 0.048, -0.85],
      [-cw * 0.14, ch * 0.32, 0.1, 0.045, -0.95],
      [-cw * 0.28, ch * 0.14, 0.09, 0.04, -1.05],
    ].forEach(([x, y, w, h, rot]) => {
      add('chest', <P s={S.box(w, h, 0.012, 0.004)} m={M.accent} line={false} p={[x, y, z]} r={[0, 0, rot]} />)
      add('chest', <P s={S.box(w * 0.55, h * 0.55, 0.008, 0.003)} m={M.metal} line={false} shadow={false} p={[x, y, z + 0.006]} r={[0, 0, rot]} />)
    })
    if (rush) {
      // Interlocking RR crest over the chest stripe.
      const rz = z + 0.014
      ;[
        [-0.028, 0.08, 0.022, 0.055, 0.15],
        [0.028, 0.08, 0.022, 0.055, -0.15],
        [-0.018, 0.045, 0.04, 0.018, 0.35],
        [0.018, 0.045, 0.04, 0.018, -0.35],
        [-0.012, 0.1, 0.028, 0.016, 0.55],
        [0.012, 0.1, 0.028, 0.016, -0.55],
      ].forEach(([x, y, w, h, rot]) => {
        add('chest', <P s={S.box(w, h, 0.01, 0.003)} m={M.accent} line={false} p={[x, ch * 0.58 + y, rz]} r={[0, 0, rot]} />)
      })
    }
    // Hip zigzag accents.
    sides((s) => {
      add(
        'pelvis',
        <P
          s={S.box(0.06, 0.028, 0.01, 0.004)}
          m={M.accent}
          line={false}
          p={[s * pr.pelvisW * 0.42, 0.02, pr.pelvisD * 0.48]}
          r={[0, 0, s * -0.7]}
        />,
      )
      add(
        'pelvis',
        <P
          s={S.box(0.045, 0.022, 0.008, 0.003)}
          m={M.accent}
          line={false}
          p={[s * pr.pelvisW * 0.5, -0.02, pr.pelvisD * 0.46]}
          r={[0, 0, s * 0.85]}
        />,
      )
    })
    // Black trunks over the blue suit.
    add('pelvis', <P s={S.box(pr.pelvisW * 1.12, 0.09, pr.pelvisD * 1.08, 0.03)} m={M.trim} p={[0, -0.01, 0]} />)
    add('pelvis', <P s={S.box(pr.pelvisW * 1.14, 0.018, pr.pelvisD * 1.1, 0.006)} m={M.accent} line={false} p={[0, 0.035, 0]} />)
    // White forearm gloves + boot shafts.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(fore, <P s={S.cyl(0.038 * L, 0.04 * L, pr.forearm * 0.72, 12)} m={M.metal} p={[0, -pr.forearm * 0.55, 0]} />)
      add(fore, <P s={S.cyl(0.042 * L, 0.042 * L, 0.016, 12)} m={M.accent} line={false} p={[0, -pr.forearm * 0.22, 0]} />)
      add(shin, <P s={S.cyl(0.04 * L, 0.044 * L, pr.shin * 0.58, 12)} m={M.metal} p={[0, -pr.shin * 0.68, 0]} />)
      add(shin, <P s={S.cyl(0.042 * L, 0.042 * L, 0.014, 12)} m={M.accent} line={false} p={[0, -pr.shin * 0.48, 0]} />)
      add(foot, <P s={S.box(0.018 * L, 0.01, 0.036, 0.004)} m={M.accent} line={false} p={[0, 0.018, 0.038]} r={[0, 0, 0.4]} />)
    })
  }
  if (has('sonicSuit')) {
    // Speed-o'-Sonic — black ninja bodysuit, silver riveted plates, purple muffler, tabi.
    const front = cd * 0.52
    // V-collar metal neck piece.
    add('chest', <P s={S.cyl(0.055 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.06, 14, true)} m={M.metal} p={[0, ch * 1.0, -0.006]} />)
    add('chest', <P s={S.box(cw * 0.42, 0.04, 0.02, 0.008)} m={M.metal} p={[0, ch * 0.92, front]} r={[0.35, 0, 0]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.05, 0.035, 0.016, 0.006)} m={M.metal} p={[s * cw * 0.22, ch * 0.88, front]} r={[0.2, 0, s * 0.55]} />)
      add('chest', <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * cw * 0.18, ch * 0.9, front + 0.012]} r={[Math.PI / 2, 0, 0]} />)
    })
    // Midriff metallic corset bands + rivets.
    for (let i = 0; i < 2; i++) {
      const y = ch * (0.28 - i * 0.14)
      add('chest', <P s={S.box(cw * 0.92, 0.045, 0.028, 0.01)} m={M.metal} p={[0, y, front * 0.15]} />)
      sides((s) => {
        add('chest', <P s={S.cyl(0.007, 0.007, 0.008, 8)} m={M.trim} line={false} p={[s * cw * 0.32, y, front + 0.01]} r={[Math.PI / 2, 0, 0]} />)
        add('chest', <P s={S.cyl(0.007, 0.007, 0.008, 8)} m={M.trim} line={false} p={[s * cw * 0.12, y, front + 0.012]} r={[Math.PI / 2, 0, 0]} />)
      })
    }
    // Long purple muffler — thick neck wraps + trailing panels.
    add('neck', <P s={S.torus(0.05 * Math.sqrt(L), 0.028, Math.PI * 2, 14)} m={M.accent} p={[0, 0.01, 0]} r={[Math.PI / 2 - 0.12, 0, 0]} />)
    add('neck', <P s={S.torus(0.046 * Math.sqrt(L), 0.024, Math.PI * 2, 14)} m={M.accent} p={[0, 0.038, 0.006]} r={[Math.PI / 2 + 0.08, 0, 0]} />)
    add('neck', <P s={S.torus(0.042 * Math.sqrt(L), 0.02, Math.PI * 2, 14)} m={M.accent} p={[0, 0.058, 0.004]} r={[Math.PI / 2 - 0.05, 0, 0]} />)
    add('cape', <P s={S.panel(0.07, 0.52, 0.014, 0.012)} m={M.accent} p={[0.04, -0.22, -0.02]} r={[0.28, 0.1, -0.12]} />)
    add('cape', <P s={S.panel(0.06, 0.44, 0.014, 0.01)} m={M.accent} p={[-0.045, -0.18, -0.03]} r={[0.4, -0.08, 0.16]} />)
    add('cape', <P s={S.panel(0.05, 0.36, 0.012, 0.01)} m={M.accent} p={[0.01, -0.28, -0.05]} r={[0.55, 0.05, -0.04]} />)

    // Shoulder → bicep plates, forearm bands, thigh + shin bands with rivets.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      const thigh = `${l}Thigh` as BoneName
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const scale = Math.sqrt(L)
      add(up, <P s={S.box(0.1 * scale, 0.06, 0.12 * scale, 0.018)} m={M.metal} p={[s * 0.02, 0.02, 0]} r={[0, 0, s * -0.32]} />)
      add(up, <P s={S.box(0.08 * scale, pr.upperArm * 0.42, 0.07 * scale, 0.014)} m={M.metal} p={[s * 0.015, -pr.upperArm * 0.32, 0]} />)
      add(up, <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * 0.04 * scale, -pr.upperArm * 0.2, 0.035 * L]} r={[Math.PI / 2, 0, 0]} />)
      add(up, <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * 0.04 * scale, -pr.upperArm * 0.38, 0.035 * L]} r={[Math.PI / 2, 0, 0]} />)
      for (const t of [0.28, 0.55] as const) {
        add(fore, <P s={S.cyl(0.036 * L, 0.038 * L, 0.04, 12)} m={M.metal} p={[0, -pr.forearm * t, 0]} />)
        add(fore, <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * 0.03 * L, -pr.forearm * t, 0.032 * L]} r={[Math.PI / 2, 0, 0]} />)
      }
      for (const t of [0.35, 0.58] as const) {
        add(thigh, <P s={S.cyl(0.042 * L, 0.044 * L, 0.045, 12)} m={M.metal} p={[0, -pr.thigh * t, 0]} />)
        add(thigh, <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * 0.035 * L, -pr.thigh * t, 0.038 * L]} r={[Math.PI / 2, 0, 0]} />)
      }
      for (const t of [0.45, 0.68] as const) {
        add(shin, <P s={S.cyl(0.038 * L, 0.04 * L, 0.04, 12)} m={M.metal} p={[0, -pr.shin * t, 0]} />)
        add(shin, <P s={S.cyl(0.006, 0.006, 0.008, 8)} m={M.trim} line={false} p={[s * 0.03 * L, -pr.shin * t, 0.034 * L]} r={[Math.PI / 2, 0, 0]} />)
      }
      // Open-toe tabi.
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.065 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.014, FL + 0.035, 0.005)} m={M.primary} p={[0, -A + 0.01, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.45, 0.012, FL * 0.55, 0.004)} m={M.primary} p={[-fw * 0.22, -A + 0.022, FL * 0.45]} />)
      add(foot, <P s={S.box(fw * 0.45, 0.012, FL * 0.55, 0.004)} m={M.primary} p={[fw * 0.22, -A + 0.022, FL * 0.45]} />)
      add(shin, <P s={S.box(0.045 * L, 0.016, 0.018, 0.005)} m={M.metal} p={[0, -pr.shin + 0.016, 0.026 * L]} />)
    })
  }
  if (has('arcSuit')) {
    // Speed Force suit — Manhattan (navy/cyan) or classic Flash (scarlet/gold) via palette.
    const classic = !has('manhattanMark')
    const bootMat = classic ? M.accent : M.primary
    const crestBolt = classic ? M.accent : M.secondary
    // Circular chest emblem.
    add('chest', <P s={S.cyl(0.055, 0.055, 0.018, 16)} m={M.metal} p={[0, ch * 0.62, cd * 0.54]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.cyl(0.042, 0.042, 0.01, 16)} m={classic ? M.metal : M.glow} line={false} shadow={false} p={[0, ch * 0.62, cd * 0.555]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.cyl(0.012, 0.012, 0.008, 10)} m={M.metal} line={false} p={[0, ch * 0.62, cd * 0.565]} r={[Math.PI / 2, 0, 0]} />)
    // Stylized bolt inside the crest.
    ;[
      [0.0, 0.028, 0.018, 0.03, 0.35],
      [0.01, 0.0, 0.022, 0.022, -0.55],
      [-0.006, -0.024, 0.016, 0.028, 0.45],
    ].forEach(([x, y, w, h, rot]) => {
      add('chest', <P s={S.box(w, h, 0.008, 0.003)} m={crestBolt} line={false} p={[x, ch * 0.62 + y, cd * 0.57]} r={[0, 0, rot]} />)
    })

    // Lightning belt.
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.04, pr.chestD * 1.02, 0.012)} m={classic ? M.accent : M.secondary} p={[0, pr.abdomen * 0.2, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.014, pr.chestD * 1.04, 0.004)} m={M.glow} line={false} shadow={false} p={[0, pr.abdomen * 0.22, 0]} />)
    ;[
      [-0.04, 0.02, 0.35],
      [0.0, 0.028, -0.5],
      [0.04, 0.02, 0.4],
    ].forEach(([x, w, rot]) => {
      add('spine', <P s={S.box(w, 0.035, 0.012, 0.004)} m={M.accent} line={false} p={[x, pr.abdomen * 0.22, pr.chestD * 0.52]} r={[0, 0, rot]} />)
    })

    // Muscle-seam glow lines on torso.
    sides((s) => {
      add('chest', <P s={S.box(0.008, ch * 0.7, 0.006, 0.002)} m={M.glow} line={false} shadow={false} p={[s * cw * 0.38, ch * 0.45, cd * 0.52]} />)
    })
    add('chest', <P s={S.box(cw * 0.55, 0.008, 0.006, 0.002)} m={M.glow} line={false} shadow={false} p={[0, ch * 0.35, cd * 0.52]} />)

    // Arm / thigh / calf bolt accents.
    const limbBolts: [BoneName, number, number, number, number, number][] = []
    sides((s, l) => {
      limbBolts.push(
        [`${l}Upper` as BoneName, s * 0.035 * L, -pr.upperArm * 0.35, 0.014, 0.08, 0.55],
        [`${l}Upper` as BoneName, s * 0.03 * L, -pr.upperArm * 0.55, 0.016, 0.06, -0.45],
        [`${l}Fore` as BoneName, s * 0.028 * L, -pr.forearm * 0.45, 0.012, 0.07, 0.5],
        [`${l}Thigh` as BoneName, s * 0.04 * L, -pr.thigh * 0.4, 0.016, 0.09, 0.4],
        [`${l}Thigh` as BoneName, s * 0.035 * L, -pr.thigh * 0.65, 0.014, 0.07, -0.5],
        [`${l}Shin` as BoneName, s * 0.03 * L, -pr.shin * 0.45, 0.012, 0.08, 0.45],
      )
    })
    limbBolts.forEach(([b, x, y, w, h, rot]) => {
      add(b, <P s={S.box(w, h, 0.014, 0.004)} m={M.accent} line={false} p={[x, y, 0.035 * L]} r={[0, 0, rot]} />)
      add(b, <P s={S.box(w * 0.5, h * 0.5, 0.01, 0.003)} m={M.glow} line={false} shadow={false} p={[x, y, 0.04 * L]} r={[0, 0, rot]} />)
    })

    // Boot shafts — navy for Manhattan, gold for classic Flash.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.038 * L, 0.042 * L, pr.shin * 0.55, 12)} m={bootMat} p={[0, -pr.shin * 0.68, 0]} />)
      add(shin, <P s={S.cyl(0.04 * L, 0.04 * L, 0.014, 12)} m={M.glow} line={false} shadow={false} p={[0, -pr.shin * 0.48, 0]} />)
      add(foot, <P s={S.box(0.02 * L, 0.012, 0.04, 0.004)} m={M.accent} line={false} p={[0, 0.018, 0.04]} r={[0, 0, 0.5]} />)
    })

    // Live Speed Force arcs — shoulder / heel snap.
    const arcs: [BoneName, number, number, number, number, number, number][] = [
      ['rUpper', -0.04 * L, -pr.upperArm * 0.15, 0.04 * L, 0.014, 0.07, -0.9],
      ['lUpper', 0.04 * L, -pr.upperArm * 0.25, 0.035 * L, 0.012, 0.06, 0.85],
      ['chest', -cw * 0.38, ch * 0.85, cd * 0.52, 0.014, 0.06, 1.1],
      ['chest', cw * 0.32, ch * 0.75, cd * 0.5, 0.012, 0.05, -0.9],
      ['rFoot', -0.01 * L, 0.02, 0.05 * L, 0.01, 0.04, -0.6],
      ['lFoot', 0.01 * L, 0.02, 0.05 * L, 0.01, 0.04, 0.55],
      ['rShin', -0.02 * L, -pr.shin * 0.85, 0.03 * L, 0.01, 0.04, 0.4],
      ['lHand', 0.01 * L, -pr.hand * 1.4, 0.02 * L, 0.008, 0.03, 0.8],
    ]
    arcs.forEach(([b, x, y, z, w, h, rot], i) => {
      add(b, <P s={S.shard(w, h, 0.006)} m={i % 2 ? M.glow : M.glowAlt} line={false} shadow={false} p={[x, y, z]} r={[0.2, 0.15, rot]} />)
      add(b, <P s={S.shard(w * 0.5, h * 0.55, 0.004)} m={M.glowAlt} line={false} shadow={false} p={[x + 0.01, y - h * 0.3, z + 0.004]} r={[-0.25, -0.2, rot + 1.0]} />)
    })
  }
  if (has('springs')) {
    sides((_s, l) => {
      for (let i = 0; i < 4; i++) {
        add(`${l}Shin` as BoneName, <P s={S.torus(0.018, 0.005, Math.PI * 2, 10)} m={M.metal} line={false} p={[0, -pr.shin * 0.35 - i * 0.022, -0.04 * L]} r={[Math.PI / 2, 0, 0]} />)
      }
    })
  }
  if (has('pouches')) {
    sides((s) =>
      add('pelvis', <P s={S.box(0.04, 0.045, 0.035, 0.01)} m={M.trim} p={[s * pr.pelvisW * 0.48, 0.0, pr.pelvisD * 0.2]} />),
    )
    add('pelvis', <P s={S.box(0.05, 0.04, 0.035, 0.01)} m={M.secondary} p={[0, 0.0, -pr.pelvisD * 0.55]} />)
  }
  if (has('knifeCharm')) {
    add('pelvis', <P s={S.torus(0.012, 0.003, Math.PI * 2, 8)} m={M.metal} line={false} p={[-pr.pelvisW * 0.35, 0.02, pr.pelvisD * 0.55]} />)
    add('pelvis', <P s={S.box(0.008, 0.05, 0.003, 0.001)} m={M.metal} p={[-pr.pelvisW * 0.35, -0.02, pr.pelvisD * 0.55]} r={[0, 0, 0.3]} />)
  }
  if (has('obi')) {
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.7, pr.chestD * 0.98, 0.012)} m={M.accent} p={[0, pr.abdomen * 0.35, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.01, pr.chestD * 1.0, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.35, 0]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.07, 0.05, 0.016)} m={M.accent} p={[s * 0.04, pr.abdomen * 0.4, -pr.chestD * 0.58]} r={[0, 0, s * 0.5]} />),
    )
    add('spine', <P s={S.panel(0.04, 0.12, 0.012)} m={M.accent} p={[0.012, pr.abdomen * 0.0, -pr.chestD * 0.6]} r={[0.1, 0, 0.1]} />)
  }
  if (has('riotGear')) {
    // Red Riot — gear pauldrons, black sleeves, jaw mask, R-belt waist-cape.
    const sleeve = M.trim
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.038 * L, 0.03 * L, pr.upperArm)} m={sleeve} />)
      add(up, <P s={S.sphere(0.042 * L, 12, 10)} m={sleeve} p={[0, -0.004, 0]} />)
      add(fore, <P s={S.limb(0.03 * L, 0.024 * L, pr.forearm)} m={sleeve} />)
      add(fore, <P s={S.cyl(0.028 * L, 0.03 * L, 0.028, 12)} m={M.accent} p={[0, -pr.forearm + 0.014, 0]} />)
    })

    // Gear-toothed pauldrons.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      const scale = Math.sqrt(L)
      add(up, <P s={S.cyl(0.07 * scale, 0.07 * scale, 0.055 * scale, 16)} m={M.accent} p={[s * 0.02, 0.04, 0]} r={[0, 0, s * -0.55]} />)
      add(up, <P s={S.cyl(0.048 * scale, 0.048 * scale, 0.03 * scale, 12)} m={M.metal} p={[s * 0.028, 0.045, 0.01]} r={[0, 0, s * -0.55]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          up,
          <P
            s={S.box(0.018 * scale, 0.028 * scale, 0.022 * scale, 0.004)}
            m={i % 2 ? M.metal : M.accent}
            p={[s * 0.02 + Math.cos(a) * 0.068 * scale, 0.04 + Math.sin(a) * 0.068 * scale, 0]}
            r={[0, 0, s * -0.55 + a]}
          />,
        )
      }
      add(up, <P s={S.box(0.1 * scale, 0.035 * scale, 0.08 * scale, 0.012)} m={M.accent} p={[s * 0.035, 0.01, 0.01]} r={[0.15, 0, s * -0.35]} />)
    })

    // Diagonal chest strap.
    add('chest', <P s={S.box(0.018, ch * 1.05, 0.012, 0.004)} m={M.accent} p={[cw * 0.02, ch * 0.48, cd * 0.52]} r={[0, 0, -0.55]} />)
    add('chest', <P s={S.cyl(0.012, 0.012, 0.01, 8)} m={M.trim} p={[cw * 0.18, ch * 0.78, cd * 0.54]} r={[Math.PI / 2, 0, 0]} />)

    // R-belt + tattered waist-cape (open at front).
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.055, pr.chestD * 1.05, 0.014)} m={M.accent} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.box(0.055, 0.055, 0.02, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.12, pr.chestD * 0.55]} />)
    // Stylized R buckle.
    add('spine', <P s={S.box(0.028, 0.038, 0.01, 0.003)} m={M.light} line={false} p={[-0.006, pr.abdomen * 0.12, pr.chestD * 0.58]} />)
    add('spine', <P s={S.box(0.02, 0.012, 0.01, 0.003)} m={M.light} line={false} p={[0.012, pr.abdomen * 0.12 + 0.012, pr.chestD * 0.58]} />)
    add('spine', <P s={S.box(0.016, 0.012, 0.01, 0.003)} m={M.light} line={false} p={[0.01, pr.abdomen * 0.12 - 0.01, pr.chestD * 0.58]} r={[0, 0, 0.45]} />)

    const capeLen = pr.hipH * 0.55 + pr.thigh * 0.35
    sides((s) => {
      add(
        'pelvis',
        <P
          s={S.panel(pr.pelvisW * 0.55, capeLen, 0.018, -0.04)}
          m={M.accent}
          p={[s * pr.pelvisW * 0.28, -capeLen * 0.42, -pr.pelvisD * 0.15]}
          r={[0.12, s * 0.35, s * 0.08]}
        />,
      )
      add(
        'pelvis',
        <P
          s={S.panel(pr.pelvisW * 0.32, capeLen * 0.72, 0.014, -0.03)}
          m={M.metal}
          p={[s * pr.pelvisW * 0.42, -capeLen * 0.28, pr.pelvisD * 0.15]}
          r={[0.2, s * 0.9, s * -0.05]}
        />,
      )
      for (let i = 0; i < 3; i++) {
        add(
          'pelvis',
          <P
            s={S.shard(0.02, 0.05 + i * 0.01, 0.01)}
            m={i % 2 ? M.accent : M.metal}
            p={[s * (0.06 + i * 0.04), -capeLen * (0.75 + i * 0.05), -0.02 + i * 0.01]}
            r={[0.4, s * 0.3, s * (0.2 + i * 0.15)]}
          />,
        )
      }
    })

    // Jagged black jaw mask (menpo) — open center so the grin reads.
    {
      const r = pr.headR
      // Chin plate + side guards; mouth window left clear.
      add('head', <P s={S.box(r * 0.62, r * 0.22, r * 0.2, r * 0.05)} m={M.trim} p={[0, -r * 0.78, r * 0.48]} />)
      sides((s) => {
        add('head', <P s={S.box(r * 0.32, r * 0.48, r * 0.18, r * 0.05)} m={M.trim} p={[s * r * 0.58, -r * 0.48, r * 0.32]} r={[0.08, s * 0.5, s * 0.12]} />)
        add('head', <P s={S.box(r * 0.22, r * 0.14, r * 0.12, r * 0.04)} m={M.trim} p={[s * r * 0.42, -r * 0.28, r * 0.7]} r={[0.15, s * 0.35, 0]} />)
        add('head', <P s={S.shard(r * 0.1, r * 0.16, r * 0.05)} m={M.trim} p={[s * r * 0.28, -r * 0.88, r * 0.72]} r={[0.7, s * 0.15, 0]} />)
        add('head', <P s={S.box(r * 0.07, r * 0.2, r * 0.05, r * 0.015)} m={M.metal} line={false} p={[s * r * 0.7, -r * 0.4, r * 0.48]} />)
        // Tooth spikes along the bridge of the nose guard.
        add('head', <P s={S.cone(r * 0.04, r * 0.1, 4)} m={M.trim} line={false} p={[s * r * 0.18, -r * 0.16, r * 0.82]} r={[Math.PI, 0, 0]} />)
      })
      add('head', <P s={S.cone(r * 0.045, r * 0.11, 4)} m={M.trim} line={false} p={[0, -r * 0.14, r * 0.86]} r={[Math.PI, 0, 0]} />)
      // Forehead gear horn.
      add('head', <P s={S.box(r * 0.32, r * 0.1, r * 0.1, r * 0.03)} m={M.trim} p={[0, r * 0.72, r * 0.32]} r={[-0.4, 0, 0]} />)
      sides((s) =>
        add('head', <P s={S.shard(r * 0.08, r * 0.16, r * 0.05)} m={M.trim} p={[s * r * 0.2, r * 0.88, r * 0.25]} r={[-0.25, 0, s * -0.45]} />),
      )
    }

    // Crimson combat boots — ridge shafts + mid-foot straps over base boots.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.04 * L, 0.045 * L, 0.16, 12)} m={M.accent} p={[0, -pr.shin + 0.08, 0]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.048 * L, 0.02, 12)} m={M.metal} p={[0, -pr.shin + 0.14, 0]} />)
      add(shin, <P s={S.cyl(0.046 * L, 0.046 * L, 0.016, 12)} m={M.trim} p={[0, -pr.shin + 0.1, 0]} />)
      add(foot, <P s={S.box(0.075 * Math.sqrt(L), 0.04, 0.12, 0.014)} m={M.accent} p={[0, -pr.ankle + 0.035, 0.045]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.014, 0.04, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.05, 0.06]} />)
      // Hardening pebble cloud — live orbit in HeroFighter.
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (l === 'l' ? 0 : 0.4)
        add(
          foot,
          <P
            s={S.shard(0.012 + (i % 2) * 0.006, 0.018, 0.01)}
            m={i % 2 ? M.accent : M.metal}
            line={false}
            shadow={false}
            p={[Math.cos(a) * 0.08, 0.04 + (i % 2) * 0.03, Math.sin(a) * 0.08]}
            r={[0.3, a, 0.5]}
          />,
        )
      }
    })
  }
  if (has('fortressPlate')) {
    // Brutalist concrete / tungsten walking-fortress plating.
    add('chest', <P s={S.box(cw * 1.05, ch * 0.72, 0.04, 0.01)} m={M.primary} p={[0, ch * 0.48, cd * 0.52]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.28, 0.02, 0.006)} m={M.metal} p={[0, ch * 0.7, cd * 0.56]} />)
    add('chest', <P s={S.box(cw * 0.9, 0.03, 0.018, 0.006)} m={M.trim} p={[0, ch * 0.28, cd * 0.58]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.05, ch * 0.55, 0.05, 0.012)} m={M.metal} p={[s * cw * 0.48, ch * 0.5, cd * 0.15]} />)
      add('chest', <P s={S.box(0.02, ch * 0.2, 0.01, 0.004)} m={M.accent} line={false} p={[s * cw * 0.48, ch * 0.62, cd * 0.2]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.25, pr.abdomen * 0.85, pr.chestD * 1.05, 0.02)} m={M.secondary} p={[0, pr.abdomen * 0.4, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 0.7, 0.04, pr.chestD * 0.7, 0.01)} m={M.metal} p={[0, pr.abdomen * 0.55, pr.chestD * 0.35]} />)
    sides((s, l) => {
      const fore = `${l}Fore` as BoneName
      const up = `${l}Upper` as BoneName
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      // Plated gauntlets.
      add(up, <P s={S.box(0.09 * L, pr.upperArm * 0.55, 0.08 * L, 0.018)} m={M.metal} p={[s * 0.01, -pr.upperArm * 0.4, 0]} />)
      add(fore, <P s={S.box(0.1 * L, pr.forearm * 0.7, 0.09 * L, 0.02)} m={M.primary} p={[0, -pr.forearm * 0.55, 0]} />)
      add(fore, <P s={S.box(0.08 * L, 0.04, 0.03, 0.01)} m={M.metal} p={[0, -pr.forearm * 0.35, 0.04 * L]} />)
      add(fore, <P s={S.box(0.05 * L, 0.02, 0.012, 0.004)} m={M.accent} line={false} p={[0, -pr.forearm * 0.32, 0.055 * L]} />)
      // Fortress greaves + crushing soles.
      add(shin, <P s={S.box(0.09 * L, pr.shin * 0.7, 0.08 * L, 0.018)} m={M.primary} p={[0, -pr.shin * 0.5, 0.01]} />)
      add(shin, <P s={S.box(0.07 * L, 0.05, 0.03, 0.01)} m={M.metal} p={[0, -pr.shin * 0.35, 0.045 * L]} />)
      add(foot, <P s={S.box(0.1 * L, 0.035, 0.14, 0.012)} m={M.metal} p={[0, -pr.ankle + 0.02, 0.04]} />)
      // Baked pebble cloud — live orbit in HeroFighter sells the tremor.
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + (l === 'l' ? 0 : 0.4)
        add(
          foot,
          <P
            s={S.shard(0.012 + (i % 2) * 0.006, 0.018, 0.01)}
            m={i % 2 ? M.primary : M.metal}
            line={false}
            shadow={false}
            p={[Math.cos(a) * 0.08, 0.04 + (i % 2) * 0.03, Math.sin(a) * 0.08]}
            r={[0.3, a, 0.5]}
          />,
        )
      }
      void s
    })
  }
  if (has('magCoils')) {
    // High-tension magnetic coils running parallel down limbs + spine.
    const coils: [BoneName, number, number, number, number, number, number, number][] = [
      ['chest', 0, ch * 0.55, cd * 0.54, cw * 0.55, 0.014, 0.014, 0],
      ['chest', cw * 0.18, ch * 0.4, cd * 0.53, 0.012, ch * 0.5, 0.012, 0.12],
      ['chest', -cw * 0.18, ch * 0.4, cd * 0.53, 0.012, ch * 0.5, 0.012, -0.12],
      ['spine', 0, pr.abdomen * 0.5, pr.chestD * 0.5, pr.waistW * 0.55, 0.012, 0.012, 0],
      ['lUpper', 0.028 * L, -pr.upperArm * 0.5, 0.018 * L, 0.012, pr.upperArm * 0.82, 0.012, 0.04],
      ['rUpper', -0.028 * L, -pr.upperArm * 0.5, 0.018 * L, 0.012, pr.upperArm * 0.82, 0.012, -0.04],
      ['lFore', 0.022 * L, -pr.forearm * 0.45, 0.014 * L, 0.011, pr.forearm * 0.78, 0.011, 0.06],
      ['rFore', -0.022 * L, -pr.forearm * 0.45, 0.014 * L, 0.011, pr.forearm * 0.78, 0.011, -0.06],
      ['lThigh', 0.028 * L, -pr.thigh * 0.48, 0.022 * L, 0.012, pr.thigh * 0.78, 0.012, 0.04],
      ['rThigh', -0.028 * L, -pr.thigh * 0.48, 0.022 * L, 0.012, pr.thigh * 0.78, 0.012, -0.04],
      ['lShin', 0.02 * L, -pr.shin * 0.45, 0.02 * L, 0.011, pr.shin * 0.72, 0.011, 0.05],
      ['rShin', -0.02 * L, -pr.shin * 0.45, 0.02 * L, 0.011, pr.shin * 0.72, 0.011, -0.05],
    ]
    coils.forEach(([b, x, y, z, w, h, d, rot]) => {
      add(b, <P s={S.box(w, h, d, 0.002)} m={M.glow} line={false} shadow={false} p={[x, y, z]} r={[0, 0, rot]} />)
      add(b, <P s={S.box(w * 0.55, h * 0.92, d * 0.55, 0.001)} m={M.metal} line={false} shadow={false} p={[x, y, z + 0.004]} r={[0, 0, rot]} />)
    })
    // Core hum ring + parallel coil wraps on forearms / shins.
    add('chest', <P s={S.torus(0.055, 0.01, Math.PI * 2, 18)} m={M.glow} shadow={false} p={[0, ch * 0.62, cd * 0.52]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.cyl(0.022, 0.022, 0.03, 12)} m={M.metal} p={[0, ch * 0.62, cd * 0.54]} r={[Math.PI / 2, 0, 0]} />)
    sides((_s, l) => {
      for (let i = 0; i < 3; i++) {
        add(
          `${l}Fore` as BoneName,
          <P s={S.torus(0.038 * L, 0.005, Math.PI * 2, 14)} m={M.glow} shadow={false} p={[0, -pr.forearm * (0.35 + i * 0.18), 0]} r={[Math.PI / 2, 0, 0]} />,
        )
        add(
          `${l}Shin` as BoneName,
          <P s={S.torus(0.032 * L, 0.005, Math.PI * 2, 14)} m={M.glow} shadow={false} p={[0, -pr.shin * (0.35 + i * 0.18), 0]} r={[Math.PI / 2, 0, 0]} />,
        )
      }
    })
    // Iron-filing grid shards — live assemble/disassemble in HeroFighter.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add(
        'pelvis',
        <P
          s={S.shard(0.006, 0.028, 0.004)}
          m={i % 2 ? M.glow : M.metal}
          line={false}
          shadow={false}
          p={[Math.cos(a) * 0.16, 0.08 + (i % 3) * 0.04, Math.sin(a) * 0.16]}
          r={[0.2, a, 0.4]}
        />,
      )
    }
  }
  if (has('vectorTee')) {
    // Accelerator street tee — white vector glyphs on black.
    const z = cd * 0.545
    // Collarbone horns / claw marks.
    sides((s) => {
      add('chest', <P s={S.box(cw * 0.22, 0.014, 0.01, 0.004)} m={M.accent} line={false} p={[s * cw * 0.2, ch * 0.88, z]} r={[0, 0, s * -0.55]} />)
      add('chest', <P s={S.box(cw * 0.14, 0.012, 0.009, 0.003)} m={M.accent} line={false} p={[s * cw * 0.3, ch * 0.78, z]} r={[0, 0, s * -1.05]} />)
    })
    // Center diamond stack (chest → gut).
    ;[
      [ch * 0.62, 0.028],
      [ch * 0.42, 0.024],
      [ch * 0.22, 0.02],
    ].forEach(([y, s]) => {
      add('chest', <P s={S.box(s, s, 0.01, 0.003)} m={M.accent} line={false} p={[0, y, z]} r={[0, 0, Math.PI / 4]} />)
    })
    // Jagged side V / lightning bars — stacked chevrons per side.
    const bars: [number, number, number, number][] = [
      [0.18, 0.78, 0.2, 0.018],
      [0.22, 0.62, 0.24, 0.016],
      [0.2, 0.46, 0.22, 0.015],
      [0.16, 0.3, 0.18, 0.014],
    ]
    bars.forEach(([x, yFrac, w, h], i) => {
      const y = ch * yFrac
      const tilt = i % 2 === 0 ? 0.35 : -0.45
      sides((s) => {
        add('chest', <P s={S.box(cw * w, h, 0.01, 0.003)} m={M.accent} line={false} p={[s * cw * x, y, z]} r={[0, 0, s * tilt]} />)
        add('chest', <P s={S.box(cw * w * 0.55, h * 0.7, 0.008, 0.002)} m={M.accent} line={false} p={[s * cw * (x + 0.06), y - h * 1.1, z]} r={[0, 0, s * -tilt]} />)
      })
    })
    // Sleeve stripes.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.cyl(0.042 * L, 0.042 * L, 0.012, 12)} m={M.accent} line={false} p={[0, -pr.upperArm * 0.28, 0]} />)
      add(up, <P s={S.cyl(0.04 * L, 0.04 * L, 0.01, 12)} m={M.accent} line={false} p={[0, -pr.upperArm * 0.4, 0]} />)
    })
    // Soft red vector haze — reads as passive reflection field.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      add(
        'pelvis',
        <P
          s={S.shard(0.005, 0.022, 0.003)}
          m={i % 2 ? M.glow : M.accent}
          line={false}
          shadow={false}
          p={[Math.cos(a) * 0.14, 0.1 + (i % 2) * 0.04, Math.sin(a) * 0.14]}
          r={[0.15, a, 0.35]}
        />,
      )
    }
  }

  if (has('yamamotoSuit')) {
    // Yamamoto — waist-long white beard, captain haori (purple lining), white obi, waraji.
    const r = pr.headR

    // Long white brows.
    sides((s) =>
      add(
        'head',
        <P
          s={S.box(r * 0.42, r * 0.055, r * 0.04, r * 0.015)}
          m={M.hair}
          line={false}
          shadow={false}
          p={[s * r * 0.32, r * 0.22, r * 0.88]}
          r={[0.1, s * 0.25, s * -0.35]}
        />,
      ),
    )

    // Mustache + waist-length beard with purple ribbon ties.
    add('head', <P s={S.box(r * 0.55, r * 0.08, r * 0.12, r * 0.03)} m={M.hair} p={[0, -r * 0.42, r * 0.78]} r={[0.35, 0, 0]} />)
    sides((s) =>
      add('head', <P s={S.box(r * 0.22, r * 0.07, r * 0.1, r * 0.025)} m={M.hair} p={[s * r * 0.28, -r * 0.4, r * 0.72]} r={[0.3, s * 0.4, s * 0.15]} />),
    )
    const beardLen = ch * 1.35 + pr.hipH * 0.85
    add('chest', <P s={S.panel(0.11 * L, beardLen, 0.04, 0.02)} m={M.hair} p={[0, ch * 0.55 - beardLen * 0.35, cd * 0.62]} r={[0.18, 0, 0]} />)
    add('chest', <P s={S.panel(0.085 * L, beardLen * 0.92, 0.032, 0.016)} m={M.hairShade} line={false} p={[0.01, ch * 0.5 - beardLen * 0.32, cd * 0.58]} r={[0.2, 0.05, 0.04]} />)
    sides((s) =>
      add(
        'chest',
        <P
          s={S.panel(0.055 * L, beardLen * 0.78, 0.028, 0.012)}
          m={M.hair}
          p={[s * 0.045, ch * 0.48 - beardLen * 0.28, cd * 0.55]}
          r={[0.22, s * 0.12, s * 0.08]}
        />,
      ),
    )
    // Purple ribbon ties along the beard.
    ;[0.22, 0.48, 0.74].forEach((t, i) => {
      add(
        'chest',
        <P
          s={S.box(0.07 + (i % 2) * 0.01, 0.012, 0.018, 0.004)}
          m={M.accent}
          line={false}
          p={[0, ch * 0.55 - beardLen * t, cd * 0.66]}
          r={[0.1, 0, (i - 1) * 0.08]}
        />,
      )
    })

    // White sash / obi.
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.55, pr.chestD * 0.98, 0.012)} m={M.light} p={[0, pr.abdomen * 0.32, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.01, pr.chestD * 1.0, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.32, 0]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.055, 0.04, 0.012)} m={M.light} p={[s * 0.035, pr.abdomen * 0.38, -pr.chestD * 0.55]} r={[0, 0, s * 0.45]} />),
    )

    // White captain haori — purple lining, flared open sides.
    {
      const len = pr.hipH * 1.15 + ch * 0.85 + pr.thigh * 0.45
      const w = cw * 1.42
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.28)} m={M.light} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.97, 0.012, -w * 0.27)} m={M.accent} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.06, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.3, len * 0.82, 0.018, -0.05)}
            m={M.light}
            p={[s * w * 0.38, -len * 0.28, 0.02]}
            r={[0.12, s * 0.72, s * 0.06]}
          />,
        )
        add(
          'cape',
          <P
            s={S.panel(w * 0.26, len * 0.78, 0.01, -0.04)}
            m={M.accent}
            line={false}
            p={[s * w * 0.36, -len * 0.28, 0.032]}
            r={[0.12, s * 0.72, s * 0.06]}
          />,
        )
        add(
          'cape',
          <P
            s={S.shard(0.045, 0.12, 0.014)}
            m={M.light}
            p={[s * w * 0.46, -len + 0.05, -0.015]}
            r={[0.5, s * 0.25, s * 0.18]}
          />,
        )
      })
      add('chest', <P s={S.torus(cw * 0.44, 0.022, Math.PI, 14)} m={M.light} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    }

    // Wide black kimono sleeves.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.042 * L, 0.052 * L, pr.upperArm)} m={M.primary} />)
      add(up, <P s={S.sphere(0.044 * L, 12, 10)} m={M.primary} p={[0, -0.004, 0]} />)
      add(fore, <P s={S.limb(0.038 * L, 0.044 * L, pr.forearm * 0.85)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.042 * L, 0.048 * L, 0.04, 12)} m={M.primary} p={[0, -pr.forearm * 0.72, 0]} />)
    })

    // White tabi + straw waraji.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(foot, <P s={S.box(0.068 * Math.sqrt(L), 0.018, 0.11, 0.006)} m={M.light} p={[0, -pr.ankle + 0.014, 0.028]} />)
      add(foot, <P s={S.box(0.072 * Math.sqrt(L), 0.01, 0.12, 0.004)} m={M.metal} p={[0, -pr.ankle + 0.004, 0.03]} />)
      add(foot, <P s={S.box(0.014, 0.012, 0.08, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.024, 0.02]} />)
      add(shin, <P s={S.cyl(0.03 * L, 0.03 * L, 0.045, 10)} m={M.light} p={[0, -pr.shin + 0.02, 0]} />)
    })
  }

  if (has('kenpachiSuit')) {
    // Kenpachi — jagged eyepatch, bell-tipped spikes, ragged white haori (lavender lining), notched bandage blade accents, tabi.
    const r = pr.headR

    // Jagged black eyepatch over the right eye + silver studs.
    add('head', <P s={S.box(r * 0.48, r * 0.32, r * 0.12, r * 0.05)} m={M.trim} p={[r * 0.34, r * 0.1, r * 0.72]} r={[0, 0.28, 0.1]} />)
    add('head', <P s={S.box(r * 0.1, r * 0.05, r * 0.75, r * 0.02)} m={M.trim} line={false} p={[0, r * 0.28, 0]} r={[0.12, 0, 0.06]} />)
    for (const [dx, dy] of [
      [0.22, 0.2],
      [0.42, 0.16],
      [0.32, 0.0],
      [0.18, 0.02],
    ] as const) {
      add('head', <P s={S.sphere(r * 0.035, 8, 6)} m={M.metal} line={false} p={[r * dx, r * dy, r * 0.78]} />)
    }

    // Extra radial hair spikes + gold bells on the tips.
    ;[
      [0, 0.95, 1.15],
      [0.55, 0.85, 1.05],
      [-0.55, 0.85, 1.05],
      [0.95, 0.55, 0.95],
      [-0.95, 0.55, 0.95],
      [1.15, 0.15, 0.85],
      [-1.15, 0.15, 0.85],
      [0.75, -0.15, 0.75],
      [-0.75, -0.15, 0.75],
    ].forEach(([x, y, len], i) => {
      const tipX = r * x * 1.35
      const tipY = r * (0.55 + y)
      const tipZ = r * (-0.15 + (i % 3) * 0.04)
      add(
        'head',
        <P
          s={S.cone(r * 0.12, r * len, 5)}
          m={i % 2 ? M.hairShade : M.hair}
          p={[tipX * 0.45, tipY * 0.55, tipZ * 0.4]}
          r={[0.9 + y * 0.2, 0, -x * 0.55]}
        />,
      )
      add('head', <P s={S.sphere(r * 0.07, 8, 6)} m={M.metal} p={[tipX, tipY, tipZ]} />)
      add('head', <P s={S.sphere(r * 0.035, 6, 5)} m={M.glow} line={false} shadow={false} p={[tipX, tipY - r * 0.02, tipZ + r * 0.02]} />)
    })

    // White sash / obi.
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.55, pr.chestD * 0.98, 0.012)} m={M.light} p={[0, pr.abdomen * 0.32, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.01, pr.chestD * 1.0, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.32, 0]} />)

    // Ragged sleeveless white captain haori — torn hem, lavender lining.
    {
      const len = pr.hipH * 1.1 + ch * 0.8 + pr.thigh * 0.4
      const w = cw * 1.36
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.24)} m={M.light} p={[0, -len / 2 + 0.02, -0.03]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.96, 0.012, -w * 0.22)} m={M.accent} line={false} p={[0, -len / 2 + 0.025, -0.016]} r={[0.08, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.28, len * 0.82, 0.018, -0.05)}
            m={M.light}
            p={[s * w * 0.38, -len * 0.3, 0.018]}
            r={[0.12, s * 0.6, s * 0.06]}
          />,
        )
        // Torn hem shards.
        for (let i = 0; i < 3; i++) {
          add(
            'cape',
            <P
              s={S.shard(0.045 + i * 0.01, 0.12 + i * 0.04, 0.014)}
              m={M.light}
              p={[s * w * (0.28 + i * 0.08), -len + 0.02 + i * 0.02, -0.02]}
              r={[0.5 + i * 0.1, s * 0.25, s * (0.15 + i * 0.08)]}
            />,
          )
        }
      })
      add('chest', <P s={S.torus(cw * 0.44, 0.022, Math.PI, 14)} m={M.light} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    }

    // Wide black kimono sleeves under the sleeveless haori.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.042 * L, 0.052 * L, pr.upperArm)} m={M.primary} />)
      add(up, <P s={S.sphere(0.044 * L, 12, 10)} m={M.primary} p={[0, -0.004, 0]} />)
      add(fore, <P s={S.limb(0.038 * L, 0.044 * L, pr.forearm * 0.85)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.042 * L, 0.048 * L, 0.04, 12)} m={M.primary} p={[0, -pr.forearm * 0.72, 0]} />)
    })

    // White tabi + straw waraji.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(foot, <P s={S.box(0.068 * Math.sqrt(L), 0.018, 0.11, 0.006)} m={M.light} p={[0, -pr.ankle + 0.014, 0.028]} />)
      add(foot, <P s={S.box(0.072 * Math.sqrt(L), 0.01, 0.12, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.004, 0.03]} />)
      add(foot, <P s={S.box(0.014, 0.012, 0.08, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.024, 0.02]} />)
      add(shin, <P s={S.cyl(0.03 * L, 0.03 * L, 0.045, 10)} m={M.light} p={[0, -pr.shin + 0.02, 0]} />)
    })
  }

  if (has('byakuyaSuit')) {
    // Byakuya — white kenseikan, mint ginpaku scarf, sleeveless captain haori, white obi, waraji.
    const r = pr.headR

    // White kenseikan — large crown pair + smaller right-side tubes.
    add('head', <P s={S.cyl(r * 0.09, r * 0.09, r * 0.55, 10)} m={M.light} p={[-r * 0.12, r * 1.05, -r * 0.15]} r={[0.15, 0.2, -0.55]} />)
    add('head', <P s={S.cyl(r * 0.09, r * 0.09, r * 0.55, 10)} m={M.light} p={[r * 0.12, r * 1.05, -r * 0.15]} r={[0.15, -0.2, 0.55]} />)
    add('head', <P s={S.cyl(r * 0.055, r * 0.055, r * 0.42, 8)} m={M.light} p={[r * 0.55, r * 0.72, r * 0.05]} r={[0.25, 0.4, 1.05]} />)
    add('head', <P s={S.cyl(r * 0.05, r * 0.05, r * 0.36, 8)} m={M.light} p={[r * 0.62, r * 0.55, r * 0.12]} r={[0.35, 0.35, 1.15]} />)

    // Mint ginpaku scarf — thick loops + long trailing panels.
    add('neck', <P s={S.torus(0.052 * Math.sqrt(L), 0.028, Math.PI * 2, 16)} m={M.accent} p={[0, 0.01, 0.002]} r={[Math.PI / 2 - 0.12, 0, 0]} />)
    add('neck', <P s={S.torus(0.048 * Math.sqrt(L), 0.024, Math.PI * 2, 14)} m={M.accent} p={[0, 0.038, 0.006]} r={[Math.PI / 2 + 0.08, 0, 0]} />)
    add('chest', <P s={S.panel(0.09, 0.28, 0.018, 0.02)} m={M.accent} p={[0.05, ch * 0.55, cd * 0.58]} r={[-0.2, 0.15, 0.12]} />)
    add('chest', <P s={S.panel(0.075, 0.22, 0.016, 0.018)} m={M.accent} p={[-0.04, ch * 0.48, cd * 0.55]} r={[-0.15, -0.1, -0.18]} />)
    add('cape', <P s={S.panel(0.08, 0.38, 0.014, 0.02)} m={M.accent} p={[0.06, -0.12, -0.01]} r={[0.35, 0.1, -0.08]} />)
    add('cape', <P s={S.panel(0.07, 0.3, 0.014, 0.018)} m={M.accent} p={[-0.05, -0.08, -0.02]} r={[0.4, -0.08, 0.12]} />)

    // White sash / obi over the black kimono.
    add('spine', <P s={S.box(pr.waistW * 1.18, pr.abdomen * 0.55, pr.chestD * 0.98, 0.012)} m={M.light} p={[0, pr.abdomen * 0.32, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.01, pr.chestD * 1.0, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.32, 0]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.06, 0.045, 0.014)} m={M.light} p={[s * 0.035, pr.abdomen * 0.38, -pr.chestD * 0.55]} r={[0, 0, s * 0.45]} />),
    )

    // Sleeveless white captain haori — open front, teal-tint lining via accent edge.
    {
      const len = pr.hipH * 1.05 + ch * 0.75 + pr.thigh * 0.35
      const w = cw * 1.32
      add('cape', <P s={S.panel(w, len, 0.02, -w * 0.22)} m={M.light} p={[0, -len / 2 + 0.02, -0.028]} r={[0.07, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.96, 0.01, -w * 0.2)} m={M.accent} line={false} p={[0, -len / 2 + 0.025, -0.014]} r={[0.07, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.26, len * 0.78, 0.016, -0.04)}
            m={M.light}
            p={[s * w * 0.36, -len * 0.3, 0.015]}
            r={[0.1, s * 0.58, s * 0.05]}
          />,
        )
        // Tattered / flared hem tips.
        add(
          'cape',
          <P
            s={S.shard(0.04, 0.1, 0.012)}
            m={M.light}
            p={[s * w * 0.42, -len + 0.04, -0.02]}
            r={[0.45, s * 0.2, s * 0.15]}
          />,
        )
      })
      add('chest', <P s={S.torus(cw * 0.42, 0.02, Math.PI, 14)} m={M.light} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    }

    // Wide black kimono sleeves (sleeveless haori over them).
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.04 * L, 0.05 * L, pr.upperArm)} m={M.primary} />)
      add(up, <P s={S.sphere(0.042 * L, 12, 10)} m={M.primary} p={[0, -0.004, 0]} />)
      add(fore, <P s={S.limb(0.036 * L, 0.042 * L, pr.forearm * 0.85)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.045 * L, 0.04, 12)} m={M.primary} p={[0, -pr.forearm * 0.72, 0]} />)
    })

    // White tabi + straw waraji.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(foot, <P s={S.box(0.068 * Math.sqrt(L), 0.018, 0.11, 0.006)} m={M.light} p={[0, -pr.ankle + 0.014, 0.028]} />)
      add(foot, <P s={S.box(0.072 * Math.sqrt(L), 0.01, 0.12, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.004, 0.03]} />)
      add(foot, <P s={S.box(0.014, 0.012, 0.08, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.024, 0.02]} />)
      add(shin, <P s={S.cyl(0.03 * L, 0.03 * L, 0.045, 10)} m={M.light} p={[0, -pr.shin + 0.02, 0]} />)
    })
  }

  if (has('zenitsuSuit')) {
    // Zenitsu — yellow△ haori, white obi, patterned kyahan, tabi + zori.
    const front = cd * 0.52

    // High dark gakuran collar + gold buttons already from top; add white obi.
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.5, pr.chestD * 1.0, 0.012)} m={M.light} p={[0, pr.abdomen * 0.3, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.01, pr.chestD * 1.02, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.3, 0]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.05, 0.04, 0.012)} m={M.light} p={[s * 0.03, pr.abdomen * 0.36, -pr.chestD * 0.52]} r={[0, 0, s * 0.4]} />),
    )

    // Yellow-orange triangle haori — open front, white △ marks.
    {
      const len = pr.hipH * 1.05 + ch * 0.8 + pr.thigh * 0.4
      const w = cw * 1.28
      add('cape', <P s={S.panel(w, len, 0.02, -w * 0.2)} m={M.secondary} p={[0, -len / 2 + 0.02, -0.03]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.96, 0.01, -w * 0.18)} m={M.accent} line={false} p={[0, -len / 2 + 0.025, -0.016]} r={[0.08, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.28, len * 0.82, 0.016, -0.04)}
            m={M.secondary}
            p={[s * w * 0.38, -len * 0.28, 0.02]}
            r={[0.12, s * 0.55, s * 0.06]}
          />,
        )
        // White triangle pattern accents along the hem / panels.
        for (let i = 0; i < 4; i++) {
          add(
            'cape',
            <P
              s={S.cone(0.028, 0.045, 3)}
              m={M.light}
              line={false}
              p={[s * w * (0.18 + i * 0.08), -len * (0.55 + i * 0.08), -0.01]}
              r={[Math.PI, 0, s * 0.1]}
            />,
          )
        }
      })
      add('chest', <P s={S.torus(cw * 0.4, 0.018, Math.PI, 14)} m={M.secondary} p={[0, ch * 0.98, -0.01]} r={[Math.PI / 2 + 0.28, 0, Math.PI]} />)
      // A few chest-side triangles.
      for (let i = 0; i < 3; i++) {
        add(
          'chest',
          <P
            s={S.cone(0.022, 0.036, 3)}
            m={M.light}
            line={false}
            p={[(i - 1) * cw * 0.22, ch * (0.35 + i * 0.08), front + 0.01]}
            r={[Math.PI, 0, 0]}
          />,
        )
      }
    }

    // Patterned kyahan (leg wraps) matching the haori + white tabi / zori.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.034 * L, 0.036 * L, pr.shin * 0.55, 12)} m={M.secondary} p={[0, -pr.shin * 0.55, 0]} />)
      for (let i = 0; i < 3; i++) {
        add(
          shin,
          <P
            s={S.cone(0.016, 0.028, 3)}
            m={M.light}
            line={false}
            p={[0.01, -pr.shin * (0.35 + i * 0.12), 0.028]}
            r={[Math.PI, 0.2, 0]}
          />,
        )
      }
      add(foot, <P s={S.box(0.068 * Math.sqrt(L), 0.016, 0.11, 0.006)} m={M.light} p={[0, -pr.ankle + 0.014, 0.028]} />)
      add(foot, <P s={S.box(0.072 * Math.sqrt(L), 0.01, 0.12, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.004, 0.03]} />)
      add(foot, <P s={S.box(0.014, 0.012, 0.08, 0.004)} m={M.light} p={[0, -pr.ankle + 0.024, 0.02]} />)
    })
  }

  if (has('zenitsuAwaken')) {
    // Sleeping thunder form — static yellow bolt shards around the torso (live aura in HeroFighter).
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add(
        'chest',
        <P
          s={S.shard(0.035, 0.09 + (i % 3) * 0.03, 0.018)}
          m={i % 2 ? M.glow : M.accent}
          line={false}
          shadow={false}
          p={[Math.cos(a) * cw * 0.78, ch * (0.25 + (i % 4) * 0.18), Math.sin(a) * cd * 0.65]}
          r={[0.5, a, 0.25]}
        />,
      )
    }
    // Bright closed-eye glow lines.
    const r = pr.headR
    sides((s) => {
      add(
        'head',
        <P
          s={S.box(r * 0.28, r * 0.045, r * 0.06, r * 0.015)}
          m={M.glow}
          line={false}
          shadow={false}
          p={[s * r * 0.3, r * 0.08, r * 0.92]}
          r={[0, 0, s * -0.08]}
        />,
      )
    })
  }

  if (has('ichigoSuit')) {
    // Ichigo Shikai — white obi, red bead strap, tabi + waraji (kimono sleeves from Outfit).
    const front = cd * 0.52

    // White sash / obi.
    add('spine', <P s={S.box(pr.waistW * 1.18, pr.abdomen * 0.55, pr.chestD * 0.98, 0.012)} m={M.light} p={[0, pr.abdomen * 0.32, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.01, pr.chestD * 1.0, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.32, 0]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.055, 0.042, 0.012)} m={M.light} p={[s * 0.032, pr.abdomen * 0.38, -pr.chestD * 0.55]} r={[0, 0, s * 0.45]} />),
    )

    // Red bead strap — diagonal right shoulder → left hip (Zangetsu carry cord).
    for (let i = 0; i < 9; i++) {
      const t = i / 8
      add(
        'chest',
        <P
          s={S.sphere(0.012 + (i % 2) * 0.003, 8, 6)}
          m={M.accent}
          p={[0.08 - t * 0.2, ch * (0.95 - t * 0.85), front * (0.55 + t * 0.15)]}
        />,
      )
    }
    add('chest', <P s={S.box(0.018, 0.018, 0.36, 0.006)} m={M.trim} line={false} p={[-0.02, ch * 0.55, front * 0.62]} r={[0.55, 0.15, -0.55]} />)

    // White collar lining flash.
    add('chest', <P s={S.cyl(0.052 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.055, 12, true)} m={M.light} line={false} p={[0, ch * 0.98, -0.005]} />)

    // White tabi + straw waraji.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(foot, <P s={S.box(0.068 * Math.sqrt(L), 0.018, 0.11, 0.006)} m={M.light} p={[0, -pr.ankle + 0.014, 0.028]} />)
      add(foot, <P s={S.box(0.072 * Math.sqrt(L), 0.01, 0.12, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.004, 0.03]} />)
      add(foot, <P s={S.box(0.014, 0.012, 0.08, 0.004)} m={M.trim} p={[0, -pr.ankle + 0.024, 0.02]} />)
      add(shin, <P s={S.cyl(0.03 * L, 0.03 * L, 0.045, 10)} m={M.light} p={[0, -pr.shin + 0.02, 0]} />)
    })
  }

  if (has('ichigoMugetsu')) {
    // Final Getsuga — face/chest seals, void lower cloak, right-arm dark blade.
    const r = pr.headR
    const front = cd * 0.55

    // Bandage-seal wraps over lower face up to the nose bridge.
    add('head', <P s={S.box(r * 1.55, r * 0.55, r * 0.7, r * 0.08)} m={M.trim} p={[0, -r * 0.15, r * 0.35]} />)
    add('head', <P s={S.box(r * 1.4, r * 0.12, r * 0.55, r * 0.04)} m={M.dark} line={false} p={[0, r * 0.05, r * 0.55]} />)
    add('head', <P s={S.box(r * 1.4, r * 0.1, r * 0.5, r * 0.03)} m={M.dark} line={false} p={[0, -r * 0.12, r * 0.52]} />)
    add('head', <P s={S.box(r * 1.35, r * 0.09, r * 0.45, r * 0.03)} m={M.dark} line={false} p={[0, -r * 0.28, r * 0.48]} />)

    // Chest / neck seal wraps.
    add('neck', <P s={S.cyl(0.055 * Math.sqrt(L), 0.05 * Math.sqrt(L), 0.07, 12)} m={M.trim} p={[0, 0.01, 0]} />)
    for (let i = 0; i < 5; i++) {
      add(
        'chest',
        <P
          s={S.box(cw * (0.85 - i * 0.05), 0.018, cd * 0.9, 0.006)}
          m={i % 2 ? M.trim : M.dark}
          line={false}
          p={[0, ch * (0.85 - i * 0.16), front * 0.15]}
          r={[0.08, 0, (i % 2 ? 1 : -1) * 0.04]}
        />,
      )
    }
    // Diagonal seal straps across the torso.
    sides((s) => {
      add(
        'chest',
        <P
          s={S.box(0.04, ch * 0.85, 0.02, 0.008)}
          m={M.trim}
          p={[s * cw * 0.28, ch * 0.35, front * 0.35]}
          r={[0.15, 0, s * 0.55]}
        />,
      )
    })

    // Void cloak from the waist — tattered black energy panels.
    {
      const len = pr.hipH * 1.1 + ch * 0.35 + pr.thigh * 0.85
      const w = cw * 1.45
      add('cape', <P s={S.panel(w, len, 0.024, -w * 0.25)} m={M.secondary} p={[0, -len / 2 + 0.02, -0.02]} r={[0.1, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.92, len * 0.95, 0.012, -w * 0.22)} m={M.trim} line={false} p={[0, -len / 2 + 0.025, -0.008]} r={[0.1, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.32, len * 0.85, 0.018, -0.05)}
            m={M.secondary}
            p={[s * w * 0.4, -len * 0.32, 0.02]}
            r={[0.15, s * 0.5, s * 0.08]}
          />,
        )
        for (let i = 0; i < 4; i++) {
          add(
            'cape',
            <P
              s={S.shard(0.04, 0.12 + (i % 2) * 0.04, 0.016)}
              m={i % 2 ? M.glow : M.dark}
              line={false}
              shadow={false}
              p={[s * w * (0.25 + i * 0.08), -len + 0.06, -0.01]}
              r={[0.55, s * 0.2, s * 0.25]}
            />,
          )
        }
      })
    }

    // Right arm encased in swirling void that forms the jagged Getsuga blade.
    {
      const fist = -pr.hand * 1.05
      add('rUpper', <P s={S.limb(0.048 * L, 0.055 * L, pr.upperArm)} m={M.dark} />)
      add('rFore', <P s={S.limb(0.045 * L, 0.052 * L, pr.forearm)} m={M.dark} />)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(
          'rFore',
          <P
            s={S.shard(0.025, 0.07, 0.014)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            shadow={false}
            p={[Math.cos(a) * 0.04, -pr.forearm * (0.2 + (i % 3) * 0.2), Math.sin(a) * 0.04]}
            r={[0.4, a, 0.3]}
          />,
        )
      }
      // Jagged black energy blade extending from the fist.
      const bladeLen = 0.72
      add('rHand', <P s={S.box(0.04, 0.09, bladeLen, 0.012)} m={M.dark} p={[0, fist, 0.08 + bladeLen / 2]} />)
      add('rHand', <P s={S.box(0.018, 0.055, bladeLen * 0.95, 0.006)} m={M.glow} line={false} shadow={false} p={[0.012, fist, 0.08 + bladeLen / 2]} />)
      add('rHand', <P s={S.cone(0.045, 0.12, 5)} m={M.dark} p={[0, fist, 0.08 + bladeLen + 0.04]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 7; i++) {
        const t = (i + 0.5) / 7
        const side = i % 2 ? 1 : -1
        add(
          'rHand',
          <P
            s={S.shard(0.03, 0.09, 0.014)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            shadow={false}
            p={[side * 0.045, fist + side * 0.02, 0.12 + t * bladeLen * 0.9]}
            r={[0.3, side * 0.5, side * (0.7 + t)]}
          />,
        )
      }
    }

    // Wrapped bare feet.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.032 * L, 0.03 * L, 0.06, 10)} m={M.trim} p={[0, -pr.shin + 0.02, 0]} />)
      add(foot, <P s={S.box(0.06 * Math.sqrt(L), 0.016, 0.1, 0.005)} m={M.trim} p={[0, -pr.ankle + 0.012, 0.025]} />)
      add(foot, <P s={S.box(0.014, 0.01, 0.07, 0.003)} m={M.dark} line={false} p={[0, -pr.ankle + 0.02, 0.03]} />)
    })
  }

  if (has('gaaraSuit')) {
    // Gaara — eye rings, forehead 愛, gray flak over burgundy coat, sand gourd, shin wraps, sandals.
    const r = pr.headR
    const front = cd * 0.55

    // Thick black rings around the eyes.
    sides((s) => {
      const ex = s * r * 0.36
      const ey = -r * 0.1
      const ez = r * 0.72
      add('head', <P s={S.torus(r * 0.18, r * 0.045, Math.PI * 2, 14)} m={M.ink} line={false} p={[ex, ey, ez]} r={[0.15, s * 0.35, 0]} />)
      add('head', <P s={S.torus(r * 0.12, r * 0.02, Math.PI * 2, 12)} m={M.dark} line={false} p={[ex, ey, ez + r * 0.02]} r={[0.15, s * 0.35, 0]} />)
    })

    // Forehead 愛 mark — simplified kanji strokes in accent red.
    {
      const mx = -r * 0.08
      const my = r * 0.42
      const mz = r * 0.78
      add('head', <P s={S.box(r * 0.42, r * 0.06, r * 0.04, r * 0.015)} m={M.accent} line={false} p={[mx, my + r * 0.14, mz]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.28, r * 0.04, r * 0.015)} m={M.accent} line={false} p={[mx - r * 0.08, my, mz]} />)
      add('head', <P s={S.box(r * 0.28, r * 0.06, r * 0.04, r * 0.015)} m={M.accent} line={false} p={[mx + r * 0.02, my - r * 0.02, mz]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.22, r * 0.04, r * 0.015)} m={M.accent} line={false} p={[mx + r * 0.12, my - r * 0.12, mz]} />)
      add('head', <P s={S.box(r * 0.2, r * 0.05, r * 0.035, r * 0.012)} m={M.accent} line={false} p={[mx + r * 0.02, my - r * 0.22, mz]} />)
    }

    // Gray flak vest with olive piping over the burgundy coat.
    add('chest', <P s={S.box(cw * 0.95, ch * 0.7, 0.03, 0.01)} m={M.metal} p={[0, ch * 0.48, front]} />)
    add('chest', <P s={S.box(cw * 0.88, ch * 0.08, 0.018, 0.006)} m={M.secondary} line={false} p={[0, ch * 0.72, front + 0.008]} />)
    add('chest', <P s={S.box(cw * 0.88, ch * 0.08, 0.018, 0.006)} m={M.secondary} line={false} p={[0, ch * 0.42, front + 0.008]} />)
    add('chest', <P s={S.box(cw * 0.88, ch * 0.06, 0.016, 0.005)} m={M.secondary} line={false} p={[0, ch * 0.22, front + 0.008]} />)
    // Horizontal strap ridges.
    for (let i = 0; i < 3; i++) {
      add('chest', <P s={S.box(cw * 0.9, 0.014, 0.012, 0.004)} m={M.trim} line={false} p={[0, ch * (0.62 - i * 0.16), front + 0.014]} />)
    }
    sides((s) => {
      add('chest', <P s={S.box(0.05, 0.07, 0.04, 0.012)} m={M.metal} p={[s * cw * 0.36, ch * 0.55, front]} />)
      add('chest', <P s={S.box(0.04, 0.055, 0.032, 0.01)} m={M.metal} p={[s * cw * 0.36, ch * 0.36, front]} />)
    })

    // Sand gourd on the back — tan body, black bands, cork stopper.
    {
      const gx = 0.02
      const gy = -0.18
      const gz = -cd * 0.95
      add('cape', <P s={S.sphere(0.14 * L, 14, 12)} m={M.glow} p={[gx, gy + 0.02, gz]} sc={[0.95, 1.35, 0.95]} />)
      add('cape', <P s={S.sphere(0.1 * L, 12, 10)} m={M.glow} p={[gx, gy + 0.22, gz]} sc={[0.9, 0.85, 0.9]} />)
      add('cape', <P s={S.cyl(0.045 * L, 0.04 * L, 0.08 * L, 10)} m={M.trim} p={[gx, gy + 0.36, gz]} />)
      add('cape', <P s={S.cyl(0.05 * L, 0.055 * L, 0.04 * L, 10)} m={M.secondary} p={[gx, gy + 0.42, gz]} />)
      // Black banding rings.
      for (const t of [-0.06, 0.06, 0.18] as const) {
        add('cape', <P s={S.torus(0.12 * L, 0.012 * L, Math.PI * 2, 16)} m={M.trim} p={[gx, gy + t, gz]} r={[Math.PI / 2, 0, 0]} />)
      }
      // Shoulder strap holding the gourd.
      add('chest', <P s={S.box(0.035, ch * 0.95, 0.018, 0.008)} m={M.trim} p={[cw * 0.22, ch * 0.45, -cd * 0.15]} r={[0.25, 0.2, 0.55]} />)
      add('chest', <P s={S.box(0.035, ch * 0.7, 0.018, 0.008)} m={M.trim} p={[-cw * 0.18, ch * 0.35, -cd * 0.2]} r={[0.35, -0.15, -0.45]} />)
      // Side seal mark on the gourd.
      add('cape', <P s={S.box(0.04 * L, 0.06 * L, 0.01, 0.004)} m={M.trim} line={false} p={[gx + 0.1 * L, gy + 0.04, gz]} />)
      add('cape', <P s={S.box(0.02 * L, 0.08 * L, 0.01, 0.004)} m={M.trim} line={false} p={[gx + 0.1 * L, gy - 0.01, gz]} />)
    }

    // Shin wraps + open-toe ninja sandals.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.034 * L, 0.034 * L, 0.09, 10)} m={M.light} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.036 * L, 0.036 * L, 0.02, 10)} m={M.trim} p={[0, -pr.shin * 0.55, 0]} />)
      add(foot, <P s={S.box(0.07 * Math.sqrt(L), 0.016, 0.11, 0.006)} m={M.trim} p={[0, -pr.ankle + 0.012, 0.03]} />)
      add(foot, <P s={S.box(0.018, 0.012, 0.08, 0.004)} m={M.light} p={[0, -pr.ankle + 0.028, 0.02]} />)
      add(shin, <P s={S.box(0.05 * L, 0.02, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.02, 0.03 * L]} />)
    })

    // Sand cloud underfoot — he floats on a grainy tan mound (live grains also swirl in HeroFighter).
    add('pelvis', <P s={S.sphere(0.15, 12, 10)} m={M.glow} line={false} p={[0, -0.3, 0.02]} sc={[1.75, 0.5, 1.25]} />)
    add('pelvis', <P s={S.sphere(0.1, 10, 8)} m={M.glow} line={false} p={[0.12, -0.28, -0.05]} sc={[1.15, 0.45, 0.95]} />)
    add('pelvis', <P s={S.sphere(0.09, 10, 8)} m={M.glow} line={false} p={[-0.12, -0.29, 0.05]} sc={[1.1, 0.42, 0.9]} />)
    add('pelvis', <P s={S.sphere(0.07, 8, 6)} m={M.metal} line={false} p={[0.02, -0.24, 0.08]} sc={[1.2, 0.35, 1.0]} />)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add(
        'pelvis',
        <P
          s={S.sphere(0.018 + (i % 3) * 0.006, 6, 5)}
          m={i % 2 ? M.glow : M.metal}
          line={false}
          shadow={false}
          p={[Math.cos(a) * 0.16, -0.22 - (i % 3) * 0.02, Math.sin(a) * 0.12]}
        />,
      )
    }
  }

  if (has('shukakuAwaken')) {
    // Shukaku — sand tanuki shell over Gaara; purple seal veins, huge claws, one spiked tail; human legs stay.
    const r = pr.headR
    const front = cd * 0.55

    // Tanuki sand head — large enough to clear the hunched torso shell.
    add('head', <P s={S.sphere(r * 1.55, 16, 12)} m={M.primary} p={[0, r * 0.55, 0.02]} sc={[1.15, 1.05, 1.25]} />)
    add('head', <P s={S.sphere(r * 0.72, 12, 10)} m={M.primary} p={[0, r * 0.2, r * 1.15]} sc={[1.2, 0.75, 1.45]} />)
    // Toothy grin.
    add('head', <P s={S.box(r * 1.25, r * 0.28, r * 0.4, r * 0.07)} m={M.trim} p={[0, r * 0.05, r * 1.2]} />)
    for (let i = 0; i < 6; i++) {
      add(
        'head',
        <P
          s={S.box(r * 0.1, r * 0.26, r * 0.07, r * 0.02)}
          m={M.light}
          line={false}
          p={[(i - 2.5) * r * 0.18, r * 0.0, r * 1.38]}
        />,
      )
    }
    // Pointed ears.
    sides((s) => {
      add('head', <P s={S.cone(r * 0.22, r * 0.45, 5)} m={M.primary} p={[s * r * 1.05, r * 1.45, -r * 0.05]} r={[-0.55, 0, s * 0.45]} />)
      add('head', <P s={S.cone(r * 0.1, r * 0.22, 4)} m={M.accent} line={false} p={[s * r * 1.05, r * 1.55, 0]} r={[-0.55, 0, s * 0.45]} />)
    })
    // Glowing eyes.
    sides((s) => {
      add('head', <P s={S.sphere(r * 0.2, 10, 8)} m={M.glow} line={false} shadow={false} p={[s * r * 0.48, r * 0.65, r * 1.15]} sc={[1, 0.85, 0.5]} />)
      add('head', <P s={S.sphere(r * 0.08, 8, 6)} m={M.ink} line={false} shadow={false} p={[s * r * 0.48, r * 0.65, r * 1.28]} />)
    })

    // Massive hunched sand torso shell — kept low so the tanuki head sits clear above it.
    add('chest', <P s={S.sphere(cw * 0.68, 14, 12)} m={M.primary} p={[0, ch * 0.28, -cd * 0.08]} sc={[1.2, 0.95, 1.3]} />)
    add('chest', <P s={S.box(cw * 1.12, ch * 0.78, cd * 1.12, 0.04)} m={M.primary} p={[0, ch * 0.3, 0.02]} />)
    // Purple seal veins across the sand body.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 1.6 - 0.4
      add(
        'chest',
        <P
          s={S.box(0.025, ch * 0.55, 0.02, 0.008)}
          m={M.accent}
          line={false}
          p={[Math.cos(a) * cw * 0.35, ch * 0.32, front * 0.55 + Math.sin(a) * cd * 0.15]}
          r={[0.2, a * 0.3, Math.sin(a) * 0.4]}
        />,
      )
    }
    sides((s) => {
      add('chest', <P s={S.box(0.04, ch * 0.55, 0.025, 0.01)} m={M.accent} line={false} p={[s * cw * 0.48, ch * 0.28, front * 0.2]} r={[0.15, 0, s * 0.25]} />)
    })

    // Oversized clawed sand arms.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(up, <P s={S.limb(0.07 * L, 0.065 * L, pr.upperArm)} m={M.primary} />)
      add(up, <P s={S.sphere(0.06 * L, 10, 8)} m={M.primary} p={[0, -pr.upperArm * 0.05, 0]} />)
      add(fore, <P s={S.limb(0.065 * L, 0.06 * L, pr.forearm)} m={M.primary} />)
      // Purple arm seals.
      add(up, <P s={S.box(0.02, pr.upperArm * 0.6, 0.015, 0.006)} m={M.accent} line={false} p={[s * 0.04 * L, -pr.upperArm * 0.45, 0.03 * L]} />)
      add(fore, <P s={S.box(0.018, pr.forearm * 0.55, 0.014, 0.005)} m={M.accent} line={false} p={[s * 0.035 * L, -pr.forearm * 0.4, 0.03 * L]} />)
      // Thick claw fingers.
      for (let i = 0; i < 4; i++) {
        add(
          hand,
          <P
            s={S.cone(0.018 * L, 0.07 * L, 4)}
            m={M.trim}
            line={false}
            p={[(i - 1.5) * 0.028 * L, -pr.hand * 0.6, 0.04 * L]}
            r={[Math.PI * 0.55, 0, (i - 1.5) * 0.15]}
          />,
        )
      }
    })

    // Single ridged spiked sand tail.
    {
      const segs = [
        { y: -0.05, z: -0.12, sc: 1.0, len: 0.16 },
        { y: 0.08, z: -0.28, sc: 0.85, len: 0.14 },
        { y: 0.22, z: -0.4, sc: 0.7, len: 0.12 },
        { y: 0.36, z: -0.48, sc: 0.55, len: 0.1 },
      ] as const
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i]!
        add(
          'tails',
          <P
            s={S.sphere(0.09 * L * seg.sc, 10, 8)}
            m={M.primary}
            p={[0, seg.y, seg.z]}
            sc={[1.1, 1.0, 1.3]}
          />,
        )
        add(
          'tails',
          <P
            s={S.box(0.02 * L, 0.04 * L, 0.015, 0.005)}
            m={M.accent}
            line={false}
            p={[0.05 * L * seg.sc, seg.y, seg.z]}
          />,
        )
        // Dorsal spikes.
        add(
          'tails',
          <P
            s={S.cone(0.025 * L * seg.sc, 0.06 * L * seg.sc, 4)}
            m={M.trim}
            line={false}
            p={[0, seg.y + 0.06 * L * seg.sc, seg.z]}
            r={[-0.8, 0, 0]}
          />,
        )
        void seg.len
      }
      // Forked tip.
      sides((s) => {
        add('tails', <P s={S.cone(0.03 * L, 0.1 * L, 4)} m={M.primary} p={[s * 0.04, 0.48, -0.52]} r={[-1.1, 0, s * 0.45]} />)
      })
    }

    // Human legs remain — shin wraps + open sandals under the sand shell.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.034 * L, 0.034 * L, 0.08, 10)} m={M.light} p={[0, -pr.shin * 0.72, 0]} />)
      add(foot, <P s={S.box(0.07 * Math.sqrt(L), 0.016, 0.11, 0.006)} m={M.trim} p={[0, -pr.ankle + 0.012, 0.03]} />)
      add(foot, <P s={S.box(0.018, 0.012, 0.08, 0.004)} m={M.light} p={[0, -pr.ankle + 0.028, 0.02]} />)
    })
  }

  if (has('kakashiSuit')) {
    // Kakashi — olive flak, navy mask, leaf headband, fingerless plates, open sandals.
    const r = pr.headR
    const front = cd * 0.52

    // High stiff flak collar.
    add('chest', <P s={S.cyl(0.06 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.075, 14, true)} m={M.secondary} p={[0, ch * 1.0, -0.008]} />)
    // Olive vest plate + zipper + vertical ridges.
    add('chest', <P s={S.box(cw * 0.98, ch * 0.78, 0.03, 0.012)} m={M.secondary} p={[0, ch * 0.48, front]} />)
    add('chest', <P s={S.box(0.014, ch * 0.7, 0.01, 0.004)} m={M.trim} line={false} p={[0, ch * 0.5, front + 0.018]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.box(0.01, ch * 0.58, 0.008, 0.003)}
          m={M.secondary}
          line={false}
          p={[(i - 1.5) * cw * 0.2, ch * 0.48, front + 0.02]}
        />,
      )
    }
    // Scroll pouches.
    sides((s) => {
      add('chest', <P s={S.box(0.055, 0.075, 0.04, 0.014)} m={M.secondary} p={[s * cw * 0.36, ch * 0.58, front + 0.01]} />)
      add('chest', <P s={S.box(0.048, 0.06, 0.035, 0.012)} m={M.secondary} p={[s * cw * 0.36, ch * 0.4, front + 0.01]} />)
      add('chest', <P s={S.box(0.012, 0.012, 0.01, 0.003)} m={M.metal} line={false} p={[s * cw * 0.36, ch * 0.62, front + 0.032]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.15, pr.abdomen * 0.55, pr.chestD * 1.02, 0.016)} m={M.secondary} p={[0, pr.abdomen * 0.4, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.028, pr.chestD * 1.08, 0.01)} m={M.secondary} p={[0, pr.abdomen * 0.08, 0]} />)

    // Red Uzumaki swirl on left shoulder + back plate.
    add('lUpper', <P s={S.cyl(0.028, 0.028, 0.008, 12)} m={M.accent} line={false} p={[0.01, -pr.upperArm * 0.18, 0.03 * L]} r={[Math.PI / 2, 0, 0]} />)
    add('lUpper', <P s={S.torus(0.016, 0.004, Math.PI * 1.7, 12)} m={M.accent} line={false} p={[0.01, -pr.upperArm * 0.18, 0.034 * L]} r={[0.2, 0, 0]} />)
    add('chest', <P s={S.cyl(0.032, 0.032, 0.008, 12)} m={M.accent} line={false} p={[0, ch * 0.55, -cd * 0.52]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.torus(0.018, 0.005, Math.PI * 1.7, 12)} m={M.accent} line={false} p={[0, ch * 0.55, -cd * 0.54]} r={[0.15, 0, 0]} />)

    // Full navy under-suit sleeves.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.sphere(0.038 * L, 12, 10)} m={M.primary} p={[0, -0.004, 0]} />)
      add(up, <P s={S.limb(0.034 * L, 0.028 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.028 * L, 0.024 * L, pr.forearm)} m={M.primary} />)
    })

    // Fingerless gloves + metal hand plates.
    sides((_s, l) => {
      const hand = `${l}Hand` as BoneName
      const fore = `${l}Fore` as BoneName
      const hh = pr.hand
      add(fore, <P s={S.cyl(0.03 * L, 0.032 * L, 0.05, 10)} m={M.trim} p={[0, -pr.forearm * 0.88, 0]} />)
      add(hand, <P s={S.box(0.045 * L, 0.018, 0.055 * L, 0.008)} m={M.trim} p={[0, -hh * 0.35, 0.01]} />)
      add(hand, <P s={S.box(0.038 * L, 0.01, 0.042 * L, 0.004)} m={M.metal} line={false} p={[0, -hh * 0.28, 0.028]} />)
    })

    // Thigh bandage + tool pouch; shin wraps.
    add('rThigh', <P s={S.cyl(0.044 * L, 0.044 * L, 0.09, 12)} m={M.light} p={[0, -pr.thigh * 0.45, 0]} />)
    add('rThigh', <P s={S.box(0.048, 0.055, 0.042, 0.014)} m={M.trim} p={[0.045 * L, -pr.thigh * 0.42, 0.01]} />)
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.034 * L, 0.034 * L, 0.075, 10)} m={M.light} p={[0, -pr.shin * 0.68, 0]} />)
    })

    // Open-toe ninja sandals.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.016, FL + 0.04, 0.006)} m={M.trim} p={[0, -A + 0.012, FL * 0.28]} />)
      add(foot, <P s={S.box(0.018, 0.012, FL * 0.7, 0.004)} m={M.trim} p={[0, -A + 0.028, FL * 0.18]} />)
      add(shin, <P s={S.box(0.048 * L, 0.018, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.018, 0.028 * L]} />)
    })

    // Leaf headband — tilted wrap + metal plate + leaf glyph.
    add('head', <P s={S.box(r * 1.7, r * 0.28, r * 0.18, r * 0.06)} m={M.trim} p={[0, r * 0.55, r * 0.15]} r={[-0.15, 0, 0]} />)
    add('head', <P s={S.box(r * 0.55, r * 0.42, r * 0.1, r * 0.04)} m={M.metal} p={[0, r * 0.58, r * 0.72]} r={[-0.1, 0, 0]} />)
    add('head', <P s={S.box(r * 0.08, r * 0.28, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.6, r * 0.78]} />)
    add('head', <P s={S.box(r * 0.22, r * 0.08, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.5, r * 0.78]} />)
    sides((s) => {
      add('head', <P s={S.panel(0.035, 0.16, 0.01)} m={M.trim} p={[s * r * 0.55, r * 0.35, -r * 0.55]} r={[0.4, s * 0.3, s * 0.15]} />)
    })

    // Navy face mask — covers nose / mouth / jaw, leaves eyes free.
    add('head', <P s={S.sphere(r * 0.78, 14, 12)} m={M.trim} p={[0, -r * 0.28, r * 0.42]} sc={[0.92, 0.72, 0.7]} />)
    add('head', <P s={S.box(r * 1.35, r * 0.55, r * 0.22, r * 0.08)} m={M.trim} p={[0, -r * 0.22, r * 0.7]} />)
    sides((s) => {
      add('head', <P s={S.panel(0.04, 0.12, 0.012)} m={M.trim} p={[s * r * 0.72, -r * 0.18, r * 0.15]} r={[0.15, s * 0.55, s * 0.1]} />)
    })
  }

  if (has('joninSuit')) {
    // Konoha jonin — olive flak over navy jumpsuit, leaf headband, wraps, open sandals.
    const r = pr.headR
    const front = cd * 0.52

    // High stiff flak collar.
    add('chest', <P s={S.cyl(0.06 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.075, 14, true)} m={M.secondary} p={[0, ch * 1.0, -0.008]} />)
    // Olive vest plate + zipper + vertical ridges.
    add('chest', <P s={S.box(cw * 0.98, ch * 0.78, 0.03, 0.012)} m={M.secondary} p={[0, ch * 0.48, front]} />)
    add('chest', <P s={S.box(0.014, ch * 0.7, 0.01, 0.004)} m={M.trim} line={false} p={[0, ch * 0.5, front + 0.018]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.box(0.01, ch * 0.58, 0.008, 0.003)}
          m={M.secondary}
          line={false}
          p={[(i - 1.5) * cw * 0.2, ch * 0.48, front + 0.02]}
        />,
      )
    }
    // Scroll pouches.
    sides((s) => {
      add('chest', <P s={S.box(0.055, 0.075, 0.04, 0.014)} m={M.secondary} p={[s * cw * 0.36, ch * 0.58, front + 0.01]} />)
      add('chest', <P s={S.box(0.048, 0.06, 0.035, 0.012)} m={M.secondary} p={[s * cw * 0.36, ch * 0.4, front + 0.01]} />)
      add('chest', <P s={S.box(0.012, 0.012, 0.01, 0.003)} m={M.metal} line={false} p={[s * cw * 0.36, ch * 0.62, front + 0.032]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.15, pr.abdomen * 0.55, pr.chestD * 1.02, 0.016)} m={M.secondary} p={[0, pr.abdomen * 0.4, 0]} />)
    // Elastic flak hem band.
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.028, pr.chestD * 1.08, 0.01)} m={M.secondary} p={[0, pr.abdomen * 0.08, 0]} />)

    // Red Uzumaki swirl on left shoulder + back plate.
    add('lUpper', <P s={S.cyl(0.028, 0.028, 0.008, 12)} m={M.accent} line={false} p={[0.01, -pr.upperArm * 0.18, 0.03 * L]} r={[Math.PI / 2, 0, 0]} />)
    add('lUpper', <P s={S.torus(0.016, 0.004, Math.PI * 1.7, 12)} m={M.accent} line={false} p={[0.01, -pr.upperArm * 0.18, 0.034 * L]} r={[0.2, 0, 0]} />)
    add('chest', <P s={S.cyl(0.032, 0.032, 0.008, 12)} m={M.accent} line={false} p={[0, ch * 0.55, -cd * 0.52]} r={[Math.PI / 2, 0, 0]} />)
    add('chest', <P s={S.torus(0.018, 0.005, Math.PI * 1.7, 12)} m={M.accent} line={false} p={[0, ch * 0.55, -cd * 0.54]} r={[0.15, 0, 0]} />)

    // Fishnet cuff bands at wrists + ankles.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const shin = `${l}Shin` as BoneName
      add(fore, <P s={S.cyl(0.03 * L, 0.032 * L, 0.045, 10)} m={M.trim} p={[0, -pr.forearm * 0.82, 0]} />)
      for (let i = 0; i < 3; i++) {
        add(
          fore,
          <P
            s={S.cyl(0.031 * L, 0.031 * L, 0.008, 8)}
            m={M.light}
            line={false}
            p={[0, -pr.forearm * (0.72 + i * 0.08), 0]}
          />,
        )
      }
      add(shin, <P s={S.cyl(0.03 * L, 0.032 * L, 0.05, 10)} m={M.trim} p={[0, -pr.shin * 0.88, 0]} />)
    })

    // Thigh bandage + tool pouch; shin wraps.
    add('rThigh', <P s={S.cyl(0.044 * L, 0.044 * L, 0.09, 12)} m={M.light} p={[0, -pr.thigh * 0.45, 0]} />)
    add('rThigh', <P s={S.box(0.048, 0.055, 0.042, 0.014)} m={M.trim} p={[0.045 * L, -pr.thigh * 0.42, 0.01]} />)
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.034 * L, 0.034 * L, 0.075, 10)} m={M.light} p={[0, -pr.shin * 0.68, 0]} />)
    })

    // Open-toe ninja sandals.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.016, FL + 0.04, 0.006)} m={M.trim} p={[0, -A + 0.012, FL * 0.28]} />)
      add(foot, <P s={S.box(0.018, 0.012, FL * 0.7, 0.004)} m={M.trim} p={[0, -A + 0.028, FL * 0.18]} />)
      add(shin, <P s={S.box(0.048 * L, 0.018, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.018, 0.028 * L]} />)
    })

    // Leaf headband — blue wrap + metal plate + leaf glyph.
    add('head', <P s={S.box(r * 1.7, r * 0.28, r * 0.18, r * 0.06)} m={M.trim} p={[0, r * 0.55, r * 0.15]} r={[-0.15, 0, 0]} />)
    add('head', <P s={S.box(r * 0.55, r * 0.42, r * 0.1, r * 0.04)} m={M.metal} p={[0, r * 0.58, r * 0.72]} r={[-0.1, 0, 0]} />)
    add('head', <P s={S.box(r * 0.08, r * 0.28, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.6, r * 0.78]} />)
    add('head', <P s={S.box(r * 0.22, r * 0.08, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.5, r * 0.78]} />)
    sides((s) => {
      add('head', <P s={S.panel(0.035, 0.16, 0.01)} m={M.trim} p={[s * r * 0.55, r * 0.35, -r * 0.55]} r={[0.4, s * 0.3, s * 0.15]} />)
    })
  }

  if (has('minatoSuit')) {
    // Minato — white flame-hem haori, olive flak, leaf headband, bandage wraps, open sandals.
    const r = pr.headR

    // High white collar (purple lining hint via trim edge).
    add('chest', <P s={S.cyl(0.06 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.08, 14, true)} m={M.primary} p={[0, ch * 1.0, -0.01]} />)
    add('chest', <P s={S.cyl(0.048 * Math.sqrt(L), 0.042 * Math.sqrt(L), 0.06, 12, true)} m={M.trim} line={false} p={[0, ch * 0.99, -0.008]} />)

    // Long white Hokage haori — hangs to mid-thigh with red flame hem.
    {
      const len = pr.hipH * 1.15 + ch * 0.85 + pr.thigh * 0.55
      const w = cw * 1.38
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.28)} m={M.primary} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.97, 0.012, -w * 0.27)} m={M.trim} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.06, 0, 0]} />)
      // Open front panels so the flak jacket still reads from the front.
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.28, len * 0.72, 0.016, -0.04)}
            m={M.primary}
            p={[s * w * 0.38, -len * 0.28, 0.02]}
            r={[0.12, s * 0.55, s * 0.06]}
          />,
        )
      })
      // Flame tips along the hem.
      for (let i = 0; i < 9; i++) {
        const x = (i - 4) * w * 0.1
        add(
          'cape',
          <P
            s={S.shard(0.035, 0.09 + (i % 2) * 0.03, 0.014)}
            m={M.accent}
            p={[x, -len + 0.05, -0.024]}
            r={[0.4, 0, (i - 4) * 0.06]}
          />,
        )
      }
      add('chest', <P s={S.torus(cw * 0.44, 0.022, Math.PI, 14)} m={M.primary} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      // Red chest cord clasp.
      add('chest', <P s={S.box(0.06, 0.01, 0.01, 0.003)} m={M.accent} line={false} p={[0, ch * 0.88, cd * 0.5]} />)
      sides((s) => add('chest', <P s={S.cyl(0.016, 0.016, 0.01, 8)} m={M.metal} p={[s * cw * 0.3, ch * 0.92, cd * 0.42]} r={[Math.PI / 2, 0, 0]} />))
    }

    // Under-cloak flak — olive vest ridges + scroll pouches (cloakless silhouette).
    add('chest', <P s={S.box(cw * 0.92, ch * 0.72, 0.028, 0.01)} m={M.secondary} p={[0, ch * 0.48, cd * 0.52]} />)
    add('chest', <P s={S.box(cw * 0.34, ch * 0.55, 0.02, 0.006)} m={M.trim} p={[0, ch * 0.5, cd * 0.55]} />)
    // Vertical flak ridges.
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.box(0.012, ch * 0.55, 0.01, 0.003)} m={M.secondary} line={false} p={[(i - 1.5) * cw * 0.18, ch * 0.48, cd * 0.56]} />)
    }
    sides((s) => {
      add('chest', <P s={S.box(0.05, 0.07, 0.035, 0.012)} m={M.secondary} p={[s * cw * 0.34, ch * 0.55, cd * 0.55]} />)
      add('chest', <P s={S.box(0.04, 0.055, 0.03, 0.01)} m={M.secondary} p={[s * cw * 0.34, ch * 0.38, cd * 0.55]} />)
      add('chest', <P s={S.box(0.012, 0.012, 0.01, 0.003)} m={M.metal} line={false} p={[s * cw * 0.34, ch * 0.58, cd * 0.58]} />)
    })
    // Full-sleeve dark blue under-suit, then short white haori sleeves + white wrist bands.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.sphere(0.038 * L, 12, 10)} m={M.trim} p={[0, -0.004, 0]} />)
      add(up, <P s={S.limb(0.034 * L, 0.028 * L, pr.upperArm)} m={M.trim} />)
      add(fore, <P s={S.limb(0.028 * L, 0.024 * L, pr.forearm)} m={M.trim} />)
      add(up, <P s={S.cyl(0.042 * L, 0.05 * L, pr.upperArm * 0.55, 12)} m={M.primary} p={[0, -pr.upperArm * 0.22, 0]} />)
      add(up, <P s={S.cyl(0.052 * L, 0.052 * L, 0.016, 12)} m={M.primary} p={[0, -pr.upperArm * 0.42, 0]} />)
      add(fore, <P s={S.cyl(0.03 * L, 0.032 * L, 0.05, 10)} m={M.light} p={[0, -pr.forearm * 0.88, 0]} />)
      void s
    })

    // Thigh bandage + tool pouch; shin wraps.
    add('rThigh', <P s={S.cyl(0.042 * L, 0.042 * L, 0.08, 12)} m={M.light} p={[0, -pr.thigh * 0.45, 0]} />)
    add('rThigh', <P s={S.box(0.045, 0.05, 0.04, 0.012)} m={M.trim} p={[0.04 * L, -pr.thigh * 0.42, 0.01]} />)
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.032 * L, 0.032 * L, 0.07, 10)} m={M.light} p={[0, -pr.shin * 0.72, 0]} />)
    })

    // Open-toe ninja sandals.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(foot, <P s={S.box(0.07 * Math.sqrt(L), 0.016, 0.11, 0.006)} m={M.trim} p={[0, -pr.ankle + 0.012, 0.03]} />)
      add(foot, <P s={S.box(0.018, 0.012, 0.08, 0.004)} m={M.light} p={[0, -pr.ankle + 0.028, 0.02]} />)
      add(shin, <P s={S.box(0.05 * L, 0.02, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.02, 0.03 * L]} />)
    })

    // Leaf headband — blue wrap + metal plate + simple leaf glyph.
    add('head', <P s={S.box(r * 1.7, r * 0.28, r * 0.18, r * 0.06)} m={M.trim} p={[0, r * 0.55, r * 0.15]} r={[-0.15, 0, 0]} />)
    add('head', <P s={S.box(r * 0.55, r * 0.42, r * 0.1, r * 0.04)} m={M.metal} p={[0, r * 0.58, r * 0.72]} r={[-0.1, 0, 0]} />)
    add('head', <P s={S.box(r * 0.08, r * 0.28, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.6, r * 0.78]} />)
    add('head', <P s={S.box(r * 0.22, r * 0.08, r * 0.04, r * 0.015)} m={M.trim} line={false} p={[0, r * 0.5, r * 0.78]} />)
    // Headband tails.
    sides((s) => {
      add('head', <P s={S.panel(0.035, 0.16, 0.01)} m={M.trim} p={[s * r * 0.55, r * 0.35, -r * 0.55]} r={[0.4, s * 0.3, s * 0.15]} />)
    })
  }

  if (has('yunoSuit')) {
    // Yuno — Golden Dawn white tunic, red button panel, navy cape with fur collar, floating wind grimoire.
    const r = pr.headR
    const spirit = has('spiritDive')
    // Spirit Dive paints the whole kit one green (awakened palette collapses to primary).
    const suit = spirit ? M.primary : M.accent
    const suitDark = spirit ? M.primary : M.secondary
    const suitTrim = spirit ? M.primary : M.trim
    const suitMetal = spirit ? M.primary : M.metal
    const suitLining = spirit ? M.primary : M.light

    // Red double-breasted center panel + gold buttons (solid green when awakened).
    add('chest', <P s={S.box(cw * 0.32, ch * 0.78, 0.028, 0.01)} m={suit} p={[0, ch * 0.42, cd * 0.52]} />)
    for (const row of [0.22, 0.38, 0.54, 0.7] as const) {
      sides((s) =>
        add('chest', <P s={S.cyl(0.01, 0.01, 0.008, 8)} m={suitMetal} line={false} p={[s * cw * 0.07, ch * row, cd * 0.58]} r={[Math.PI / 2, 0, 0]} />),
      )
    }

    // Blue gem pendant (green when Spirit Dive).
    add('chest', <P s={S.sphere(0.016, 8, 6)} m={M.glow} line={false} p={[0, ch * 0.92, cd * 0.5]} />)
    add('chest', <P s={S.box(0.006, 0.04, 0.004, 0.002)} m={suitMetal} line={false} p={[0, ch * 0.98, cd * 0.48]} />)

    // Diagonal brown strap (right shoulder → left hip).
    add('chest', <P s={S.box(0.028, ch * 0.95, 0.012, 0.006)} m={suitTrim} p={[cw * 0.08, ch * 0.45, cd * 0.42]} r={[0.15, 0, 0.55]} />)

    // Navy Golden Dawn cape + cream lining + fur collar (all green when awakened).
    {
      const len = pr.hipH * 0.85 + ch * 0.55
      const w = cw * 1.35
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.26)} m={suitDark} p={[0, -len / 2 + 0.03, -0.03]} r={[0.07, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.96, 0.012, -w * 0.24)} m={suitLining} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.07, 0, 0]} />)
      add('chest', <P s={S.torus(cw * 0.44, 0.038, Math.PI * 1.55, 18)} m={suitLining} p={[0, ch * 0.98, -0.01]} r={[Math.PI / 2 + 0.2, 0, Math.PI * 0.08]} />)
      add('chest', <P s={S.torus(cw * 0.4, 0.02, Math.PI, 14)} m={suitDark} p={[0, ch * 0.94, -0.015]} r={[Math.PI / 2 + 0.28, 0, Math.PI]} />)
      // Gold squad badge on right shoulder.
      add('chest', <P s={S.box(0.045, 0.045, 0.012, 0.006)} m={suitMetal} p={[cw * 0.32, ch * 0.88, -cd * 0.15]} r={[0.2, 0.3, 0.1]} />)
      add('chest', <P s={S.sphere(0.014, 8, 6)} m={suitMetal} line={false} p={[cw * 0.32, ch * 0.9, -cd * 0.12]} />)
    }

    // Brown belt + gold eagle buckle + grimoire pouch on left hip.
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.042, pr.chestD * 1.05, 0.012)} m={suitTrim} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.box(0.06, 0.05, 0.028, 0.01)} m={suitMetal} p={[0, pr.abdomen * 0.1, pr.chestD * 0.52]} />)
    add('spine', <P s={S.box(0.028, 0.012, 0.01, 0.003)} m={suitTrim} line={false} p={[0, pr.abdomen * 0.12, pr.chestD * 0.55]} />)
    add('spine', <P s={S.box(0.012, 0.028, 0.01, 0.003)} m={suitTrim} line={false} p={[0, pr.abdomen * 0.08, pr.chestD * 0.55]} />)
    add('spine', <P s={S.box(0.055, 0.08, 0.045, 0.014)} m={suitTrim} p={[-pr.waistW * 0.48, pr.abdomen * 0.02, pr.chestD * 0.18]} r={[0.25, 0.35, 0]} />)
    add('spine', <P s={S.box(0.04, 0.055, 0.02, 0.006)} m={suitDark} line={false} p={[-pr.waistW * 0.48, pr.abdomen * 0.04, pr.chestD * 0.22]} r={[0.25, 0.35, 0]} />)

    // Striped sleeve cuffs (blue / red / gold — solid green when awakened).
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, 0.055, 12)} m={suitDark} p={[0, -pr.forearm * 0.9, 0]} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.036 * L, 0.014, 12)} m={suit} p={[0, -pr.forearm * 0.78, 0]} />)
      add(fore, <P s={S.cyl(0.037 * L, 0.037 * L, 0.01, 12)} m={suitMetal} p={[0, -pr.forearm * 0.7, 0]} />)
    })

    // Knee-high black boots with gold rim (green when Spirit Dive).
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.72, 12)} m={suitTrim} p={[0, -pr.shin * 0.5, 0]} />)
      add(shin, <P s={S.box(0.055 * L, pr.shin * 0.5, 0.028, 0.01)} m={suitTrim} p={[0, -pr.shin * 0.48, 0.03 * L]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.048 * L, 0.016, 12)} m={suitMetal} p={[0, -pr.shin * 0.18, 0]} />)
      add(foot, <P s={S.box(0.075 * Math.sqrt(L), 0.026, 0.125, 0.01)} m={suitTrim} p={[0, -pr.ankle + 0.028, 0.035]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.012, 0.13, 0.004)} m={suitMetal} p={[0, -pr.ankle + 0.01, 0.035]} />)
    })

    // Cowlick antenna tuft.
    add('head', <P s={S.shard(0.018, 0.07, 0.014)} m={M.hair} line={false} p={[r * 0.08, r * 0.95, -r * 0.05]} r={[-0.55, 0.2, 0.15]} />)
    add('head', <P s={S.shard(0.012, 0.045, 0.01)} m={M.hair} line={false} p={[r * 0.02, r * 1.02, -r * 0.02]} r={[-0.75, 0.1, -0.1]} />)

    // Floating wind grimoire — Finral-style open book; live page leaves flip in idle.
    {
      const gx = spirit ? 0.24 : 0.22
      const gy = spirit ? pr.hipH * 0.7 : pr.hipH * 0.55
      const gz = spirit ? 0.1 : 0.08
      const cover = spirit ? M.glow : M.secondary
      add('pelvis', <P s={S.box(0.09, 0.12, 0.018, 0.006)} m={cover} p={[gx, gy, gz]} r={[0.15, -0.55, 0.1]} />)
      // Static open pages (flip leaf is a live overlay in HeroFighter).
      add('pelvis', <P s={S.box(0.082, 0.11, 0.008, 0.003)} m={M.light} line={false} p={[gx + 0.012, gy, gz + 0.012]} r={[0.15, -0.35, 0.1]} />)
      add('pelvis', <P s={S.box(0.082, 0.11, 0.008, 0.003)} m={M.light} line={false} p={[gx - 0.012, gy, gz - 0.004]} r={[0.15, -0.75, 0.1]} />)
      add('pelvis', <P s={S.box(0.078, 0.01, 0.02, 0.003)} m={suitMetal} line={false} p={[gx, gy + 0.05, gz]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.box(0.078, 0.01, 0.02, 0.003)} m={suitMetal} line={false} p={[gx, gy - 0.05, gz]} r={[0.15, -0.55, 0.1]} />)
      // Four-leaf clover crest.
      add('pelvis', <P s={S.box(0.022, 0.03, 0.008, 0.002)} m={suitTrim} line={false} p={[gx, gy + 0.01, gz + 0.012]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.sphere(0.012, 8, 6)} m={M.glow} line={false} p={[gx, gy + 0.035, gz + 0.014]} />)
      // Soft wind ring beside the book.
      add('pelvis', <P s={S.torus(0.07, 0.008, Math.PI * 2, 20)} m={M.glow} line={false} shadow={false} p={[gx + 0.02, gy + 0.02, gz + 0.05]} r={[0.4, -0.3, 0.2]} />)
    }
  }

  if (has('spiritDive')) {
    // Spirit Dive — glowing fairy wings, arrow crown, green spirit halberd.
    const r = pr.headR

    // Fairy wings on wing bones (green mana sails).
    sides((s, l) => {
      const bone = (l === 'l' ? 'wingL' : 'wingR') as BoneName
      add(bone, <P s={S.panel(0.28, 0.36, 0.012, 0.04)} m={M.glow} line={false} shadow={false} p={[s * 0.14, 0.06, -0.01]} r={[0.1, s * 0.12, s * -0.45]} />)
      add(bone, <P s={S.panel(0.2, 0.26, 0.01, 0.03)} m={M.accent} line={false} shadow={false} p={[s * 0.12, -0.14, 0]} r={[0.15, s * 0.08, s * 0.35]} />)
      add(bone, <P s={S.panel(0.14, 0.18, 0.008, 0.02)} m={M.glow} line={false} shadow={false} p={[s * 0.08, -0.28, 0.01]} r={[0.25, 0, s * 0.55]} />)
      // Arrow-like energy tips along the outer edge.
      for (let i = 0; i < 4; i++) {
        const t = i / 3
        add(
          bone,
          <P
            s={S.shard(0.022, 0.08 + t * 0.04, 0.01)}
            m={M.glow}
            line={false}
            shadow={false}
            p={[s * (0.22 + t * 0.06), 0.18 - t * 0.28, -0.02]}
            r={[0.3, s * 0.2, s * (-0.8 + t * 0.25)]}
          />,
        )
      }
    })
    add('chest', <P s={S.torus(cw * 0.38, 0.02, Math.PI, 14)} m={M.glow} line={false} p={[0, ch * 0.9, -0.02]} r={[Math.PI / 2 + 0.35, 0, Math.PI]} />)

    // Crown of vertical arrow spikes.
    for (let i = 0; i < 7; i++) {
      const a = ((i - 3) / 6) * 1.1
      add(
        'head',
        <P
          s={S.shard(0.014, 0.06 + Math.abs(i - 3) * 0.012, 0.012)}
          m={M.glow}
          line={false}
          shadow={false}
          p={[Math.sin(a) * r * 0.55, r * 0.95 + Math.abs(i - 3) * 0.01, Math.cos(a) * r * 0.35]}
          r={[-0.35, a, 0]}
        />,
      )
    }
    add('head', <P s={S.torus(r * 0.55, 0.01, Math.PI * 1.4, 14)} m={M.glow} line={false} shadow={false} p={[0, r * 0.82, 0]} r={[Math.PI / 2, 0, 0]} />)

    // Spirit of Zephyr — glowing green halberd in the left hand.
    {
      const fist = -0.02
      const shaft = 0.55
      add('lHand', <P s={S.cyl(0.012, 0.012, shaft, 8)} m={M.glow} line={false} shadow={false} p={[0, fist - shaft * 0.15, 0.04]} r={[0.2, 0, 0.1]} />)
      add('lHand', <P s={S.box(0.08, 0.12, 0.018, 0.006)} m={M.accent} line={false} shadow={false} p={[0, fist + 0.22, 0.06]} r={[0.15, 0, 0]} />)
      add('lHand', <P s={S.torus(0.055, 0.01, Math.PI * 2, 16)} m={M.glow} line={false} shadow={false} p={[0, fist + 0.22, 0.07]} r={[0.2, 0, 0]} />)
      add('lHand', <P s={S.box(0.02, 0.02, 0.02, 0.004)} m={M.metal} line={false} p={[0, fist + 0.22, 0.08]} />)
      add('lHand', <P s={S.cone(0.03, 0.08, 6)} m={M.glow} line={false} shadow={false} p={[0.05, fist + 0.28, 0.06]} r={[-0.8, 0, 0.6]} />)
      add('lHand', <P s={S.cone(0.03, 0.08, 6)} m={M.glow} line={false} shadow={false} p={[-0.05, fist + 0.16, 0.06]} r={[0.8, 0, -0.6]} />)
    }
  }

  if (has('finralSuit')) {
    // Finral — olive tunic, Black Bulls short cloak, red belt, green boots, floating grimoire.
    const r = pr.headR

    // High black cowl + gold clasp.
    add('chest', <P s={S.cyl(0.058 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.07, 14, true)} m={M.trim} p={[0, ch * 1.0, -0.01]} />)
    add('chest', <P s={S.cyl(0.02, 0.02, 0.012, 10)} m={M.accent} p={[0, ch * 0.94, cd * 0.48]} r={[Math.PI / 2, 0, 0]} />)

    // Short tattered Black Bulls cloak (gold hem).
    {
      const len = pr.hipH * 0.55 + ch * 0.35
      const w = cw * 1.28
      add('cape', <P s={S.panel(w, len, 0.02, -w * 0.22)} m={M.trim} p={[0, -len / 2 + 0.02, -0.025]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.92, len * 0.95, 0.01, -w * 0.2)} m={M.dark} line={false} p={[0, -len / 2 + 0.025, -0.012]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.box(w * 0.96, 0.012, 0.014, 0.004)} m={M.accent} line={false} p={[0, -len + 0.02, -0.02]} />)
      add('chest', <P s={S.torus(cw * 0.42, 0.02, Math.PI, 14)} m={M.trim} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      sides((s) => add('chest', <P s={S.box(0.014, 0.05, 0.01, 0.004)} m={M.accent} line={false} p={[s * cw * 0.28, ch * 0.9, -cd * 0.2]} />))
    }

    // Gold bull-head insignia on left breast.
    add('chest', <P s={S.box(cw * 0.22, ch * 0.22, 0.012, 0.004)} m={M.accent} line={false} p={[-cw * 0.28, ch * 0.62, cd * 0.54]} />)
    add('chest', <P s={S.sphere(0.028, 10, 8)} m={M.accent} line={false} p={[-cw * 0.28, ch * 0.66, cd * 0.56]} sc={[1.15, 0.85, 0.55]} />)
    sides((s) =>
      add('chest', <P s={S.cone(0.012, 0.03, 5)} m={M.accent} line={false} p={[-cw * 0.28 + s * 0.028, ch * 0.72, cd * 0.55]} r={[-0.6, 0, s * 0.4]} />),
    )

    // Olive tunic hem panels (ragged).
    sides((s) => {
      add('spine', <P s={S.panel(pr.waistW * 0.42, pr.hipH * 0.42, 0.012, 0.02)} m={M.primary} p={[s * pr.waistW * 0.28, -pr.hipH * 0.12, pr.chestD * 0.35]} r={[0.15, 0, s * 0.12]} />)
      add('spine', <P s={S.panel(pr.waistW * 0.28, pr.hipH * 0.28, 0.01, 0.015)} m={M.primary} p={[s * pr.waistW * 0.18, -pr.hipH * 0.22, -pr.chestD * 0.2]} r={[0.25, 0, s * -0.1]} />)
    })

    // Red belt + silver buckle + pouch.
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.045, pr.chestD * 1.05, 0.014)} m={M.accent} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.box(0.055, 0.05, 0.03, 0.01)} m={M.metal} p={[0, pr.abdomen * 0.08, pr.chestD * 0.52]} />)
    add('spine', <P s={S.box(0.05, 0.06, 0.04, 0.012)} m={M.secondary} p={[-pr.waistW * 0.45, pr.abdomen * 0.02, pr.chestD * 0.2]} r={[0.2, 0.3, 0]} />)

    // Wide olive sleeve cuffs.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, 0.05, 12)} m={M.primary} p={[0, -pr.forearm * 0.92, 0]} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.036 * L, 0.012, 12)} m={M.trim} p={[0, -pr.forearm * 0.82, 0]} />)
    })

    // Knee-high olive boots with blue lace studs.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.78, 12)} m={M.primary} p={[0, -pr.shin * 0.52, 0]} />)
      add(shin, <P s={S.box(0.055 * L, pr.shin * 0.55, 0.03, 0.01)} m={M.primary} p={[0, -pr.shin * 0.5, 0.032 * L]} />)
      for (let i = 0; i < 4; i++) {
        add(
          shin,
          <P
            s={S.shard(0.012, 0.018, 0.006)}
            m={M.glow}
            line={false}
            p={[0, -pr.shin * (0.3 + i * 0.12), 0.048 * L]}
          />,
        )
      }
      add(foot, <P s={S.box(0.075 * Math.sqrt(L), 0.026, 0.125, 0.01)} m={M.primary} p={[0, -pr.ankle + 0.028, 0.035]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.012, 0.13, 0.004)} m={M.metal} p={[0, -pr.ankle + 0.01, 0.035]} />)
    })

    // Blue stud earring (left).
    add('head', <P s={S.sphere(r * 0.07, 8, 6)} m={M.glow} line={false} p={[-r * 0.92, -r * 0.15, r * 0.15]} />)

    // Floating spatial grimoire — olive cover, gold border + clover, silver gate ring.
    {
      const gx = 0.22
      const gy = pr.hipH * 0.55
      const gz = 0.08
      add('pelvis', <P s={S.box(0.09, 0.12, 0.018, 0.006)} m={M.primary} p={[gx, gy, gz]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.box(0.082, 0.11, 0.008, 0.003)} m={M.light} line={false} p={[gx + 0.012, gy, gz + 0.012]} r={[0.15, -0.35, 0.1]} />)
      add('pelvis', <P s={S.box(0.082, 0.11, 0.008, 0.003)} m={M.light} line={false} p={[gx - 0.012, gy, gz - 0.004]} r={[0.15, -0.75, 0.1]} />)
      add('pelvis', <P s={S.box(0.078, 0.01, 0.02, 0.003)} m={M.accent} line={false} p={[gx, gy + 0.05, gz]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.box(0.078, 0.01, 0.02, 0.003)} m={M.accent} line={false} p={[gx, gy - 0.05, gz]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.box(0.022, 0.03, 0.008, 0.002)} m={M.trim} line={false} p={[gx, gy + 0.01, gz + 0.012]} r={[0.15, -0.55, 0.1]} />)
      add('pelvis', <P s={S.sphere(0.012, 8, 6)} m={M.accent} line={false} p={[gx, gy + 0.035, gz + 0.014]} />)
      // Soft silver portal ring beside the book.
      add('pelvis', <P s={S.torus(0.07, 0.008, Math.PI * 2, 20)} m={M.glow} line={false} shadow={false} p={[gx + 0.02, gy + 0.02, gz + 0.05]} r={[0.4, -0.3, 0.2]} />)
    }
  }

  if (has('lemillionSuit')) {
    // Lemillion — white hero suit, gold 1,000,000 crest, teal trim, red cape & gauntlets.
    // Gold chest piping frame.
    sides((s) => {
      add('chest', <P s={S.box(0.012, ch * 0.72, 0.01, 0.004)} m={M.accent} line={false} p={[s * cw * 0.42, ch * 0.48, cd * 0.52]} />)
    })
    add('chest', <P s={S.box(cw * 0.86, 0.012, 0.01, 0.004)} m={M.accent} line={false} p={[0, ch * 0.88, cd * 0.52]} />)
    add('chest', <P s={S.box(cw * 0.86, 0.012, 0.01, 0.004)} m={M.accent} line={false} p={[0, ch * 0.18, cd * 0.52]} />)

    // "1000000" crest — seven gold digit blocks across the chest.
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * cw * 0.1
      const isOne = i === 0
      add(
        'chest',
        <P
          s={S.box(isOne ? 0.018 : 0.032, 0.07, 0.012, 0.004)}
          m={M.accent}
          line={false}
          p={[x, ch * 0.58, cd * 0.56]}
        />,
      )
      if (!isOne) {
        add(
          'chest',
          <P s={S.box(0.018, 0.018, 0.008, 0.003)} m={M.metal} line={false} p={[x, ch * 0.58, cd * 0.565]} />,
        )
      }
    }

    // Teal-green shoulder stripes + neck collar.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.09 * Math.sqrt(L), 0.04, 0.1 * Math.sqrt(L), 0.016)} m={M.glow} p={[s * 0.015, 0.02, 0]} r={[0, 0, s * -0.35]} />)
      add(up, <P s={S.box(0.07 * Math.sqrt(L), 0.014, 0.08 * Math.sqrt(L), 0.004)} m={M.accent} line={false} p={[s * 0.02, 0.035, 0.01]} r={[0, 0, s * -0.35]} />)
    })
    add('neck', <P s={S.torus(0.048 * Math.sqrt(L), 0.014, Math.PI * 2, 14)} m={M.glow} p={[0, 0.01, 0]} r={[Math.PI / 2, 0, 0]} />)
    add('neck', <P s={S.torus(0.048 * Math.sqrt(L), 0.006, Math.PI * 2, 14)} m={M.accent} line={false} p={[0, 0.01, 0]} r={[Math.PI / 2, 0, 0]} />)

    // Green V waistband.
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.05, pr.chestD * 1.02, 0.014)} m={M.glow} p={[0, pr.abdomen * 0.18, 0]} />)
    sides((s) =>
      add(
        'spine',
        <P
          s={S.box(pr.waistW * 0.42, 0.04, 0.02, 0.008)}
          m={M.glow}
          p={[s * pr.waistW * 0.22, pr.abdomen * 0.28, pr.chestD * 0.48]}
          r={[0, 0, s * -0.55]}
        />,
      ),
    )
    add('spine', <P s={S.box(pr.waistW * 1.24, 0.01, pr.chestD * 1.04, 0.004)} m={M.accent} line={false} p={[0, pr.abdomen * 0.22, 0]} />)

    // White outer thigh stripe.
    sides((s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.box(0.018 * L, pr.thigh * 0.7, 0.012, 0.004)} m={M.primary} line={false} p={[s * 0.04 * L, -pr.thigh * 0.45, 0]} />)
    })

    // Red cape (billows from cape bone).
    {
      const len = pr.hipH * 0.95 + ch * 0.7
      const w = cw * 1.35
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.28)} m={M.trim} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.97, 0.012, -w * 0.27)} m={M.dark} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.06, 0, 0]} />)
      add('chest', <P s={S.torus(cw * 0.44, 0.022, Math.PI, 16)} m={M.trim} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      sides((s) => add('chest', <P s={S.cyl(0.018, 0.018, 0.012, 10)} m={M.accent} p={[s * cw * 0.3, ch * 0.92, cd * 0.45]} r={[Math.PI / 2, 0, 0]} />))
    }

    // Thick red gauntlets.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, pr.forearm * 0.78, 12)} m={M.trim} p={[0, -pr.forearm * 0.58, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.04 * L, 0.022, 12)} m={M.dark} p={[0, -pr.forearm * 0.28, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.15, pr.hand * 2.4, pr.hand * 1.8, pr.hand * 0.65)} m={M.trim} p={[0, -pr.hand * 1.05, 0.002]} />)
    })

    // White knee-high boots with gold soles + flared shin guards.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.042 * L, 0.048 * L, pr.shin * 0.72, 12)} m={M.primary} p={[0, -pr.shin * 0.55, 0]} />)
      add(shin, <P s={S.box(0.07 * L, pr.shin * 0.4, 0.04, 0.012)} m={M.primary} p={[0, -pr.shin * 0.5, 0.035 * L]} />)
      add(shin, <P s={S.box(0.05 * L, 0.03, 0.02, 0.008)} m={M.metal} p={[0, -pr.shin * 0.38, 0.05 * L]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.028, 0.13, 0.01)} m={M.primary} p={[0, -pr.ankle + 0.03, 0.04]} />)
      add(foot, <P s={S.box(0.084 * Math.sqrt(L), 0.014, 0.14, 0.004)} m={M.accent} p={[0, -pr.ankle + 0.012, 0.04]} />)
    })

    // Gold permeation visor — forehead shell, cheek frame, ear fins; grin stays visible.
    {
      const r = pr.headR
      add('head', <P s={S.dome(r * 1.12, Math.PI * 0.55)} m={M.accent} p={[0, r * 0.08, -r * 0.02]} />)
      add('head', <P s={S.box(r * 1.55, r * 0.38, r * 0.22, r * 0.1)} m={M.accent} p={[0, r * 0.02, r * 0.72]} />)
      add('head', <P s={S.box(r * 1.35, r * 0.22, r * 0.08, r * 0.04)} m={M.glowAlt} line={false} shadow={false} p={[0, r * 0.02, r * 0.88]} />)
      sides((s) => {
        add('head', <P s={S.box(r * 0.28, r * 0.42, r * 0.18, r * 0.06)} m={M.light} p={[s * r * 0.78, -r * 0.15, r * 0.35]} r={[0.1, s * 0.35, s * 0.15]} />)
        add('head', <P s={S.box(r * 0.14, r * 0.28, r * 0.22, r * 0.05)} m={M.accent} p={[s * r * 0.92, r * 0.35, -r * 0.05]} r={[0.1, s * 0.25, s * -0.45]} />)
        add('head', <P s={S.box(r * 0.08, r * 0.12, r * 0.1, r * 0.03)} m={M.metal} p={[s * r * 1.0, r * 0.48, -r * 0.08]} r={[0.15, s * 0.3, s * -0.5]} />)
      })
      add('head', <P s={S.box(r * 0.7, r * 0.08, r * 0.12, r * 0.03)} m={M.light} p={[0, -r * 0.35, r * 0.7]} />)
    }
  }

  if (has('todoKit')) {
    // Aoi Todo — cord necklace + rectangular pendant, abs cuts, black slip-ons.
    add('neck', <P s={S.torus(0.048, 0.004, Math.PI * 2, 14)} m={M.trim} line={false} p={[0, -0.015, 0.015]} r={[Math.PI / 2 - 0.55, 0, 0]} />)
    add('chest', <P s={S.box(0.028, 0.038, 0.01, 0.004)} m={M.metal} p={[0, ch * 0.72, cd * 0.55]} />)
    add('chest', <P s={S.box(0.018, 0.026, 0.006, 0.002)} m={M.trim} line={false} p={[0, ch * 0.72, cd * 0.56]} />)

    // Soft eight-pack read on the bare midriff.
    for (let row = 0; row < 4; row++) {
      sides((s) =>
        add(
          'spine',
          <P
            s={S.box(0.028, 0.022, 0.008, 0.004)}
            m={M.skinShade}
            line={false}
            p={[s * 0.032, pr.abdomen * (0.22 + row * 0.18), pr.chestD * 0.42]}
          />,
        ),
      )
    }

    // Black martial-arts slip-ons with light soles.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw * 0.9, 0.02, FL + 0.04, 0.008)} m={M.light} p={[0, -A + 0.01, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.86, 0.038, FL * 0.78, 0.014)} m={M.trim} p={[0, -A + 0.032, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.008, 0.012, 0.003)} m={M.light} line={false} p={[0, -A + 0.04, FL * 0.55]} />)
    })
  }

  if (has('gojoSuit')) {
    // Gojo — black blindfold, sky-high collar, slim jujutsu blacks, dress shoes.
    const r = pr.headR
    const ey = -r * 0.08
    // Face surface at eye height — prior band sat at ~0.72r and was buried in the head.
    const faceFront = 0.98 * r * Math.sqrt(Math.max(0, 1 - (ey / r) * (ey / r)))

    // Thick fabric blindfold wrapping the eyes (must sit outside the head sphere).
    add('head', <P s={S.box(r * 1.65, r * 0.42, r * 0.28, r * 0.12)} m={M.trim} p={[0, ey, faceFront - r * 0.02]} />)
    add('head', <P s={S.box(r * 1.48, r * 0.3, r * 0.12, r * 0.06)} m={M.dark} p={[0, ey, faceFront + r * 0.12]} />)
    sides((s) => {
      add('head', <P s={S.box(r * 0.22, r * 0.36, r * 0.85, r * 0.08)} m={M.trim} p={[s * r * 0.92, ey + r * 0.02, -r * 0.05]} r={[0, s * 0.12, 0]} />)
      add('head', <P s={S.panel(r * 0.16, r * 0.5, r * 0.04)} m={M.trim} p={[s * r * 0.55, ey - r * 0.12, -r * 0.78]} r={[0.35, s * 0.4, s * 0.1]} />)
    })
    add('head', <P s={S.box(r * 1.15, r * 0.24, r * 0.22, r * 0.06)} m={M.trim} p={[0, ey + r * 0.02, -r * 0.9]} />)

    // Stiff high collar over the gakuran neck.
    add('chest', <P s={S.cyl(0.072 * Math.sqrt(L), 0.06 * Math.sqrt(L), 0.11, 16, true)} m={M.primary} p={[0, ch * 1.05, -0.01]} />)
    add('chest', <P s={S.cyl(0.055 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.09, 14, true)} m={M.trim} line={false} p={[0, ch * 1.04, -0.008]} />)
    add('chest', <P s={S.cyl(0.05 * Math.sqrt(L), 0.046 * Math.sqrt(L), 0.04, 12, true)} m={M.accent} line={false} p={[0, ch * 1.08, -0.006]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.04, 0.1, 0.06, 0.012)} m={M.primary} p={[s * cw * 0.22, ch * 1.0, cd * 0.28]} r={[0.15, s * -0.35, s * 0.2]} />)
    })

    // Slim jacket hem + center buttons.
    add('spine', <P s={S.box(pr.waistW * 1.18, 0.05, pr.chestD * 1.02, 0.014)} m={M.primary} p={[0, pr.abdomen * 0.05, 0]} />)
    for (let i = 0; i < 5; i++) {
      add('chest', <P s={S.sphere(0.01, 8, 6)} m={M.metal} line={false} p={[0, ch * (0.88 - i * 0.16), cd * 0.56]} />)
    }

    // Full dark sleeves with subtle cuff ridge.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.036 * L, 0.03 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.03 * L, 0.026 * L, pr.forearm)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.032 * L, 0.034 * L, 0.04, 12)} m={M.trim} p={[0, -pr.forearm * 0.85, 0]} />)
    })

    // Polished black dress shoes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.022, FL + 0.04, 0.008)} m={M.dark} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.92, 0.04, FL * 0.82, 0.014)} m={M.trim} p={[0, -A + 0.034, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.55, 0.014, 0.028, 0.006)} m={M.trim} p={[0, -A + 0.04, FL * 0.02]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.006, 0.01, 0.002)} m={M.metal} line={false} p={[0, -A + 0.048, FL * 0.5]} />)
    })
  }

  if (has('akutagawaSuit')) {
    // Akutagawa — high collar, white jabot, ruffled cuffs, white-tipped side-locks, living coat ribbons.
    const r = pr.headR
    const ey = -r * 0.12

    // Dark hollows under the eyes.
    sides((s) => {
      add(
        'head',
        <P
          s={S.box(r * 0.28, r * 0.1, r * 0.04, r * 0.02)}
          m={M.dark}
          line={false}
          shadow={false}
          p={[s * r * 0.32, ey - r * 0.18, r * 0.9]}
          r={[0.25, s * -0.1, 0]}
        />,
      )
    })

    // White tips on the long side-locks (coverEye base is black; tip overlays).
    sides((s) => {
      add(
        'head',
        <P
          s={S.panel(r * 0.16, r * 0.55, r * 0.08, r * 0.04)}
          m={M.light}
          p={[s * r * 0.88, -r * 0.95, r * 0.18]}
          r={[0.15, s * 0.2, s * 0.08]}
        />,
      )
      add(
        'head',
        <P
          s={S.panel(r * 0.12, r * 0.35, r * 0.06, r * 0.03)}
          m={M.light}
          p={[s * r * 0.78, -r * 1.15, r * 0.05]}
          r={[0.35, s * 0.15, s * 0.12]}
        />,
      )
    })

    // Tall flared collar framing the face.
    add('chest', <P s={S.cyl(0.078 * Math.sqrt(L), 0.062 * Math.sqrt(L), 0.14, 16, true)} m={M.primary} p={[0, ch * 1.06, -0.012]} />)
    add('chest', <P s={S.cyl(0.058 * Math.sqrt(L), 0.05 * Math.sqrt(L), 0.11, 14, true)} m={M.trim} line={false} p={[0, ch * 1.05, -0.01]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.05, 0.14, 0.07, 0.014)} m={M.primary} p={[s * cw * 0.24, ch * 1.02, cd * 0.22]} r={[0.2, s * -0.4, s * 0.28]} />)
      add('chest', <P s={S.box(0.035, 0.11, 0.04, 0.01)} m={M.primary} p={[s * cw * 0.18, ch * 1.08, cd * 0.08]} r={[0.05, s * -0.2, s * 0.15]} />)
    })

    // White layered cravat / jabot under the collar.
    add('chest', <P s={S.box(0.07, 0.05, 0.03, 0.012)} m={M.secondary} p={[0, ch * 0.92, cd * 0.55]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.panel(0.055 - i * 0.006, 0.04, 0.012)}
          m={M.secondary}
          p={[0, ch * (0.86 - i * 0.045), cd * (0.56 + i * 0.008)]}
          r={[-0.15 - i * 0.05, 0, 0]}
        />,
      )
    }

    // Double-breasted buttons down the coat.
    for (let i = 0; i < 4; i++) {
      const yy = ch * (0.78 - i * 0.16)
      sides((s) =>
        add('chest', <P s={S.sphere(0.009, 8, 6)} m={M.metal} line={false} p={[s * 0.028, yy, cd * 0.56]} />),
      )
    }

    // Full black sleeves + white ruffled cuffs.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.038 * L, 0.032 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.032 * L, 0.028 * L, pr.forearm)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.038 * L, 0.05, 12)} m={M.primary} p={[0, -pr.forearm * 0.82, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.042 * L, 0.028, 14)} m={M.secondary} p={[0, -pr.forearm * 0.92, 0]} />)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        add(
          fore,
          <P
            s={S.panel(0.018 * L, 0.04 * L, 0.008)}
            m={M.secondary}
            p={[Math.cos(a) * 0.038 * L, -pr.forearm * 0.98, Math.sin(a) * 0.038 * L]}
            r={[0.6, a, 0]}
          />,
        )
      }
    })

    // Living coat ribbons — Rashomon tendrils hanging from the coat tails.
    sides((s) => {
      add(
        'tails',
        <P
          s={S.panel(0.04, 0.42, 0.012, 0.01)}
          m={M.primary}
          p={[s * pr.pelvisW * 0.55, -0.18, -0.02]}
          r={[0.55, s * 0.35, s * 0.65]}
        />,
      )
      add(
        'tails',
        <P
          s={S.panel(0.032, 0.34, 0.01, 0.008)}
          m={M.trim}
          p={[s * pr.pelvisW * 0.42, -0.28, 0.04]}
          r={[0.85, s * 0.2, s * 0.4]}
        />,
      )
      add(
        'tails',
        <P
          s={S.shard(0.035, 0.16, 0.02)}
          m={M.primary}
          p={[s * pr.pelvisW * 0.48, -0.42, -0.06]}
          r={[1.1, s * 0.25, s * 0.3]}
        />,
      )
    })
    add('cape', <P s={S.panel(0.05, 0.38, 0.012, 0.01)} m={M.primary} p={[0.02, -0.1, -0.04]} r={[0.45, 0.2, -0.55]} />)
    add('cape', <P s={S.panel(0.045, 0.32, 0.01, 0.008)} m={M.primary} p={[-0.03, -0.14, -0.03]} r={[0.55, -0.15, 0.5]} />)

    // Slim black dress shoes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.065 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.02, FL + 0.038, 0.008)} m={M.dark} p={[0, -A + 0.01, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.9, 0.036, FL * 0.8, 0.012)} m={M.trim} p={[0, -A + 0.03, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.5, 0.012, 0.024, 0.005)} m={M.trim} p={[0, -A + 0.036, FL * 0.02]} />)
    })
  }

  if (has('benimaruSuit')) {
    // Benimaru — cross/circle pupils, black tank under open navy kimono, baggy cuff.
    const r = pr.headR
    const ey = -r * 0.1
    const faceZ = (x: number, y: number) =>
      0.98 * r * Math.sqrt(Math.max(0, 1 - (x * x + y * y) / (r * r)))

    // Red irises already from palette; stamp the signature white pupils over sleepy eyes.
    // Left eye (s=+1) — white cross pupil.
    {
      const x = r * 0.34
      const z = faceZ(x, ey) + r * 0.06
      add('head', <P s={S.box(r * 0.045, r * 0.16, r * 0.03, r * 0.01)} m={M.light} line={false} shadow={false} p={[x, ey, z]} />)
      add('head', <P s={S.box(r * 0.16, r * 0.045, r * 0.03, r * 0.01)} m={M.light} line={false} shadow={false} p={[x, ey, z]} />)
    }
    // Right eye (s=-1) — white circle pupil.
    {
      const x = -r * 0.34
      const z = faceZ(x, ey) + r * 0.06
      add('head', <P s={S.cyl(r * 0.07, r * 0.07, r * 0.04, 12)} m={M.light} line={false} shadow={false} p={[x, ey, z]} r={[Math.PI / 2, 0, 0]} />)
    }

    // Black tank / undershirt peeking under the open kimono.
    add('chest', <P s={S.box(cw * 0.72, ch * 0.78, 0.03, 0.01)} m={M.secondary} p={[0, ch * 0.42, cd * 0.42]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.12, 0.02, 0.006)} m={M.trim} line={false} p={[0, ch * 0.78, cd * 0.46]} />)

    // Right shoulder slipped — bare upper arm under the kimono (sleeve hangs off).
    add('rUpper', <P s={S.limb(0.034 * L, 0.03 * L, pr.upperArm * 0.85)} m={M.skin} />)
    add(
      'rUpper',
      <P
        s={S.panel(0.1 * L, pr.upperArm * 0.7, 0.02, 0.02)}
        m={M.primary}
        p={[0.02, -pr.upperArm * 0.15, -0.02]}
        r={[0.35, 0.4, 0.55]}
      />,
    )

    // Dark sash knot at the waist.
    add('spine', <P s={S.box(pr.waistW * 1.18, pr.abdomen * 0.42, pr.chestD * 0.95, 0.012)} m={M.trim} p={[0, pr.abdomen * 0.28, 0]} />)
    add('spine', <P s={S.box(0.06, 0.05, 0.04, 0.012)} m={M.secondary} p={[0.02, pr.abdomen * 0.32, pr.chestD * 0.48]} r={[0, 0, 0.3]} />)

    // Baggy trouser cuffs tucked into boots.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.055 * L, 0.048 * L, pr.shin * 0.45, 12)} m={M.primary} p={[0, -pr.shin * 0.35, 0]} />)
      add(shin, <P s={S.cyl(0.06 * L, 0.058 * L, 0.04, 12)} m={M.primary} p={[0, -pr.shin * 0.55, 0]} />)
    })
  }

  if (has('nanamiSuit')) {
    // Nanami — blue dress shirt, spotted tie, suspenders, green rimless goggles, chronograph.
    const r = pr.headR

    // Rimless green circular goggles.
    sides((s) => {
      const x = s * r * 0.34
      const y = r * 0.12
      const z = r * 0.92
      add('head', <P s={S.cyl(r * 0.22, r * 0.22, r * 0.08, 16)} m={M.metal} p={[x, y, z]} r={[Math.PI / 2 - 0.25, 0, 0]} />)
      add('head', <P s={S.cyl(r * 0.17, r * 0.17, r * 0.04, 16)} m={M.glow} line={false} p={[x, y + r * 0.02, z + r * 0.06]} r={[Math.PI / 2 - 0.25, 0, 0]} />)
    })
    add('head', <P s={S.box(r * 0.28, r * 0.04, r * 0.04, r * 0.01)} m={M.metal} p={[0, r * 0.12, r * 0.95]} />)

    // Spotted necktie.
    add('chest', <P s={S.box(0.045, 0.04, 0.02, 0.01)} m={M.accent} p={[0, ch * 0.92, cd * 0.55]} />)
    add('chest', <P s={S.panel(0.038, ch * 0.72, 0.012)} m={M.accent} p={[0, ch * 0.48, cd * 0.56]} />)
    for (let i = 0; i < 7; i++) {
      const yy = ch * (0.78 - i * 0.09)
      const ox = ((i % 3) - 1) * 0.012
      add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.trim} line={false} p={[ox, yy, cd * 0.62]} />)
    }

    // Dark brown suspenders over the shirt.
    sides((s) => {
      add('chest', <P s={S.box(0.022, ch * 1.05, 0.012, 0.005)} m={M.trim} p={[s * cw * 0.14, ch * 0.48, cd * 0.52]} r={[0, 0, s * 0.28]} />)
      add('spine', <P s={S.box(0.022, pr.hipH * 0.35, 0.012, 0.005)} m={M.trim} p={[s * pr.waistW * 0.32, pr.abdomen * 0.15, pr.chestD * 0.35]} r={[0.15, 0, s * -0.1]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 0.35, 0.016, 0.012, 0.004)} m={M.trim} p={[0, pr.abdomen * 0.35, -pr.chestD * 0.35]} />)

    // Belt + silver buckle (on top of default waistband).
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.032, pr.chestD * 1.02, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.box(0.045, 0.038, 0.02, 0.008)} m={M.metal} p={[0, pr.abdomen * 0.08, pr.chestD * 0.52]} />)

    // Rolled mid-forearm cuffs.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.036 * L, 0.055, 12)} m={M.primary} p={[0, -pr.forearm * 0.55, 0]} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.036 * L, 0.014, 12)} m={M.light} p={[0, -pr.forearm * 0.42, 0]} />)
    })

    // Chronograph on the left wrist.
    add('lFore', <P s={S.cyl(0.028 * L, 0.028 * L, 0.018, 14)} m={M.metal} p={[0, -pr.forearm * 0.88, 0.02]} r={[Math.PI / 2, 0, 0]} />)
    add('lFore', <P s={S.cyl(0.02 * L, 0.02 * L, 0.008, 12)} m={M.trim} line={false} p={[0, -pr.forearm * 0.88, 0.032]} r={[Math.PI / 2, 0, 0]} />)
    add('lFore', <P s={S.box(0.012, 0.004, 0.004, 0.001)} m={M.light} line={false} p={[0, -pr.forearm * 0.88, 0.038]} />)

    // Brown dress shoes over default boots.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.07 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.028, FL + 0.02, 0.01)} m={M.trim} p={[0, -A + 0.024, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.95, 0.012, FL + 0.04, 0.004)} m={M.dark} p={[0, -A + 0.008, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.55, 0.016, 0.03, 0.006)} m={M.trim} p={[0, -A + 0.036, FL * 0.02]} />)
    })
  }

  if (has('deadshotSuit')) {
    // Deadshot — silver target helm, red eyepiece, black chest plate, gold wrist-guns.
    const r = pr.headR
    const metal = M.metal
    const gold = M.accent

    // Full silver helm shell + jaw grille.
    add('head', <P s={S.sphere(r * 1.14, 18, 14)} m={metal} p={[0, r * 0.02, 0]} sc={[0.98, 1.06, 1.02]} />)
    add('head', <P s={S.sphere(r * 0.72, 14, 12)} m={metal} p={[0, -r * 0.48, r * 0.08]} sc={[0.95, 0.78, 0.9]} />)
    add('head', <P s={S.box(r * 0.7, r * 0.22, r * 0.14, r * 0.04)} m={M.trim} p={[0, -r * 0.28, r * 0.9]} />)
    for (let i = -1; i <= 1; i++) {
      add('head', <P s={S.box(r * 0.08, r * 0.18, r * 0.04, r * 0.015)} m={M.dark} line={false} p={[i * r * 0.16, -r * 0.28, r * 1.0]} />)
    }
    // Targeting eyepiece — right eye only, glowing red reticle.
    add('head', <P s={S.cyl(r * 0.28, r * 0.28, r * 0.16, 16)} m={metal} p={[r * 0.34, r * 0.08, r * 0.78]} r={[Math.PI / 2 - 0.35, 0, 0]} />)
    add('head', <P s={S.cyl(r * 0.2, r * 0.2, r * 0.06, 16)} m={M.glow} line={false} p={[r * 0.34, r * 0.1, r * 0.92]} r={[Math.PI / 2 - 0.35, 0, 0]} />)
    add('head', <P s={S.torus(r * 0.14, r * 0.02, Math.PI * 2, 16)} m={M.glowAlt} line={false} p={[r * 0.34, r * 0.1, r * 0.96]} r={[Math.PI / 2 - 0.35, 0, 0]} />)
    add('head', <P s={S.box(r * 0.18, r * 0.025, r * 0.02, r * 0.008)} m={M.trim} line={false} p={[r * 0.34, r * 0.1, r * 0.98]} />)
    add('head', <P s={S.box(r * 0.025, r * 0.18, r * 0.02, r * 0.008)} m={M.trim} line={false} p={[r * 0.34, r * 0.1, r * 0.98]} />)
    // Blank left eye slit.
    add('head', <P s={S.box(r * 0.28, r * 0.1, r * 0.06, r * 0.02)} m={M.dark} p={[-r * 0.32, r * 0.08, r * 0.88]} />)
    add('neck', <P s={S.cyl(0.045 * Math.sqrt(L), 0.05 * Math.sqrt(L), pr.neck * 0.9, 12)} m={metal} p={[0, pr.neck * 0.3, 0]} />)

    // Black chest plate + crisscross straps over red suit.
    add('chest', <P s={S.box(cw * 0.92, ch * 0.62, 0.05, 0.014)} m={M.trim} p={[0, ch * 0.52, cd * 0.52]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.28, 0.02, 0.006)} m={metal} p={[0, ch * 0.68, cd * 0.56]} />)
    add('chest', <P s={S.box(0.02, ch * 1.0, 0.014, 0.004)} m={M.trim} p={[cw * 0.02, ch * 0.48, cd * 0.58]} r={[0, 0, -0.55]} />)
    add('chest', <P s={S.box(0.02, ch * 1.0, 0.014, 0.004)} m={M.trim} p={[-cw * 0.02, ch * 0.48, cd * 0.58]} r={[0, 0, 0.55]} />)
    add('chest', <P s={S.cyl(0.014, 0.014, 0.012, 8)} m={gold} p={[0, ch * 0.55, cd * 0.6]} r={[Math.PI / 2, 0, 0]} />)

    // Gold wrist-mounted twin barrels on both forearms.
    sides((s, l) => {
      const fore = `${l}Fore` as BoneName
      const y = -pr.forearm * 0.55
      add(fore, <P s={S.box(0.07 * L, 0.055, 0.09 * L, 0.016)} m={gold} p={[0, y, 0.04 * L]} />)
      add(fore, <P s={S.box(0.055 * L, 0.02, 0.04 * L, 0.006)} m={metal} p={[0, y + 0.02, 0.055 * L]} />)
      for (const ox of [-0.018, 0.018] as const) {
        add(fore, <P s={S.cyl(0.012 * L, 0.01 * L, 0.1, 10)} m={gold} p={[ox * L, y, 0.1 * L]} r={[Math.PI / 2, 0, 0]} />)
        add(fore, <P s={S.cyl(0.008 * L, 0.008 * L, 0.02, 8)} m={M.dark} line={false} p={[ox * L, y, 0.15 * L]} r={[Math.PI / 2, 0, 0]} />)
      }
      add(fore, <P s={S.torus(0.042 * L, 0.008, Math.PI * 2, 14)} m={M.trim} p={[0, -pr.forearm * 0.82, 0]} r={[Math.PI / 2, 0, 0]} />)
      void s
    })

    // Utility belt + red crosshair buckle.
    add('spine', <P s={S.box(pr.waistW * 1.3, 0.05, pr.chestD * 1.08, 0.014)} m={M.secondary} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.cyl(0.032, 0.032, 0.02, 16)} m={M.primary} p={[0, pr.abdomen * 0.1, pr.chestD * 0.55]} r={[Math.PI / 2, 0, 0]} />)
    add('spine', <P s={S.torus(0.022, 0.004, Math.PI * 2, 14)} m={M.glow} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.58]} />)
    add('spine', <P s={S.box(0.028, 0.006, 0.006, 0.002)} m={M.trim} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.6]} />)
    add('spine', <P s={S.box(0.006, 0.028, 0.006, 0.002)} m={M.trim} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.6]} />)
    for (const s of [-1, 1] as const) {
      for (let i = 0; i < 3; i++) {
        add(
          'spine',
          <P
            s={S.box(0.028, 0.042, 0.024, 0.008)}
            m={M.secondary}
            p={[s * (pr.waistW * 0.42 + i * 0.01), pr.abdomen * 0.02 - i * 0.01, pr.chestD * (0.35 - i * 0.05)]}
            r={[0.1, s * 0.2, 0]}
          />,
        )
      }
    }

    // Silver thigh plates over baggy blacks.
    sides((_s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.box(0.08 * L, pr.thigh * 0.35, 0.06 * L, 0.014)} m={metal} p={[0, -pr.thigh * 0.35, 0.02]} />)
    })
  }

  if (has('dazaiSuit')) {
    // Dazai — neck/forearm bandages, dark vest, bolo tie, sand coat belts, dress shoes.
    const r = pr.headR

    // Neck bandages stacked under the jaw.
    add('chest', <P s={S.cyl(0.048 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.09, 14)} m={M.light} p={[0, ch * 1.02, 0]} />)
    add('chest', <P s={S.cyl(0.05 * Math.sqrt(L), 0.054 * Math.sqrt(L), 0.035, 14)} m={M.light} p={[0, ch * 1.08, 0.005]} />)
    for (let i = 0; i < 3; i++) {
      add(
        'chest',
        <P
          s={S.box(0.07, 0.012, 0.04, 0.004)}
          m={M.light}
          p={[0, ch * (0.98 - i * 0.035), cd * 0.42]}
          r={[0.15, 0, i * 0.2]}
        />,
      )
    }

    // Dark vest over the open trench.
    add('chest', <P s={S.box(cw * 0.62, ch * 0.72, 0.028, 0.01)} m={M.trim} p={[0, ch * 0.42, cd * 0.38]} />)
    sides((s) =>
      add('chest', <P s={S.box(0.01, ch * 0.65, 0.008, 0.003)} m={M.dark} line={false} p={[s * cw * 0.18, ch * 0.44, cd * 0.52]} />),
    )
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.sphere(0.007, 6, 5)} m={M.metal} line={false} p={[0.012, ch * (0.7 - i * 0.12), cd * 0.55]} />)
    }

    // Striped shirt collar peek + turquoise bolo.
    add('chest', <P s={S.box(0.055, 0.04, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.9, cd * 0.52]} />)
    add('chest', <P s={S.cyl(0.006, 0.006, 0.07, 6)} m={M.trim} p={[0, ch * 0.82, cd * 0.58]} r={[0.35, 0, 0]} />)
    add('chest', <P s={S.sphere(0.014, 8, 6)} m={M.accent} line={false} p={[0, ch * 0.76, cd * 0.6]} />)
    add('chest', <P s={S.box(0.012, 0.01, 0.006, 0.002)} m={M.metal} line={false} p={[0, ch * 0.76, cd * 0.615]} />)

    // Forearm bandages (coat sleeves end short; wraps show).
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      for (let i = 0; i < 5; i++) {
        add(
          fore,
          <P
            s={S.cyl(0.028 * L + i * 0.001, 0.03 * L, 0.028, 12)}
            m={M.light}
            p={[0, -pr.forearm * (0.35 + i * 0.12), 0]}
          />,
        )
      }
      add(fore, <P s={S.cyl(0.032 * L, 0.034 * L, 0.022, 12)} m={M.light} p={[0, -pr.forearm * 0.92, 0]} />)
    })

    // Hanging trench belt straps.
    sides((s) => {
      add(
        'tails',
        <P
          s={S.panel(0.028, 0.28, 0.01, 0.006)}
          m={M.primary}
          p={[s * pr.pelvisW * 0.48, -0.08, 0.02]}
          r={[0.35, s * 0.15, s * 0.55]}
        />,
      )
      add(
        'tails',
        <P
          s={S.box(0.022, 0.018, 0.012, 0.004)}
          m={M.metal}
          p={[s * pr.pelvisW * 0.48, 0.04, 0.03]}
        />,
      )
    })

    // Messy fringe strands over the brow.
    add('head', <P s={S.panel(r * 0.22, r * 0.35, r * 0.08, r * 0.04)} m={M.hair} p={[r * 0.15, r * 0.15, r * 0.75]} r={[0.55, 0.1, 0.15]} />)
    add('head', <P s={S.panel(r * 0.18, r * 0.3, r * 0.07, r * 0.03)} m={M.hair} p={[-r * 0.2, r * 0.1, r * 0.72]} r={[0.5, -0.15, -0.2]} />)

    // Slim dark dress shoes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.065 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.02, FL + 0.038, 0.008)} m={M.dark} p={[0, -A + 0.01, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.9, 0.034, FL * 0.78, 0.012)} m={M.trim} p={[0, -A + 0.028, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.5, 0.01, 0.022, 0.004)} m={M.trim} p={[0, -A + 0.034, FL * 0.02]} />)
    })
  }

  if (has('bakugoSuit')) {
    // Dynamight — orange X, grenade gauntlets, blast headpiece, red gloves, orange-sole boots.
    const r = pr.headR
    const front = cd * 0.52

    // Jagged black eye mask.
    sides((s) => {
      add('head', <P s={S.box(r * 0.42, r * 0.18, r * 0.08, r * 0.03)} m={M.trim} p={[s * r * 0.28, r * 0.08, r * 0.72]} r={[0.1, s * 0.25, s * 0.15]} />)
      add('head', <P s={S.shard(r * 0.1, r * 0.14, r * 0.04)} m={M.trim} p={[s * r * 0.55, r * 0.12, r * 0.55]} r={[0.2, s * 0.4, s * -0.35]} />)
    })
    add('head', <P s={S.box(r * 0.18, r * 0.08, r * 0.06, r * 0.02)} m={M.trim} p={[0, r * 0.1, r * 0.78]} />)

    // Orange/black blast headpiece behind the spikes.
    add('head', <P s={S.sphere(r * 0.55, 10, 8)} m={M.accent} p={[0, r * 0.35, -r * 0.55]} sc={[1.35, 0.85, 0.55]} />)
    for (let i = 0; i < 7; i++) {
      const a = ((i - 3) / 3) * 0.55
      add(
        'head',
        <P
          s={S.shard(r * 0.12, r * (0.28 + (i % 3) * 0.08), r * 0.06)}
          m={i % 2 ? M.accent : M.trim}
          p={[Math.sin(a) * r * 0.55, r * (0.55 + Math.cos(a) * 0.15), -r * (0.7 + Math.abs(Math.sin(a)) * 0.15)]}
          r={[-0.4, a, 0.2]}
        />,
      )
    }

    // Metallic collar with vent circles.
    add('neck', <P s={S.cyl(0.048 * Math.sqrt(L), 0.052 * Math.sqrt(L), 0.04, 14)} m={M.metal} p={[0, 0.01, 0.01]} />)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      add(
        'neck',
        <P
          s={S.cyl(0.006, 0.006, 0.008, 8)}
          m={M.trim}
          line={false}
          p={[Math.cos(a) * 0.045, 0.01, 0.01 + Math.sin(a) * 0.045]}
          r={[Math.PI / 2, 0, 0]}
        />,
      )
    }

    // Orange X across the black tank.
    add('chest', <P s={S.box(0.028, ch * 0.85, 0.014, 0.006)} m={M.accent} p={[0, ch * 0.48, front]} r={[0, 0, 0.55]} />)
    add('chest', <P s={S.box(0.028, ch * 0.85, 0.014, 0.006)} m={M.accent} p={[0, ch * 0.48, front]} r={[0, 0, -0.55]} />)

    // Grey rectangular shoulder pads with vent holes.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.08 * L, 0.055 * L, 0.09 * L, 0.014)} m={M.metal} p={[s * 0.02, 0.04, 0.01]} r={[0.1, 0, s * -0.35]} />)
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          add(
            up,
            <P
              s={S.cyl(0.006, 0.006, 0.01, 6)}
              m={M.trim}
              line={false}
              p={[s * 0.02 + (i - 1) * 0.018, 0.05 + j * 0.016, 0.05 * L]}
              r={[Math.PI / 2, 0, 0]}
            />,
          )
        }
      }
    })

    // Oversized green grenade gauntlets + red gloves.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      const scale = Math.sqrt(L)
      // Pineapple grenade body.
      add(fore, <P s={S.cyl(0.055 * scale, 0.06 * scale, pr.forearm * 0.95, 12)} m={M.secondary} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.062 * scale, 0.062 * scale, 0.028, 12)} m={M.metal} p={[0, -pr.forearm * 0.08, 0]} />)
      add(fore, <P s={S.cyl(0.058 * scale, 0.058 * scale, 0.022, 12)} m={M.metal} p={[0, -pr.forearm * 0.88, 0]} />)
      // Segment ridges.
      for (let i = 0; i < 4; i++) {
        add(
          fore,
          <P
            s={S.box(0.012, pr.forearm * 0.7, 0.01, 0.003)}
            m={M.trim}
            line={false}
            p={[Math.cos((i / 4) * Math.PI * 2) * 0.055 * scale, -pr.forearm * 0.48, Math.sin((i / 4) * Math.PI * 2) * 0.055 * scale]}
          />,
        )
      }
      // Pin / handle on top of the gauntlet.
      add(fore, <P s={S.box(0.018, 0.055, 0.03, 0.008)} m={M.metal} p={[0, -pr.forearm * 0.02, 0.055 * scale]} r={[0.4, 0, 0]} />)
      add(fore, <P s={S.torus(0.018, 0.005, Math.PI * 1.6, 10)} m={M.metal} p={[0, 0.02, 0.05 * scale]} r={[0.3, 0, 0]} />)
      // Red gloves.
      add(hand, <P s={S.box(pr.hand * 2.2, pr.hand * 2.4, pr.hand * 1.8, pr.hand * 0.6)} m={M.accent} p={[0, -pr.hand * 1.05, 0.002]} />)
      add(hand, <P s={S.box(pr.hand * 1.6, pr.hand * 0.9, pr.hand * 0.5, pr.hand * 0.2)} m={M.trim} p={[0, -pr.hand * 1.2, pr.hand * 0.55]} />)
    })

    // Green utility belt + grenade pouches.
    add('spine', <P s={S.box(pr.waistW * 1.3, 0.042, pr.chestD * 1.08, 0.012)} m={M.secondary} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.box(0.045, 0.038, 0.022, 0.008)} m={M.metal} p={[0, pr.abdomen * 0.12, pr.chestD * 0.56]} />)
    sides((s) => {
      add('spine', <P s={S.cyl(0.022, 0.025, 0.045, 10)} m={M.secondary} p={[s * pr.waistW * 0.52, pr.abdomen * 0.08, pr.chestD * 0.28]} />)
      add('spine', <P s={S.cyl(0.018, 0.02, 0.035, 10)} m={M.secondary} p={[s * pr.waistW * 0.55, pr.abdomen * 0.05, -pr.chestD * 0.15]} />)
      add('spine', <P s={S.cyl(0.012, 0.012, 0.012, 8)} m={M.metal} p={[s * pr.waistW * 0.52, pr.abdomen * 0.12, pr.chestD * 0.28]} />)
    })

    // Green thigh straps.
    sides((_s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.cyl(0.052 * L, 0.052 * L, 0.028, 12)} m={M.secondary} p={[0, -pr.thigh * 0.35, 0]} />)
      add(thigh, <P s={S.box(0.04, 0.06, 0.02, 0.008)} m={M.secondary} p={[0, -pr.thigh * 0.4, 0.045 * L]} />)
    })

    // Angular silver knee pads.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.box(0.07 * L, 0.07, 0.05, 0.016)} m={M.metal} p={[0, -0.01, 0.035 * L]} r={[-0.15, 0, 0]} />)
      add(shin, <P s={S.box(0.04 * L, 0.035, 0.02, 0.008)} m={M.accent} p={[0, 0.02, 0.05 * L]} />)
    })

    // Black combat boots with orange soles + orange accents.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.075 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.042 * L, 0.048 * L, pr.shin * 0.42, 12)} m={M.primary} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.05 * L, 0.05 * L, 0.016, 12)} m={M.accent} p={[0, -pr.shin * 0.55, 0]} />)
      add(foot, <P s={S.box(fw, 0.022, FL + 0.05, 0.01)} m={M.accent} p={[0, -A + 0.011, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.03, 0.016)} m={M.primary} p={[0, -A + 0.042, FL * 0.26]} />)
      add(foot, <P s={S.cyl(0.012, 0.012, 0.01, 8)} m={M.accent} p={[0, -A + 0.055, FL * 0.15]} r={[Math.PI / 2, 0, 0]} />)
    })
  }

  if (has('chuuyaSuit')) {
    // Chuuya — black fedora, choker + bolo, grey vest over white collar, coat draped as cape with rose lining.
    const r = pr.headR

    // Black fedora — brim + crown + thin band.
    add('head', <P s={S.cyl(r * 1.15, r * 1.15, r * 0.06, 18)} m={M.secondary} p={[0, r * 0.95, 0]} />)
    add('head', <P s={S.cyl(r * 0.72, r * 0.78, r * 0.55, 16, true)} m={M.secondary} p={[0, r * 1.22, 0]} />)
    add('head', <P s={S.cyl(r * 0.74, r * 0.74, r * 0.08, 16)} m={M.trim} p={[0, r * 1.0, 0]} />)
    add('head', <P s={S.cyl(r * 0.76, r * 0.76, r * 0.03, 16)} m={M.metal} line={false} p={[0, r * 1.02, 0]} />)

    // Long orange lock over the left shoulder.
    add(
      'head',
      <P
        s={S.panel(r * 0.18, r * 1.35, r * 0.1, r * 0.05)}
        m={M.hair}
        p={[r * 0.72, -r * 0.55, r * 0.15]}
        r={[0.45, 0.25, 0.35]}
      />,
    )
    add(
      'head',
      <P
        s={S.panel(r * 0.14, r * 0.9, r * 0.08, r * 0.04)}
        m={M.hairShade}
        p={[r * 0.55, -r * 0.95, r * 0.05]}
        r={[0.7, 0.15, 0.45]}
      />,
    )

    // Black choker + thin criss-cross bolo with silver clasp.
    add('neck', <P s={S.cyl(0.042 * Math.sqrt(L), 0.042 * Math.sqrt(L), 0.028, 14)} m={M.trim} p={[0, 0.01, 0.01]} />)
    add('chest', <P s={S.box(0.018, 0.12, 0.01, 0.004)} m={M.trim} p={[-0.012, ch * 0.88, cd * 0.52]} r={[0.15, 0, 0.35]} />)
    add('chest', <P s={S.box(0.018, 0.12, 0.01, 0.004)} m={M.trim} p={[0.012, ch * 0.88, cd * 0.52]} r={[0.15, 0, -0.35]} />)
    add('chest', <P s={S.sphere(0.016, 10, 8)} m={M.metal} line={false} p={[0, ch * 0.82, cd * 0.56]} />)

    // White shirt collar under the vest.
    add('chest', <P s={S.box(0.09, 0.04, 0.04, 0.012)} m={M.light} p={[0, ch * 0.98, cd * 0.42]} />)
    sides((s) =>
      add('chest', <P s={S.box(0.04, 0.035, 0.03, 0.01)} m={M.light} p={[s * 0.045, ch * 0.96, cd * 0.48]} r={[0.1, s * -0.55, s * 0.15]} />),
    )

    // Grey vest panels over the brown jacket core.
    add('chest', <P s={S.box(cw * 0.92, ch * 0.72, 0.04, 0.014)} m={M.metal} p={[0, ch * 0.42, cd * 0.48]} />)
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.sphere(0.008, 8, 6)} m={M.trim} line={false} p={[0, ch * (0.72 - i * 0.14), cd * 0.58]} />)
    }

    // Short brown jacket shoulders / open fronts (sleeves stay free — coat is draped).
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.07 * L, 0.05 * L, 0.08 * L, 0.016)} m={M.primary} p={[s * 0.02, 0.02, 0]} r={[0, 0, s * -0.2]} />)
      add('chest', <P s={S.box(0.055, ch * 0.55, 0.04, 0.012)} m={M.primary} p={[s * cw * 0.38, ch * 0.4, cd * 0.35]} r={[0.05, s * 0.35, s * 0.12]} />)
    })

    // Coat draped over the shoulders like a cape — black shell, dusty-rose lining.
    {
      const len = pr.hipH * 1.05 + ch * 0.85
      const w = cw * 1.45
      add('cape', <P s={S.panel(w, len, 0.024, -w * 0.22)} m={M.secondary} p={[0, -len / 2 + 0.06, -0.04]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.92, len * 0.96, 0.014, -w * 0.2)} m={M.accent} line={false} p={[0, -len / 2 + 0.07, -0.02]} r={[0.08, 0, 0]} />)
      // Shoulder drape straps / collar ring.
      add('chest', <P s={S.torus(cw * 0.48, 0.028, Math.PI * 1.15, 16)} m={M.secondary} p={[0, ch * 0.98, -0.02]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.38, len * 0.75, 0.016, -0.04)}
            m={M.secondary}
            p={[s * w * 0.38, -len * 0.22, 0.02]}
            r={[0.18, s * 0.55, s * 0.12]}
          />,
        )
        add(
          'cape',
          <P
            s={S.panel(w * 0.32, len * 0.7, 0.01, -0.03)}
            m={M.accent}
            line={false}
            p={[s * w * 0.36, -len * 0.2, 0.035]}
            r={[0.18, s * 0.55, s * 0.12]}
          />,
        )
      })
    }

    // Slim black dress shoes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.065 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.02, FL + 0.038, 0.008)} m={M.dark} p={[0, -A + 0.01, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.9, 0.036, FL * 0.8, 0.012)} m={M.trim} p={[0, -A + 0.03, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.5, 0.012, 0.024, 0.005)} m={M.trim} p={[0, -A + 0.036, FL * 0.02]} />)
    })
  }

  if (has('gilgameshSuit')) {
    // Gilgamesh — ornate gold plate, blue sunburst breastplate, red waist-cape, pointed sabatons.
    const gold = M.metal
    const plate = M.primary
    const ink = M.secondary
    const r = pr.headR

    // Rectangular golden earrings.
    sides((s) => {
      add('head', <P s={S.box(r * 0.12, r * 0.28, r * 0.08, 0.02)} m={gold} p={[s * r * 0.92, r * 0.15, 0]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.18, r * 0.05, 0.012)} m={ink} line={false} p={[s * r * 0.96, r * 0.15, 0.01]} />)
    })

    // Rounded breastplate + blue sunburst.
    add('chest', <P s={S.box(cw * 1.08, ch * 0.78, 0.05, 0.018)} m={plate} p={[0, ch * 0.5, cd * 0.52]} />)
    add('chest', <P s={S.sphere(cw * 0.28, 12, 10)} m={gold} p={[0, ch * 0.55, cd * 0.58]} sc={[1.15, 0.95, 0.55]} />)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      add(
        'chest',
        <P
          s={S.shard(0.03, 0.1, 0.012)}
          m={ink}
          line={false}
          p={[Math.cos(a) * cw * 0.22, ch * 0.55 + Math.sin(a) * ch * 0.18, cd * 0.62]}
          r={[0.2, 0, a]}
        />,
      )
    }
    add('chest', <P s={S.cyl(0.035, 0.035, 0.02, 10)} m={ink} line={false} p={[0, ch * 0.55, cd * 0.64]} r={[Math.PI / 2, 0, 0]} />)

    // Massive rounded pauldrons.
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.sphere(0.09 * Math.sqrt(L), 12, 10)} m={gold} p={[s * 0.04, 0.02, 0]} sc={[1.35, 0.95, 1.25]} />)
      add(up, <P s={S.box(0.1 * Math.sqrt(L), 0.04, 0.1 * Math.sqrt(L), 0.014)} m={ink} line={false} p={[s * 0.05, -0.02, 0.01]} r={[0, 0, s * -0.25]} />)
      add(up, <P s={S.box(0.08 * L, pr.upperArm * 0.55, 0.07 * L, 0.016)} m={plate} p={[s * 0.01, -pr.upperArm * 0.4, 0]} />)
    })

    // Segmented golden gauntlets.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, pr.forearm * 0.72, 10)} m={gold} p={[0, -pr.forearm * 0.55, 0]} />)
      add(fore, <P s={S.box(0.055 * L, 0.03, 0.04, 0.01)} m={ink} line={false} p={[0, -pr.forearm * 0.35, 0.04 * L]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.04 * L, 0.02, 10)} m={plate} p={[0, -pr.forearm * 0.28, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.1, pr.hand * 2.3, pr.hand * 1.7, pr.hand * 0.6)} m={gold} p={[0, -pr.hand * 1.05, 0.002]} />)
    })

    // Hip tassets + navy underlayer belt.
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.55, pr.chestD * 1.0, 0.016)} m={ink} p={[0, pr.abdomen * 0.35, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.035, pr.chestD * 1.02, 0.01)} m={gold} p={[0, pr.abdomen * 0.2, 0]} />)
    sides((s) => {
      add('pelvis', <P s={S.box(0.08, 0.12, 0.05, 0.014)} m={gold} p={[s * pr.pelvisW * 0.42, -0.02, 0.02]} r={[0.15, 0, s * 0.2]} />)
      add('pelvis', <P s={S.box(0.05, 0.06, 0.02, 0.008)} m={ink} line={false} p={[s * pr.pelvisW * 0.42, -0.02, 0.05]} />)
    })

    // Crimson waist-cape / loincloth flowing behind the legs.
    {
      const len = pr.hipH * 0.85 + pr.thigh * 0.85
      const w = cw * 0.85
      add('cape', <P s={S.panel(w, len, 0.02, -w * 0.2)} m={M.accent} p={[0, -len / 2 + 0.04, -0.02]} r={[0.12, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.7, len * 0.92, 0.012, -w * 0.15)} m={M.trim} line={false} p={[0, -len / 2 + 0.05, -0.008]} r={[0.12, 0, 0]} />)
      sides((s) =>
        add(
          'cape',
          <P
            s={S.panel(w * 0.35, len * 0.7, 0.014, -0.03)}
            m={M.accent}
            p={[s * w * 0.32, -len * 0.28, 0.02]}
            r={[0.15, s * 0.45, s * 0.08]}
          />,
        ),
      )
      // Thin leather strap with gold tip.
      add('pelvis', <P s={S.box(0.018, pr.hipH * 0.9 + pr.thigh * 0.4, 0.01, 0.004)} m={M.trim} p={[0.06, -0.2, 0.04]} r={[0.1, 0, 0.05]} />)
      add('pelvis', <P s={S.box(0.028, 0.04, 0.016, 0.008)} m={gold} p={[0.07, -pr.hipH * 0.85 - pr.thigh * 0.35, 0.05]} />)
    }

    // Angular greaves + pointed sabatons.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const thigh = `${l}Thigh` as BoneName
      const foot = `${l}Foot` as BoneName
      add(thigh, <P s={S.box(0.08 * L, pr.thigh * 0.45, 0.07 * L, 0.016)} m={plate} p={[0, -pr.thigh * 0.4, 0.01]} />)
      add(shin, <P s={S.box(0.085 * L, pr.shin * 0.72, 0.075 * L, 0.016)} m={gold} p={[0, -pr.shin * 0.5, 0.01]} />)
      add(shin, <P s={S.box(0.06 * L, 0.04, 0.03, 0.01)} m={ink} line={false} p={[0, -pr.shin * 0.35, 0.045 * L]} />)
      add(foot, <P s={S.box(0.09 * L, 0.032, 0.15, 0.012)} m={gold} p={[0, -pr.ankle + 0.018, 0.045]} />)
      add(foot, <P s={S.cone(0.035 * L, 0.08, 5)} m={gold} p={[0, -pr.ankle + 0.02, 0.14]} r={[Math.PI / 2, 0, 0]} />)
    })
  }

  if (has('tengenSuit')) {
    // Tengen Uzui — jeweled headband, left-eye flower makeup, gold armbands, white collar patch.
    const r = pr.headR
    const gem = M.accent
    const gold = M.metal
    const wrap = M.light

    // Jeweled grey headband + pink gems + blue bead strings.
    add('head', <P s={S.box(r * 1.85, r * 0.22, r * 0.55, r * 0.08)} m={wrap} p={[0, r * 0.72, r * 0.15]} r={[-0.15, 0, 0]} />)
    add('head', <P s={S.box(r * 1.7, r * 0.12, r * 0.4, r * 0.04)} m={M.secondary} line={false} p={[0, r * 0.72, r * 0.18]} r={[-0.15, 0, 0]} />)
    for (let i = -2; i <= 2; i++) {
      add(
        'head',
        <P
          s={S.sphere(r * (0.1 + (i === 0 ? 0.04 : 0)), 10, 8)}
          m={gem}
          p={[i * r * 0.28, r * 0.78 + Math.abs(i) * -0.01, r * 0.42]}
        />,
      )
      add(
        'head',
        <P
          s={S.sphere(r * 0.045, 8, 6)}
          m={gold}
          line={false}
          p={[i * r * 0.28, r * 0.78, r * 0.48]}
        />,
      )
    }
    sides((s) => {
      for (let i = 0; i < 5; i++) {
        add(
          'head',
          <P
            s={S.sphere(r * 0.04, 8, 6)}
            m={M.glow}
            line={false}
            p={[s * r * (0.95 + i * 0.02), r * (0.55 - i * 0.14), r * (0.15 + i * 0.02)]}
          />,
        )
      }
    })

    // Red flower / explosive makeup around the left eye.
    {
      const ex = -r * 0.34
      const ey = r * 0.1
      const ez = r * 0.92
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(
          'head',
          <P
            s={S.sphere(r * 0.055, 8, 6)}
            m={M.accent}
            line={false}
            p={[ex + Math.cos(a) * r * 0.16, ey + Math.sin(a) * r * 0.14, ez]}
          />,
        )
      }
      add('head', <P s={S.sphere(r * 0.07, 8, 6)} m={M.accent} line={false} p={[ex, ey, ez + r * 0.02]} />)
      add('head', <P s={S.sphere(r * 0.035, 6, 4)} m={M.trim} line={false} p={[ex, ey, ez + r * 0.04]} />)
    }

    // White collar + gold buttons + Hashira chest patch.
    add('chest', <P s={S.box(cw * 0.55, 0.045, 0.04, 0.012)} m={M.light} p={[0, ch * 0.98, cd * 0.48]} />)
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.cyl(0.012, 0.012, 0.01, 10)} m={gold} p={[0, ch * (0.82 - i * 0.14), cd * 0.55]} r={[Math.PI / 2, 0, 0]} />)
    }
    add('chest', <P s={S.box(0.055, 0.032, 0.012, 0.004)} m={M.light} p={[-cw * 0.22, ch * 0.72, cd * 0.56]} />)

    // Thick gold bicep bands + blue/gold wrist guards.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.cyl(0.055 * L, 0.055 * L, 0.07, 14)} m={gold} p={[0, -pr.upperArm * 0.35, 0]} />)
      add(up, <P s={S.cyl(0.058 * L, 0.058 * L, 0.018, 14)} m={M.trim} line={false} p={[0, -pr.upperArm * 0.3, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.042 * L, 0.12, 12)} m={M.secondary} p={[0, -pr.forearm * 0.72, 0]} />)
      add(fore, <P s={S.cyl(0.044 * L, 0.044 * L, 0.02, 12)} m={gold} p={[0, -pr.forearm * 0.58, 0]} />)
      add(fore, <P s={S.cyl(0.044 * L, 0.044 * L, 0.02, 12)} m={gold} p={[0, -pr.forearm * 0.88, 0]} />)
    })

    // White belt + silver buckle over hakama.
    add('spine', <P s={S.box(pr.waistW * 1.25, 0.045, pr.chestD * 1.05, 0.012)} m={M.light} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.box(0.05, 0.04, 0.022, 0.008)} m={M.metal} p={[0, pr.abdomen * 0.12, pr.chestD * 0.52]} />)

    // Burgundy kyahan + zori straps.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.036 * L, 0.038 * L, pr.shin * 0.5, 12)} m={M.accent} p={[0, -pr.shin * 0.58, 0]} />)
      for (let i = 0; i < 3; i++) {
        add(shin, <P s={S.cyl(0.04 * L, 0.04 * L, 0.012, 10)} m={M.trim} line={false} p={[0, -pr.shin * (0.4 + i * 0.1), 0]} />)
      }
      add(foot, <P s={S.box(0.014, 0.012, 0.09, 0.004)} m={M.light} p={[0, -pr.ankle + 0.024, 0.03]} />)
    })
  }

  if (has('overhaulSuit')) {
    // Kai Chisaki — plague beak, purple fur collar, black shirt + grey tie, white sneakers.
    const r = pr.headR

    // Lower-face plague doctor mask — black cup, crimson beak, gold tip + rivets.
    add('head', <P s={S.sphere(r * 0.72, 14, 12)} m={M.dark} p={[0, -r * 0.42, r * 0.55]} sc={[1.05, 0.85, 0.95]} />)
    add('head', <P s={S.box(r * 1.15, r * 0.22, r * 0.35, r * 0.08)} m={M.dark} p={[0, -r * 0.18, r * 0.7]} />)
    add('head', <P s={S.cone(r * 0.22, r * 0.85, 10)} m={M.glow} p={[0, -r * 0.55, r * 1.15]} r={[1.15, 0, 0]} />)
    add('head', <P s={S.cone(r * 0.08, r * 0.18, 8)} m={M.metal} p={[0, -r * 0.78, r * 1.55]} r={[1.15, 0, 0]} />)
    sides((s) => {
      add('head', <P s={S.sphere(r * 0.055, 8, 6)} m={M.metal} line={false} p={[s * r * 0.28, -r * 0.35, r * 0.95]} />)
      add('head', <P s={S.sphere(r * 0.045, 8, 6)} m={M.metal} line={false} p={[s * r * 0.18, -r * 0.5, r * 1.15]} />)
      add('head', <P s={S.cyl(r * 0.05, r * 0.05, r * 0.08, 10)} m={M.metal} p={[s * r * 0.42, -r * 0.28, r * 0.72]} r={[0, 0, Math.PI / 2]} />)
    })
    // Strap over the ears.
    sides((s) =>
      add('head', <P s={S.box(r * 0.12, r * 0.1, r * 0.55, r * 0.04)} m={M.trim} p={[s * r * 0.78, -r * 0.15, r * 0.1]} r={[0.1, s * 0.2, 0]} />),
    )

    // Thick purple faux-fur collar on the olive bomber.
    add('chest', <P s={S.torus(cw * 0.48, 0.055, Math.PI * 1.7, 18)} m={M.accent} p={[0, ch * 1.0, -0.01]} r={[Math.PI / 2 + 0.2, 0, Math.PI * 0.05]} />)
    add('chest', <P s={S.torus(cw * 0.42, 0.04, Math.PI * 1.5, 16)} m={M.accent} p={[0, ch * 0.96, 0.01]} r={[Math.PI / 2 + 0.35, 0, Math.PI * 0.05]} />)
    sides((s) => {
      add('chest', <P s={S.sphere(0.055, 10, 8)} m={M.accent} p={[s * cw * 0.38, ch * 0.95, cd * 0.15]} sc={[1.2, 0.85, 1.1]} />)
      add('chest', <P s={S.sphere(0.04, 8, 6)} m={M.accent} p={[s * cw * 0.28, ch * 1.05, -cd * 0.1]} sc={[1.1, 0.7, 1]} />)
    })

    // Black dress shirt placket + light grey necktie under the open bomber.
    add('chest', <P s={S.box(cw * 0.28, ch * 0.85, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.45, cd * 0.55]} />)
    add('chest', <P s={S.box(0.045, 0.035, 0.02, 0.01)} m={M.light} p={[0, ch * 0.9, cd * 0.58]} />)
    add('chest', <P s={S.panel(0.036, ch * 0.65, 0.012)} m={M.light} p={[0, ch * 0.48, cd * 0.59]} />)
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.metal} line={false} p={[0, ch * (0.78 - i * 0.14), cd * 0.57]} />)
    }

    // Brown belt + silver buckle.
    add('spine', <P s={S.box(pr.waistW * 1.2, 0.034, pr.chestD * 1.02, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.box(0.042, 0.038, 0.018, 0.006)} m={M.metal} p={[0, pr.abdomen * 0.08, pr.chestD * 0.52]} />)

    // White surgical glove cuffs (hands use M.light via Outfit).
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.028 * L, 0.03 * L, 0.045, 12)} m={M.light} p={[0, -pr.forearm * 0.88, 0]} />)
      add(fore, <P s={S.cyl(0.031 * L, 0.031 * L, 0.012, 12)} m={M.white} line={false} p={[0, -pr.forearm * 0.78, 0]} />)
    })

    // Clean white sneakers — override default accent-colored uppers.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.07 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.light} p={[0, -A + 0.012, FL * 0.32]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.018)} m={M.white} p={[0, -A + 0.04, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.01, 0.014, 0.003)} m={M.light} line={false} p={[0, -A + 0.055, FL * 0.52]} />)
      add(foot, <P s={S.box(fw * 0.5, 0.012, 0.03, 0.005)} m={M.light} p={[0, -A + 0.048, FL * 0.02]} />)
    })
  }

  if (has('komamuraSuit')) {
    // Sajin Komamura — wolf head, captain haori, red-gold shoulder/forearm/ankle armor.
    const r = pr.headR
    const fur = M.hair
    const furLite = M.light
    const plate = M.accent
    const gold = M.metal

    // Wolf cranium + muzzle (covers the human face bake).
    add('head', <P s={S.sphere(r * 1.15, 16, 14)} m={fur} p={[0, r * 0.05, -r * 0.08]} sc={[1.05, 1.0, 1.12]} />)
    add('head', <P s={S.sphere(r * 0.72, 12, 10)} m={furLite} p={[0, -r * 0.15, r * 0.55]} sc={[0.85, 0.7, 1.15]} />)
    add('head', <P s={S.cone(r * 0.42, r * 0.85, 10)} m={fur} p={[0, -r * 0.22, r * 0.95]} r={[1.05, 0, 0]} />)
    add('head', <P s={S.box(r * 0.55, r * 0.18, r * 0.35, r * 0.06)} m={furLite} p={[0, -r * 0.35, r * 1.15]} />)
    // Nose + jaw.
    add('head', <P s={S.sphere(r * 0.14, 8, 6)} m={M.dark} p={[0, -r * 0.18, r * 1.55]} />)
    add('head', <P s={S.box(r * 0.42, r * 0.1, r * 0.28, r * 0.04)} m={M.dark} p={[0, -r * 0.48, r * 1.05]} />)
    // Eyes.
    sides((s) => {
      add('head', <P s={S.sphere(r * 0.12, 8, 6)} m={M.dark} line={false} p={[s * r * 0.38, r * 0.12, r * 0.72]} />)
      add('head', <P s={S.sphere(r * 0.055, 6, 4)} m={M.glow} line={false} p={[s * r * 0.4, r * 0.14, r * 0.82]} />)
    })
    // Pointed ears.
    sides((s) => {
      add('head', <P s={S.cone(r * 0.18, r * 0.55, 6)} m={fur} p={[s * r * 0.72, r * 0.85, -r * 0.1]} r={[-0.35, 0, s * 0.35]} />)
      add('head', <P s={S.cone(r * 0.1, r * 0.35, 5)} m={furLite} line={false} p={[s * r * 0.72, r * 0.78, -r * 0.02]} r={[-0.35, 0, s * 0.35]} />)
    })
    // White mane / beard ruff around the neck.
    add('chest', <P s={S.torus(cw * 0.48, 0.05, Math.PI * 1.8, 16)} m={furLite} p={[0, ch * 0.98, 0]} r={[Math.PI / 2 + 0.15, 0, 0]} />)
    sides((s) =>
      add('chest', <P s={S.sphere(0.055, 10, 8)} m={furLite} p={[s * cw * 0.32, ch * 0.92, cd * 0.2]} sc={[1.2, 0.9, 1.1]} />),
    )

    // White sash.
    add('spine', <P s={S.box(pr.waistW * 1.2, pr.abdomen * 0.5, pr.chestD * 0.98, 0.012)} m={M.light} p={[0, pr.abdomen * 0.3, 0]} />)

    // White captain haori with open sides.
    {
      const len = pr.hipH * 1.1 + ch * 0.8 + pr.thigh * 0.4
      const w = cw * 1.4
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.28)} m={M.light} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.28, len * 0.8, 0.018, -0.05)}
            m={M.light}
            p={[s * w * 0.38, -len * 0.28, 0.02]}
            r={[0.12, s * 0.72, s * 0.06]}
          />,
        )
      })
      add('chest', <P s={S.torus(cw * 0.44, 0.02, Math.PI, 14)} m={M.light} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    }

    // Red-brown padded shoulder armor with gold trim.
    sides((s) => {
      add('chest', <P s={S.box(0.12 * L, 0.08, 0.14 * L, 0.02)} m={plate} p={[s * cw * 0.55, ch * 0.92, 0]} r={[0.15, 0, s * -0.35]} />)
      add('chest', <P s={S.box(0.13 * L, 0.02, 0.15 * L, 0.006)} m={gold} line={false} p={[s * cw * 0.55, ch * 0.97, 0]} r={[0.15, 0, s * -0.35]} />)
      add('chest', <P s={S.box(0.1 * L, 0.055, 0.11 * L, 0.016)} m={plate} p={[s * cw * 0.52, ch * 0.82, cd * 0.08]} r={[0.2, 0, s * -0.2]} />)
    })

    // Forearm bracers.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.box(0.055 * L, pr.forearm * 0.55, 0.055 * L, 0.012)} m={plate} p={[0, -pr.forearm * 0.45, 0]} />)
      add(fore, <P s={S.box(0.06 * L, 0.014, 0.06 * L, 0.004)} m={gold} line={false} p={[0, -pr.forearm * 0.22, 0]} />)
      add(fore, <P s={S.box(0.06 * L, 0.014, 0.06 * L, 0.004)} m={gold} line={false} p={[0, -pr.forearm * 0.68, 0]} />)
    })

    // Ankle armor plates.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.box(0.07 * L, 0.06, 0.08 * L, 0.014)} m={plate} p={[0, -pr.shin * 0.85, 0.01]} />)
      add(shin, <P s={S.box(0.075 * L, 0.012, 0.085 * L, 0.004)} m={gold} line={false} p={[0, -pr.shin * 0.78, 0.01]} />)
      add(foot, <P s={S.box(0.08 * L, 0.028, 0.12, 0.01)} m={plate} p={[0, -pr.ankle + 0.02, 0.04]} />)
    })
  }

  if (has('chronostasisSuit')) {
    // Hari Kurono / Chronostasis — long pale coat, red hood lining, elongated plague beak.
    const r = pr.headR

    // Full plague doctor mask — long beak, gold-rim circular lenses.
    add('head', <P s={S.sphere(r * 0.95, 14, 12)} m={M.dark} p={[0, -r * 0.05, r * 0.15]} sc={[1.05, 1.0, 1.05]} />)
    add('head', <P s={S.cone(r * 0.28, r * 1.45, 10)} m={M.trim} p={[0, -r * 0.35, r * 1.05]} r={[1.05, 0, 0]} />)
    add('head', <P s={S.cone(r * 0.12, r * 0.35, 8)} m={M.dark} p={[0, -r * 0.72, r * 1.85]} r={[1.05, 0, 0]} />)
    sides((s) => {
      add('head', <P s={S.cyl(r * 0.22, r * 0.22, r * 0.06, 14)} m={M.metal} p={[s * r * 0.32, r * 0.08, r * 0.78]} r={[0, 0, Math.PI / 2]} />)
      add('head', <P s={S.cyl(r * 0.16, r * 0.16, r * 0.04, 12)} m={M.dark} line={false} p={[s * r * 0.34, r * 0.08, r * 0.82]} r={[0, 0, Math.PI / 2]} />)
      add('head', <P s={S.sphere(r * 0.08, 8, 6)} m={M.glow} line={false} p={[s * r * 0.36, r * 0.08, r * 0.88]} />)
    })
    // Strap.
    sides((s) =>
      add('head', <P s={S.box(r * 0.1, r * 0.08, r * 0.5, r * 0.03)} m={M.trim} p={[s * r * 0.75, -r * 0.05, r * 0.05]} r={[0.1, s * 0.15, 0]} />),
    )

    // Red lining visible inside the hood / collar.
    add('chest', <P s={S.torus(cw * 0.46, 0.04, Math.PI * 1.6, 16)} m={M.accent} p={[0, ch * 1.02, -0.02]} r={[Math.PI / 2 + 0.35, 0, 0]} />)
    add('chest', <P s={S.panel(cw * 0.55, ch * 0.35, 0.012)} m={M.accent} line={false} p={[0, ch * 0.85, -cd * 0.35]} r={[0.4, 0, 0]} />)

    // Long pale coat hem + front zip line.
    {
      const len = pr.hipH * 0.85 + ch * 0.5 + pr.thigh * 0.55
      add('cape', <P s={S.panel(cw * 1.35, len, 0.02, -cw * 0.2)} m={M.primary} p={[0, -len / 2 + 0.02, -0.02]} r={[0.05, 0, 0]} />)
      add('cape', <P s={S.panel(cw * 1.25, len * 0.95, 0.01, -cw * 0.18)} m={M.accent} line={false} p={[0, -len / 2 + 0.03, -0.008]} r={[0.05, 0, 0]} />)
      add('chest', <P s={S.box(0.02, ch * 0.9, 0.012, 0.004)} m={M.trim} p={[0, ch * 0.45, cd * 0.55]} />)
      for (let i = 0; i < 5; i++) {
        add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.metal} line={false} p={[0, ch * (0.85 - i * 0.14), cd * 0.56]} />)
      }
    }
  }

  if (has('escanorSuit')) {
    // Night Escanor — ginger mustache, bowtie, forest-green bartender vest over a white shirt.
    const r = pr.headR

    // Thick handlebar mustache.
    add('head', <P s={S.box(r * 0.62, r * 0.1, r * 0.14, r * 0.035)} m={M.hair} p={[0, -r * 0.38, r * 0.82]} r={[0.4, 0, 0]} />)
    sides((s) =>
      add(
        'head',
        <P
          s={S.box(r * 0.28, r * 0.09, r * 0.12, r * 0.03)}
          m={M.hair}
          p={[s * r * 0.34, -r * 0.36, r * 0.74]}
          r={[0.35, s * 0.55, s * 0.2]}
        />,
      ),
    )

    // Small reddish bowtie.
    add('chest', <P s={S.box(0.028, 0.022, 0.016, 0.006)} m={M.accent} p={[0, ch * 0.96, cd * 0.55]} />)
    sides((s) =>
      add(
        'chest',
        <P
          s={S.box(0.045, 0.028, 0.012, 0.005)}
          m={M.accent}
          p={[s * 0.038, ch * 0.96, cd * 0.54]}
          r={[0, 0, s * -0.55]}
        />,
      ),
    )

    // Forest-green V-neck waistcoat over the white shirt.
    add('chest', <P s={S.box(cw * 1.02, ch * 0.92, cd * 1.04, 0.02)} m={M.secondary} p={[0, ch * 0.46, 0]} />)
    add('chest', <P s={S.box(cw * 0.28, ch * 0.72, 0.02, 0.008)} m={M.primary} p={[0, ch * 0.52, cd * 0.54]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.012, ch * 0.85, 0.01, 0.004)} m={M.trim} line={false} p={[s * cw * 0.18, ch * 0.48, cd * 0.54]} />)
      add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.metal} line={false} p={[s * cw * 0.16, ch * 0.62, cd * 0.56]} />)
      add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.metal} line={false} p={[s * cw * 0.16, ch * 0.42, cd * 0.56]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.12, pr.abdomen * 0.7, pr.chestD * 1.02, 0.016)} m={M.secondary} p={[0, pr.abdomen * 0.35, 0]} />)

    // White shirt collar points + long sleeves under the vest.
    sides((s) =>
      add(
        'chest',
        <P
          s={S.box(0.04, 0.035, 0.05, 0.01)}
          m={M.primary}
          p={[s * cw * 0.16, ch * 1.0, cd * 0.28]}
          r={[0.2, s * -0.4, s * 0.15]}
        />,
      ),
    )
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.036 * L, 0.03 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.03 * L, 0.025 * L, pr.forearm * 0.92)} m={M.primary} />)
      add(fore, <P s={S.cyl(0.03 * L, 0.032 * L, 0.035, 10)} m={M.light} p={[0, -pr.forearm * 0.88, 0]} />)
    })

    // Dark dress shoes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.066 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.04, 0.01)} m={M.trim} p={[0, -A + 0.014, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.92, 0.042, FL * 0.85, 0.014)} m={M.dark} p={[0, -A + 0.036, FL * 0.26]} />)
    })
  }

  if (has('escanorPride')) {
    // Day Escanor — mustache, sun-buckle belt, bare eight-pack, lion-pride glow.
    const r = pr.headR

    // Handlebar mustache (same ginger as hair).
    add('head', <P s={S.box(r * 0.7, r * 0.12, r * 0.16, r * 0.04)} m={M.hair} p={[0, -r * 0.4, r * 0.82]} r={[0.4, 0, 0]} />)
    sides((s) =>
      add(
        'head',
        <P
          s={S.box(r * 0.32, r * 0.1, r * 0.14, r * 0.035)}
          m={M.hair}
          p={[s * r * 0.38, -r * 0.38, r * 0.74]}
          r={[0.35, s * 0.6, s * 0.22]}
        />,
      ),
    )

    // Soft eight-pack on the bare midriff.
    for (let row = 0; row < 4; row++) {
      sides((s) =>
        add(
          'spine',
          <P
            s={S.box(0.032, 0.024, 0.01, 0.004)}
            m={M.skinShade}
            line={false}
            p={[s * 0.036, pr.abdomen * (0.2 + row * 0.18), pr.chestD * 0.44]}
          />,
        ),
      )
    }
    // Pecs read on the bare chest.
    sides((s) =>
      add(
        'chest',
        <P
          s={S.box(pr.chestW * 0.4, pr.chestH * 0.32, 0.035, 0.014)}
          m={M.skinShade}
          line={false}
          p={[s * pr.chestW * 0.22, pr.chestH * 0.62, pr.chestD * 0.48]}
        />,
      ),
    )

    // Brown belt + golden sunburst buckle.
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.04, pr.chestD * 1.08, 0.012)} m={M.trim} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.cyl(0.032, 0.032, 0.02, 12)} m={M.metal} p={[0, pr.abdomen * 0.08, pr.chestD * 0.56]} r={[Math.PI / 2, 0, 0]} />)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      add(
        'spine',
        <P
          s={S.shard(0.012, 0.028, 0.006)}
          m={M.accent}
          line={false}
          p={[Math.cos(a) * 0.04, pr.abdomen * 0.08 + Math.sin(a) * 0.04, pr.chestD * 0.58]}
          r={[0.2, 0, a]}
        />,
      )
    }

    // Heat shimmer / solar glow rings behind the shoulders.
    add('chest', <P s={S.torus(cw * 0.55, 0.018, Math.PI * 1.4, 18)} m={M.glow} line={false} p={[0, ch * 0.55, -cd * 0.35]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
    add('chest', <P s={S.torus(cw * 0.38, 0.012, Math.PI * 1.2, 14)} m={M.glowAlt} line={false} p={[0, ch * 0.62, -cd * 0.28]} r={[Math.PI / 2 + 0.15, 0, Math.PI]} />)

    // Brown boots.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.072 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.028, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.016, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.016)} m={M.trim} p={[0, -A + 0.042, FL * 0.26]} />)
      add(shin, <P s={S.cyl(0.032 * L, 0.036 * L, 0.1, 10)} m={M.trim} p={[0, -pr.shin + 0.05, 0]} />)
    })
  }

  if (has('mobSuit')) {
    // Normal Mob — stiff gakuran collar, gold buttons, white cuff peeks, green-tip sneakers.
    const front = cd * 0.55

    // Standing high collar.
    add('chest', <P s={S.cyl(0.068 * Math.sqrt(L), 0.058 * Math.sqrt(L), 0.1, 16, true)} m={M.primary} p={[0, ch * 1.04, -0.008]} />)
    add('chest', <P s={S.cyl(0.052 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.05, 12, true)} m={M.trim} line={false} p={[0, ch * 1.06, -0.006]} />)

    // Five gold buttons down the center.
    for (let i = 0; i < 5; i++) {
      add('chest', <P s={S.sphere(0.011, 8, 6)} m={M.metal} line={false} p={[0, ch * (0.9 - i * 0.16), front]} />)
    }

    // White shirt cuffs peeking from the sleeves.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.028 * L, 0.03 * L, 0.04, 10)} m={M.light} p={[0, -pr.forearm * 0.88, 0]} />)
    })

    // White sneakers with a green accent tip.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.022, FL + 0.05, 0.008)} m={M.light} p={[0, -A + 0.012, FL * 0.32]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.048, FL + 0.02, 0.014)} m={M.white} p={[0, -A + 0.038, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.55, 0.03, 0.04, 0.01)} m={M.accent} line={false} p={[0, -A + 0.04, FL * 0.62]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.008, 0.012, 0.003)} m={M.light} line={false} p={[0, -A + 0.055, FL * 0.5]} />)
    })
  }

  if (has('mobAwaken')) {
    // ???% — torn gakuran, white-out eye flares, psychic residue shards.
    const r = pr.headR
    const front = cd * 0.55

    // Jagged white eye streaks.
    sides((s) => {
      add('head', <P s={S.box(r * 0.12, r * 0.45, r * 0.08, r * 0.03)} m={M.white} line={false} shadow={false} p={[s * r * 0.32, r * 0.08, r * 0.95]} r={[0, 0, s * -0.35]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.28, r * 0.06, r * 0.02)} m={M.glow} line={false} shadow={false} p={[s * r * 0.42, r * 0.22, r * 0.88]} r={[0, 0, s * -0.55]} />)
    })

    // Tattered jacket tears showing undershirt.
    add('chest', <P s={S.box(cw * 0.22, ch * 0.28, 0.02, 0.006)} m={M.light} p={[-cw * 0.18, ch * 0.55, front]} r={[0, 0, 0.25]} />)
    add('chest', <P s={S.box(cw * 0.18, ch * 0.22, 0.02, 0.006)} m={M.light} p={[cw * 0.22, ch * 0.38, front]} r={[0, 0, -0.35]} />)
    sides((s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.box(0.04 * L, 0.08 * L, 0.05 * L, 0.01)} m={M.light} p={[s * 0.01, -pr.upperArm * 0.35, 0.02]} r={[0.2, 0, s * 0.4]} />)
    })

    // Silver buttons still clinging on.
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.sphere(0.01, 8, 6)} m={M.metal} line={false} p={[0, ch * (0.88 - i * 0.18), front]} />)
    }

    // High collar remnant.
    add('chest', <P s={S.cyl(0.065 * Math.sqrt(L), 0.055 * Math.sqrt(L), 0.09, 14, true)} m={M.primary} p={[0, ch * 1.02, -0.01]} />)
  }

  if (has('guySuit') || has('eightGates')) {
    // Might Guy — green jumpsuit + olive flak + orange warmers; Eighth Gate adds crimson steam.
    const r = pr.headR
    const gates = has('eightGates')
    const front = cd * 0.52

    // Signature thick rectangular brows.
    sides((s) => {
      const by = -r * 0.02 + r * 0.38
      const bx = s * r * 0.34
      add(
        'head',
        <P
          s={S.box(r * 0.48, r * 0.14, r * 0.1, r * 0.04)}
          m={M.hairShade}
          line={false}
          shadow={false}
          p={[bx, by, r * 0.72]}
          r={[-0.15, s * 0.2, 0]}
        />,
      )
    })

    // High flak collar + olive vest with zipper & scroll pouches.
    add('chest', <P s={S.cyl(0.058 * Math.sqrt(L), 0.05 * Math.sqrt(L), 0.07, 14, true)} m={M.secondary} p={[0, ch * 1.0, -0.008]} />)
    add('chest', <P s={S.box(cw * 0.98, ch * 0.78, 0.03, 0.012)} m={M.secondary} p={[0, ch * 0.48, front]} />)
    add('chest', <P s={S.box(0.014, ch * 0.7, 0.01, 0.004)} m={M.trim} line={false} p={[0, ch * 0.5, front + 0.018]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.box(0.01, ch * 0.58, 0.008, 0.003)}
          m={M.secondary}
          line={false}
          p={[(i - 1.5) * cw * 0.2, ch * 0.48, front + 0.02]}
        />,
      )
    }
    sides((s) => {
      add('chest', <P s={S.box(0.055, 0.075, 0.04, 0.014)} m={M.secondary} p={[s * cw * 0.36, ch * 0.58, front + 0.01]} />)
      add('chest', <P s={S.box(0.048, 0.06, 0.035, 0.012)} m={M.secondary} p={[s * cw * 0.36, ch * 0.4, front + 0.01]} />)
      add('chest', <P s={S.box(0.012, 0.012, 0.01, 0.003)} m={M.metal} line={false} p={[s * cw * 0.36, ch * 0.62, front + 0.032]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.15, pr.abdomen * 0.55, pr.chestD * 1.02, 0.016)} m={M.secondary} p={[0, pr.abdomen * 0.4, 0]} />)

    // Green jumpsuit sleeves over the bodysuit arms.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.036 * L, 0.03 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.03 * L, 0.025 * L, pr.forearm)} m={M.primary} />)
    })

    // Orange ribbed leg warmers from mid-shin to ankle.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.62, 12)} m={M.accent} p={[0, -pr.shin * 0.58, 0]} />)
      for (let i = 0; i < 5; i++) {
        add(
          shin,
          <P
            s={S.cyl(0.042 * L, 0.042 * L, 0.012, 12)}
            m={i % 2 ? M.accent : M.trim}
            line={false}
            p={[0, -pr.shin * (0.35 + i * 0.1), 0]}
          />,
        )
      }
    })

    // Open-toe ninja sandals (dark blue).
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.016, FL + 0.04, 0.006)} m={M.trim} p={[0, -A + 0.012, FL * 0.28]} />)
      add(foot, <P s={S.box(0.018, 0.012, FL * 0.7, 0.004)} m={M.trim} p={[0, -A + 0.028, FL * 0.18]} />)
      add(shin, <P s={S.box(0.048 * L, 0.018, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.018, 0.028 * L]} />)
    })

    if (gates) {
      // Headband tied at the waist (protector plate forward).
      add('spine', <P s={S.box(pr.waistW * 1.22, 0.032, pr.chestD * 1.05, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.1, 0]} />)
      add('spine', <P s={S.box(0.055, 0.048, 0.016, 0.006)} m={M.metal} p={[0, pr.abdomen * 0.1, pr.chestD * 0.55]} />)
      add('spine', <P s={S.box(0.01, 0.03, 0.006, 0.002)} m={M.trim} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.58]} />)
      // Crimson steam aura — rings + floating embers.
      add('chest', <P s={S.torus(cw * 0.62, 0.022, Math.PI * 1.6, 18)} m={M.glow} line={false} p={[0, ch * 0.45, -cd * 0.2]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      add('chest', <P s={S.torus(cw * 0.42, 0.014, Math.PI * 1.4, 14)} m={M.glowAlt} line={false} p={[0, ch * 0.7, -cd * 0.15]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
      add('pelvis', <P s={S.torus(pr.pelvisW * 0.7, 0.016, Math.PI * 1.5, 16)} m={M.glow} line={false} p={[0, 0.02, -0.02]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.02, 0.07 + (i % 3) * 0.02, 0.012)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            p={[Math.cos(a) * cw * 0.55, ch * (0.2 + (i % 4) * 0.2), Math.sin(a) * cd * 0.35 - 0.04]}
            r={[0.4, a, 0.2]}
          />,
        )
      }
    }
  }

  if (has('rockLeeSuit')) {
    // Rock Lee — plain green jumpsuit, waist headband, orange warmers, thick brows (no flak).
    const r = pr.headR
    const front = cd * 0.52

    sides((s) => {
      const by = -r * 0.02 + r * 0.38
      const bx = s * r * 0.34
      add(
        'head',
        <P
          s={S.box(r * 0.48, r * 0.14, r * 0.1, r * 0.04)}
          m={M.hairShade}
          line={false}
          shadow={false}
          p={[bx, by, r * 0.72]}
          r={[-0.15, s * 0.2, 0]}
        />,
      )
    })

    // High jumpsuit collar (no olive flak).
    add('chest', <P s={S.cyl(0.055 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.065, 14, true)} m={M.primary} p={[0, ch * 1.0, -0.008]} />)
    add('chest', <P s={S.box(0.012, ch * 0.62, 0.008, 0.003)} m={M.trim} line={false} p={[0, ch * 0.48, front + 0.014]} />)

    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.limb(0.036 * L, 0.03 * L, pr.upperArm)} m={M.primary} />)
      add(fore, <P s={S.limb(0.03 * L, 0.025 * L, pr.forearm)} m={M.primary} />)
    })

    // Forehead protector tied at the waist.
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.032, pr.chestD * 1.05, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.box(0.055, 0.048, 0.016, 0.006)} m={M.metal} p={[0, pr.abdomen * 0.1, pr.chestD * 0.55]} />)
    add('spine', <P s={S.box(0.01, 0.03, 0.006, 0.002)} m={M.trim} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.58]} />)

    // Thigh pouch + bandage wrap (right leg).
    add('rThigh', <P s={S.box(0.048 * L, 0.055 * L, 0.038 * L, 0.012)} m={M.trim} p={[0.02 * L, -pr.thigh * 0.42, 0.02]} />)
    add('rThigh', <P s={S.cyl(0.038 * L, 0.04 * L, 0.028, 10)} m={M.light} p={[0, -pr.thigh * 0.38, 0]} />)

    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.62, 12)} m={M.accent} p={[0, -pr.shin * 0.58, 0]} />)
      for (let i = 0; i < 5; i++) {
        add(
          shin,
          <P
            s={S.cyl(0.042 * L, 0.042 * L, 0.012, 12)}
            m={i % 2 ? M.accent : M.trim}
            line={false}
            p={[0, -pr.shin * (0.35 + i * 0.1), 0]}
          />,
        )
      }
    })

    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.016, FL + 0.04, 0.006)} m={M.trim} p={[0, -A + 0.012, FL * 0.28]} />)
      add(foot, <P s={S.box(0.018, 0.012, FL * 0.7, 0.004)} m={M.trim} p={[0, -A + 0.028, FL * 0.18]} />)
      add(shin, <P s={S.box(0.048 * L, 0.018, 0.02, 0.006)} m={M.trim} p={[0, -pr.shin + 0.018, 0.028 * L]} />)
    })
  }

  if (has('dekuSuit') || has('dekuAwaken')) {
    // Deku Gamma — teal jumpsuit, silver respirator, white gloves/pads, red belt & iron-sole boots.
    const awaken = has('dekuAwaken')
    const front = cd * 0.52
    const r = pr.headR

    // Silver respirator collar with ear-like fins (All Might homage).
    add('neck', <P s={S.torus(0.052 * Math.sqrt(L), 0.018, Math.PI * 2, 16)} m={M.metal} p={[0, 0.008, 0.01]} r={[Math.PI / 2 - 0.2, 0, 0]} />)
    add('neck', <P s={S.box(0.09, 0.04, 0.05, 0.014)} m={M.metal} p={[0, -0.01, 0.045]} />)
    for (let i = 0; i < 5; i++) {
      add(
        'neck',
        <P
          s={S.cyl(0.004, 0.004, 0.012, 6)}
          m={M.trim}
          line={false}
          p={[(i - 2) * 0.014, -0.005, 0.068]}
          r={[Math.PI / 2, 0, 0]}
        />,
      )
    }
    sides((s) => {
      add('neck', <P s={S.panel(0.018, 0.1, 0.012, 0.006)} m={M.metal} p={[s * 0.055, 0.04, -0.02]} r={[0.35, s * 0.4, s * -0.55]} />)
      add('neck', <P s={S.panel(0.014, 0.07, 0.01, 0.004)} m={M.metal} p={[s * 0.07, 0.02, -0.04]} r={[0.55, s * 0.55, s * -0.35]} />)
    })

    // Black suit piping + chest seams.
    sides((s) =>
      add('chest', <P s={S.box(0.012, ch * 0.92, 0.01, 0.004)} m={M.trim} line={false} p={[s * cw * 0.46, ch * 0.48, front * 0.15]} />),
    )
    add('chest', <P s={S.box(cw * 0.35, 0.014, 0.01, 0.004)} m={M.trim} line={false} p={[0, ch * 0.62, front + 0.002]} />)

    // White shoulder pads with gold rivets.
    sides((s) => {
      add('chest', <P s={S.box(0.055, 0.04, 0.05, 0.014)} m={M.white} p={[s * cw * 0.42, ch * 0.92, cd * 0.15]} r={[0.15, 0, s * -0.25]} />)
      add('chest', <P s={S.cyl(0.01, 0.01, 0.01, 10)} m={M.metal} line={false} p={[s * cw * 0.42, ch * 0.94, cd * 0.22]} r={[Math.PI / 2, 0, 0]} />)
    })

    // White elbow guards with blue chevrons.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(up, <P s={S.cyl(0.038 * L, 0.042 * L, 0.06, 12)} m={M.white} p={[0, -pr.upperArm * 0.92, 0]} />)
      add(up, <P s={S.box(0.05 * L, 0.018, 0.01, 0.004)} m={M.glow} line={false} p={[0, -pr.upperArm * 0.88, 0.038 * L]} r={[0, 0, 0]} />)
      add(up, <P s={S.box(0.042 * L, 0.014, 0.008, 0.003)} m={M.glow} line={false} p={[0, -pr.upperArm * 0.96, 0.036 * L]} />)
      // Long white gloves.
      add(fore, <P s={S.cyl(0.032 * L, 0.036 * L, pr.forearm * 0.85, 12)} m={M.white} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.038 * L, 0.038 * L, 0.018, 12)} m={M.trim} p={[0, -pr.forearm * 0.12, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.15, pr.hand * 2.4, pr.hand * 1.8, pr.hand * 0.6)} m={M.white} p={[0, -pr.hand * 1.05, 0.002]} />)
    })

    // Red utility belt + pouches.
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.038, pr.chestD * 1.06, 0.012)} m={M.accent} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.box(0.04, 0.032, 0.02, 0.008)} m={M.trim} p={[0, pr.abdomen * 0.12, pr.chestD * 0.54]} />)
    sides((s) => {
      add('spine', <P s={S.box(0.045, 0.055, 0.035, 0.01)} m={M.accent} p={[s * pr.waistW * 0.55, pr.abdomen * 0.08, pr.chestD * 0.35]} />)
      add('spine', <P s={S.box(0.038, 0.045, 0.03, 0.008)} m={M.accent} p={[s * pr.waistW * 0.58, pr.abdomen * 0.05, 0]} />)
    })

    // Black iron-sole calf armor + oversized red boots.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.078 * Math.sqrt(L)
      // Chunk armor plating over shin.
      add(shin, <P s={S.box(0.07 * L, pr.shin * 0.55, 0.055 * L, 0.014)} m={M.trim} p={[0, -pr.shin * 0.55, 0.01]} />)
      add(shin, <P s={S.box(0.055 * L, 0.04, 0.02, 0.008)} m={M.metal} line={false} p={[0, -pr.shin * 0.4, 0.04 * L]} />)
      // Red mid-calf boot shaft.
      add(shin, <P s={S.cyl(0.042 * L, 0.05 * L, pr.shin * 0.48, 12)} m={M.accent} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.052 * L, 0.052 * L, 0.018, 12)} m={M.trim} p={[0, -pr.shin * 0.52, 0]} />)
      // Thick black iron sole + red upper.
      add(foot, <P s={S.box(fw, 0.028, FL + 0.06, 0.012)} m={M.trim} p={[0, -A + 0.014, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.055, FL + 0.03, 0.018)} m={M.accent} p={[0, -A + 0.045, FL * 0.26]} />)
      // Toe ventilation slits.
      for (let i = 0; i < 3; i++) {
        add(
          foot,
          <P
            s={S.box(0.008, 0.01, 0.022, 0.003)}
            m={M.trim}
            line={false}
            p={[(i - 1) * 0.018, -A + 0.03, FL * 0.62]}
          />,
        )
      }
    })

    if (awaken) {
      // Arm bandage + Full Cowl electricity shards (no cape — Deku never wears one).
      // Right-arm bandage wrap.
      add('rFore', <P s={S.cyl(0.036 * L, 0.038 * L, pr.forearm * 0.7, 10)} m={M.light} p={[0, -pr.forearm * 0.45, 0]} />)
      for (let i = 0; i < 4; i++) {
        add(
          'rFore',
          <P
            s={S.box(0.055 * L, 0.012, 0.01, 0.003)}
            m={M.white}
            line={false}
            p={[0, -pr.forearm * (0.2 + i * 0.15), 0.032 * L]}
            r={[0, 0, 0.3]}
          />,
        )
      }
      // Suit tears.
      add('chest', <P s={S.box(cw * 0.16, ch * 0.2, 0.016, 0.005)} m={M.skin} p={[-cw * 0.2, ch * 0.5, front]} r={[0, 0, 0.3]} />)
      add('chest', <P s={S.box(cw * 0.12, ch * 0.16, 0.014, 0.004)} m={M.skin} p={[cw * 0.22, ch * 0.35, front]} r={[0, 0, -0.4]} />)
      // OFA lightning shards baked around the torso.
      add('chest', <P s={S.torus(cw * 0.58, 0.016, Math.PI * 1.5, 16)} m={M.glow} line={false} p={[0, ch * 0.4, -cd * 0.15]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
      add('chest', <P s={S.torus(cw * 0.38, 0.01, Math.PI * 1.3, 12)} m={M.glowAlt} line={false} p={[0, ch * 0.7, -cd * 0.1]} r={[Math.PI / 2 + 0.15, 0, Math.PI]} />)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.016, 0.08 + (i % 3) * 0.025, 0.01)}
            m={i % 2 ? M.glow : M.glowAlt}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.55, ch * (0.15 + (i % 4) * 0.22), Math.sin(a) * cd * 0.4 - 0.02]}
            r={[0.5, a, 0.35]}
          />,
        )
      }
      // Glowing freckle flare / eye sparks.
      sides((s) => {
        add('head', <P s={S.shard(r * 0.04, r * 0.16, r * 0.02)} m={M.glow} line={false} shadow={false} p={[s * r * 0.55, r * 0.15, r * 0.7]} r={[0.2, s * 0.4, s * -0.5]} />)
      })
    }
  }

  if (has('todorokiSuit')) {
    // Shoto — split hair, heterochromia, burn scar, navy hero suit, ice gauntlets, coolant cans.
    const r = pr.headR
    const front = cd * 0.52
    const ey = -r * 0.1
    const faceZ = (x: number, y: number) =>
      0.98 * r * Math.sqrt(Math.max(0, 1 - (x * x + y * y) / (r * r)))

    // Split scalp — white on his right (−X), crimson on his left (+X).
    add('head', <P s={S.dome(r * 1.08, Math.PI * 0.58)} m={M.hair} p={[-r * 0.18, r * 0.12, -r * 0.08]} r={[-0.42, 0.15, 0]} sc={[0.78, 1, 1]} />)
    add('head', <P s={S.dome(r * 1.08, Math.PI * 0.58)} m={M.hairShade} p={[r * 0.18, r * 0.12, -r * 0.08]} r={[-0.42, -0.15, 0]} sc={[0.78, 1, 1]} />)
    // White right locks.
    ;[
      [-0.55, 0.55, 0.35],
      [-0.75, 0.25, 0.45],
      [-0.35, 0.72, 0.15],
      [-0.85, -0.05, 0.25],
    ].forEach(([x, y, z], i) => {
      add(
        'head',
        <P
          s={S.cone(r * (0.14 + (i % 2) * 0.04), r * (0.42 + (i % 3) * 0.08), 6)}
          m={M.hair}
          p={[x * r, y * r, z * r]}
          r={[0.35 + i * 0.08, -0.4, -0.25]}
        />,
      )
    })
    // Crimson left locks.
    ;[
      [0.55, 0.55, 0.35],
      [0.75, 0.25, 0.45],
      [0.35, 0.72, 0.15],
      [0.85, -0.05, 0.25],
    ].forEach(([x, y, z], i) => {
      add(
        'head',
        <P
          s={S.cone(r * (0.14 + (i % 2) * 0.04), r * (0.42 + (i % 3) * 0.08), 6)}
          m={M.hairShade}
          p={[x * r, y * r, z * r]}
          r={[0.35 + i * 0.08, 0.4, 0.25]}
        />,
      )
    })
    // Center fringe split.
    add('head', <P s={S.panel(r * 0.18, r * 0.4, r * 0.08, r * 0.03)} m={M.hair} p={[-r * 0.12, r * 0.05, r * 0.72]} r={[0.55, 0.1, -0.15]} />)
    add('head', <P s={S.panel(r * 0.18, r * 0.4, r * 0.08, r * 0.03)} m={M.hairShade} p={[r * 0.12, r * 0.05, r * 0.72]} r={[0.55, -0.1, 0.15]} />)

    // Heterochromia — left iris turquoise (fire), right stays grey from palette.
    {
      const lx = r * 0.34
      const lz = faceZ(lx, ey) + r * 0.055
      add('head', <P s={S.sphere(r * 0.11, 10, 8)} m={M.glow} line={false} shadow={false} p={[lx, ey - r * 0.01, lz]} sc={[0.85, 0.9, 0.35]} />)
      add('head', <P s={S.sphere(r * 0.045, 8, 6)} m={M.ink} line={false} shadow={false} p={[lx, ey - r * 0.015, lz + r * 0.02]} sc={[0.8, 1.05, 0.3]} />)
    }

    // Burn scar over the left eye (brow → cheek).
    {
      const x = r * 0.34
      ;[
        [r * 0.42, r * 0.55, -0.12],
        [r * 0.06, r * 0.48, 0.1],
        [-r * 0.28, r * 0.42, -0.1],
      ].forEach(([y, h, tip]) => {
        add(
          'head',
          <P
            s={S.box(r * 0.05, h, r * 0.03, r * 0.012)}
            m={M.mouth}
            line={false}
            shadow={false}
            p={[x + tip * r * 0.12, y, faceZ(x, y) + r * 0.008]}
            r={[0, 0.35, tip]}
          />,
        )
      })
    }

    // High collar with padded ridges.
    add('neck', <P s={S.cyl(0.055 * Math.sqrt(L), 0.048 * Math.sqrt(L), 0.1, 14)} m={M.primary} p={[0, 0.02, 0.01]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'neck',
        <P
          s={S.torus(0.052 * Math.sqrt(L), 0.008, Math.PI * 1.6, 12)}
          m={M.secondary}
          p={[0, 0.055 - i * 0.022, 0.015]}
          r={[Math.PI / 2 - 0.15, 0, 0]}
        />,
      )
    }

    // Chest armor plates / straps + grey T crest.
    sides((s) => {
      add('chest', <P s={S.box(0.045, ch * 0.85, 0.04, 0.012)} m={M.secondary} p={[s * cw * 0.28, ch * 0.5, front * 0.55]} r={[0.1, 0, s * -0.15]} />)
      add('chest', <P s={S.box(0.055, 0.04, 0.05, 0.014)} m={M.secondary} p={[s * cw * 0.4, ch * 0.95, cd * 0.2]} r={[0.2, 0, s * -0.3]} />)
    })
    add('chest', <P s={S.box(cw * 0.28, 0.022, 0.012, 0.005)} m={M.secondary} line={false} p={[0, ch * 0.72, front]} />)
    add('chest', <P s={S.box(0.022, ch * 0.42, 0.012, 0.005)} m={M.secondary} line={false} p={[0, ch * 0.42, front]} />)

    // Ice gauntlets + red/white fingerless gloves.
    sides((s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.cyl(0.042 * L, 0.046 * L, pr.forearm * 0.72, 10)} m={M.secondary} p={[0, -pr.forearm * 0.42, 0]} />)
      add(fore, <P s={S.cyl(0.048 * L, 0.048 * L, 0.022, 10)} m={M.metal} p={[0, -pr.forearm * 0.12, 0]} />)
      for (let i = 0; i < 3; i++) {
        add(
          fore,
          <P
            s={S.box(0.055 * L, 0.018, 0.012, 0.004)}
            m={M.metal}
            line={false}
            p={[0, -pr.forearm * (0.25 + i * 0.18), 0.04 * L]}
          />,
        )
      }
      // Split glove — white knuckles, red palm band.
      add(hand, <P s={S.box(pr.hand * 2.1, pr.hand * 1.6, pr.hand * 1.7, pr.hand * 0.5)} m={M.light} p={[0, -pr.hand * 0.7, 0.002]} />)
      add(hand, <P s={S.box(pr.hand * 2.0, pr.hand * 0.55, pr.hand * 1.65, pr.hand * 0.25)} m={M.accent} p={[0, -pr.hand * 1.35, 0.002]} />)
      // Open fingertips.
      for (let i = 0; i < 3; i++) {
        add(
          hand,
          <P
            s={S.box(pr.hand * 0.35, pr.hand * 0.55, pr.hand * 0.4, pr.hand * 0.12)}
            m={M.skin}
            p={[(i - 1) * pr.hand * 0.55, -pr.hand * 1.85, pr.hand * 0.15]}
          />,
        )
      }
      void s
    })

    // Tan utility belt + hip coolant canisters.
    add('spine', <P s={S.box(pr.waistW * 1.3, 0.036, pr.chestD * 1.05, 0.01)} m={M.light} p={[0, pr.abdomen * 0.1, 0]} />)
    sides((s) => {
      add('spine', <P s={S.box(0.04, 0.05, 0.032, 0.008)} m={M.light} p={[s * pr.waistW * 0.52, pr.abdomen * 0.06, pr.chestD * 0.32]} />)
      add('spine', <P s={S.box(0.055, 0.14, 0.045, 0.012)} m={M.metal} p={[s * pr.waistW * 0.62, -0.02, 0]} />)
      add('spine', <P s={S.cyl(0.012, 0.012, 0.04, 8)} m={M.trim} p={[s * pr.waistW * 0.62, 0.06, 0]} />)
    })

    // White ice boots with grey soles / grip spikes.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.075 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.045 * L, 0.05 * L, pr.shin * 0.42, 12)} m={M.light} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.052 * L, 0.052 * L, 0.016, 12)} m={M.secondary} p={[0, -pr.shin * 0.52, 0]} />)
      add(foot, <P s={S.box(fw, 0.026, FL + 0.05, 0.01)} m={M.secondary} p={[0, -A + 0.013, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.028, 0.016)} m={M.light} p={[0, -A + 0.042, FL * 0.26]} />)
      for (let i = 0; i < 3; i++) {
        add(
          foot,
          <P
            s={S.cone(0.006, 0.014, 4)}
            m={M.metal}
            line={false}
            p={[(i - 1) * 0.018, -A - 0.002, FL * 0.55]}
            r={[Math.PI, 0, 0]}
          />,
        )
      }
    })
  }

  if (has('allMightSuit') || has('allMightTruth')) {
    // All Might — blue/red/yellow hero suit; Truth tears it open with a golden last-stand aura.
    const truth = has('allMightTruth')
    const front = cd * 0.52
    const r = pr.headR

    // Red Y / X chest emblem with white borders.
    add('chest', <P s={S.box(cw * 0.18, ch * 0.92, 0.016, 0.005)} m={M.accent} p={[0, ch * 0.48, front]} r={[0, 0, 0.35]} />)
    add('chest', <P s={S.box(cw * 0.18, ch * 0.92, 0.016, 0.005)} m={M.accent} p={[0, ch * 0.48, front]} r={[0, 0, -0.35]} />)
    add('chest', <P s={S.box(cw * 0.22, ch * 0.95, 0.01, 0.003)} m={M.white} line={false} p={[0, ch * 0.48, front - 0.004]} r={[0, 0, 0.35]} />)
    add('chest', <P s={S.box(cw * 0.22, ch * 0.95, 0.01, 0.003)} m={M.white} line={false} p={[0, ch * 0.48, front - 0.004]} r={[0, 0, -0.35]} />)
    // Lower Y stem.
    add('spine', <P s={S.box(cw * 0.12, pr.abdomen * 0.95, 0.014, 0.004)} m={M.accent} p={[0, pr.abdomen * 0.45, pr.chestD * 0.48]} />)
    add('spine', <P s={S.box(cw * 0.16, pr.abdomen * 0.98, 0.008, 0.003)} m={M.white} line={false} p={[0, pr.abdomen * 0.45, pr.chestD * 0.46]} />)

    // White outer-thigh racing panels.
    sides((s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.box(0.022, pr.thigh * 0.85, 0.05, 0.008)} m={M.white} p={[s * 0.048 * L, -pr.thigh * 0.48, 0]} />)
    })

    // Yellow forearm fins + white gloves with striped cuffs.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.panel(0.055 * L, 0.14 * L, 0.016, 0.02)} m={M.metal} p={[0, -pr.forearm * 0.35, 0.04 * L]} r={[-0.35, 0, 0]} />)
      add(fore, <P s={S.panel(0.04 * L, 0.1 * L, 0.012, 0.014)} m={M.light} line={false} p={[0, -pr.forearm * 0.32, 0.05 * L]} r={[-0.35, 0, 0]} />)
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, pr.forearm * 0.55, 12)} m={M.white} p={[0, -pr.forearm * 0.62, 0]} />)
      add(fore, <P s={S.cyl(0.042 * L, 0.042 * L, 0.028, 12)} m={M.accent} p={[0, -pr.forearm * 0.28, 0]} />)
      add(fore, <P s={S.cyl(0.044 * L, 0.044 * L, 0.012, 12)} m={M.white} line={false} p={[0, -pr.forearm * 0.22, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.2, pr.hand * 2.45, pr.hand * 1.85, pr.hand * 0.6)} m={M.white} p={[0, -pr.hand * 1.05, 0.002]} />)
    })

    // Yellow utility belt + silver circular buckle.
    add('spine', <P s={S.box(pr.waistW * 1.3, 0.042, pr.chestD * 1.08, 0.014)} m={M.metal} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.cyl(0.042, 0.042, 0.018, 16)} m={M.light} p={[0, pr.abdomen * 0.1, pr.chestD * 0.55]} r={[Math.PI / 2, 0, 0]} />)
    add('spine', <P s={S.cyl(0.022, 0.022, 0.01, 12)} m={M.accent} line={false} p={[0, pr.abdomen * 0.1, pr.chestD * 0.565]} r={[Math.PI / 2, 0, 0]} />)

    // Yellow mid-calf boots with red/white cuff stripes.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.078 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.042 * L, 0.05 * L, pr.shin * 0.5, 12)} m={M.metal} p={[0, -pr.shin * 0.7, 0]} />)
      add(shin, <P s={S.cyl(0.052 * L, 0.052 * L, 0.02, 12)} m={M.accent} p={[0, -pr.shin * 0.48, 0]} />)
      add(shin, <P s={S.cyl(0.054 * L, 0.054 * L, 0.01, 12)} m={M.white} line={false} p={[0, -pr.shin * 0.44, 0]} />)
      add(foot, <P s={S.box(fw, 0.026, FL + 0.055, 0.012)} m={M.trim} p={[0, -A + 0.013, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.03, 0.016)} m={M.metal} p={[0, -A + 0.042, FL * 0.26]} />)
    })

    if (truth) {
      // Torn left sleeve — expose wiry upper arm.
      add('lUpper', <P s={S.box(0.06 * L, pr.upperArm * 0.55, 0.05 * L, 0.012)} m={M.skin} p={[0, -pr.upperArm * 0.45, 0]} r={[0, 0, 0.15]} />)
      add('lUpper', <P s={S.box(0.04 * L, 0.05, 0.03, 0.008)} m={M.primary} p={[0.01, -pr.upperArm * 0.15, 0.02]} r={[0.2, 0.3, 0.4]} />)
      // Chest tears.
      add('chest', <P s={S.box(cw * 0.18, ch * 0.22, 0.018, 0.005)} m={M.skin} p={[-cw * 0.18, ch * 0.55, front]} r={[0, 0, 0.35]} />)
      add('chest', <P s={S.box(cw * 0.14, ch * 0.18, 0.016, 0.004)} m={M.skin} p={[cw * 0.2, ch * 0.38, front]} r={[0, 0, -0.45]} />)
      add('chest', <P s={S.box(cw * 0.1, ch * 0.12, 0.014, 0.004)} m={M.skin} p={[cw * 0.08, ch * 0.7, front]} r={[0, 0, 0.2]} />)
      // Blood streaks across the face.
      add('head', <P s={S.box(r * 0.04, r * 0.55, r * 0.01, r * 0.008)} m={M.accent} line={false} p={[-r * 0.28, r * 0.05, r * 0.78]} r={[0.15, 0, 0.35]} />)
      add('head', <P s={S.box(r * 0.035, r * 0.4, r * 0.01, r * 0.006)} m={M.accent} line={false} p={[r * 0.22, r * 0.12, r * 0.76]} r={[-0.1, 0, -0.25]} />)
      add('head', <P s={S.box(r * 0.03, r * 0.28, r * 0.008, r * 0.005)} m={M.accent} line={false} p={[r * 0.05, -r * 0.15, r * 0.8]} r={[0.2, 0, 0.1]} />)
      // Golden last-stand aura.
      add('chest', <P s={S.torus(cw * 0.62, 0.018, Math.PI * 1.6, 18)} m={M.glow} line={false} p={[0, ch * 0.4, -cd * 0.18]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      add('chest', <P s={S.torus(cw * 0.4, 0.012, Math.PI * 1.4, 14)} m={M.glowAlt} line={false} p={[0, ch * 0.72, -cd * 0.12]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
      add('pelvis', <P s={S.torus(pr.pelvisW * 0.72, 0.014, Math.PI * 1.5, 16)} m={M.glow} line={false} p={[0, 0.02, -0.02]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.018, 0.07 + (i % 3) * 0.02, 0.01)}
            m={i % 2 ? M.glow : M.metal}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.55, ch * (0.15 + (i % 4) * 0.22), Math.sin(a) * cd * 0.35 - 0.04]}
            r={[0.4, a, 0.25]}
          />,
        )
      }
    }
  }

  if (has('denjiSuit')) {
    // Denji — white Public Safety shirt, black tie, brown belt, rolled cuffs, white/red sneakers.
    const front = cd * 0.55

    // Open collar + black necktie.
    add('chest', <P s={S.box(cw * 0.22, ch * 0.18, 0.02, 0.008)} m={M.light} p={[0, ch * 0.92, front]} />)
    add('chest', <P s={S.box(0.042, 0.035, 0.02, 0.01)} m={M.trim} p={[0, ch * 0.9, front + 0.01]} />)
    add('chest', <P s={S.panel(0.034, ch * 0.7, 0.012)} m={M.trim} p={[0, ch * 0.48, front + 0.012]} />)

    // Shirt placket buttons.
    for (let i = 0; i < 4; i++) {
      add('chest', <P s={S.sphere(0.008, 6, 4)} m={M.metal} line={false} p={[0, ch * (0.78 - i * 0.14), front + 0.008]} />)
    }

    // Brown leather belt + silver buckle.
    add('spine', <P s={S.box(pr.waistW * 1.22, 0.034, pr.chestD * 1.02, 0.01)} m={M.trim} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.box(0.044, 0.038, 0.018, 0.006)} m={M.metal} p={[0, pr.abdomen * 0.08, pr.chestD * 0.52]} />)

    // Messy rolled mid-forearm cuffs.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.036 * L, 0.055, 12)} m={M.primary} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.037 * L, 0.037 * L, 0.014, 12)} m={M.light} p={[0, -pr.forearm * 0.35, 0]} />)
    })

    // White high-tops with red ankle badge + sole trim.
    sides((s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.072 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.light} p={[0, -A + 0.012, FL * 0.32]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.055, FL + 0.02, 0.018)} m={M.white} p={[0, -A + 0.042, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.01, 0.014, 0.003)} m={M.light} line={false} p={[0, -A + 0.058, FL * 0.52]} />)
      add(foot, <P s={S.box(fw * 0.96, 0.012, FL + 0.04, 0.004)} m={M.accent} p={[0, -A + 0.006, FL * 0.28]} />)
      add(foot, <P s={S.cyl(0.016, 0.016, 0.01, 10)} m={M.accent} line={false} p={[s * fw * 0.42, -A + 0.048, FL * 0.05]} r={[0, 0, Math.PI / 2]} />)
    })
  }

  if (has('hakariSuit') || has('hakariJackpot')) {
    // Hakari — thin mustache + soul patch, hoop earrings, bulky puffer collar/pockets.
    const r = pr.headR
    const jackpot = has('hakariJackpot')
    const front = cd * 0.52

    // Thin mustache + soul patch.
    add('head', <P s={S.box(r * 0.42, r * 0.06, r * 0.1, r * 0.02)} m={M.hair} p={[0, -r * 0.36, r * 0.86]} r={[0.35, 0, 0]} />)
    sides((s) =>
      add(
        'head',
        <P
          s={S.box(r * 0.16, r * 0.05, r * 0.08, r * 0.018)}
          m={M.hair}
          p={[s * r * 0.22, -r * 0.35, r * 0.8]}
          r={[0.3, s * 0.35, s * 0.12]}
        />,
      ),
    )
    add('head', <P s={S.box(r * 0.1, r * 0.12, r * 0.08, r * 0.025)} m={M.hair} p={[0, -r * 0.52, r * 0.82]} r={[0.25, 0, 0]} />)

    // Small hoop earrings.
    sides((s) => {
      add(
        'head',
        <P
          s={S.torus(r * 0.09, r * 0.018, Math.PI * 2, 12)}
          m={M.metal}
          line={false}
          shadow={false}
          p={[s * r * 0.92, -r * 0.18, r * 0.12]}
          r={[0.2, 0, s * 0.35]}
        />,
      )
    })

    // High thick puffer collar + gold snap.
    add('chest', <P s={S.torus(0.072, 0.032, Math.PI * 2, 16)} m={M.primary} p={[0, ch * 1.0, -0.01]} r={[Math.PI / 2 + 0.15, 0, 0]} />)
    add('chest', <P s={S.torus(0.06, 0.02, Math.PI * 1.6, 14)} m={M.trim} p={[0, ch * 1.04, 0.01]} r={[Math.PI / 2 + 0.35, 0, 0]} />)
    add('chest', <P s={S.sphere(0.014, 8, 6)} m={M.metal} line={false} p={[0.02, ch * 0.92, front + 0.01]} />)

    // Horizontal puffer quilt ridges.
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.box(cw * 0.92, 0.014, 0.01, 0.004)}
          m={M.trim}
          line={false}
          p={[0, ch * (0.28 + i * 0.18), front + 0.006]}
        />,
      )
    }

    // Hand-warmer pouch pockets on the belly.
    sides((s) =>
      add(
        'spine',
        <P
          s={S.box(0.07, 0.08, 0.05, 0.018)}
          m={M.primary}
          p={[s * pr.waistW * 0.42, pr.abdomen * 0.35, pr.chestD * 0.48]}
          r={[0.15, 0, s * -0.2]}
        />,
      ),
    )
    add('spine', <P s={S.box(pr.waistW * 0.55, 0.07, 0.04, 0.014)} m={M.trim} p={[0, pr.abdomen * 0.32, pr.chestD * 0.5]} />)

    // Soft slip-on soles (khaki edge).
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.068 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.018, FL + 0.04, 0.008)} m={M.secondary} p={[0, -A + 0.008, FL * 0.28]} />)
      add(foot, <P s={S.box(fw * 0.92, 0.04, FL * 0.9, 0.014)} m={M.trim} p={[0, -A + 0.032, FL * 0.24]} />)
    })

    if (jackpot) {
      // Static golden-green luck rings + star glints on the body.
      add('chest', <P s={S.torus(cw * 0.62, 0.016, Math.PI * 1.6, 18)} m={M.glow} line={false} shadow={false} p={[0, ch * 0.55, -cd * 0.3]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      add('chest', <P s={S.torus(cw * 0.42, 0.01, Math.PI * 1.3, 14)} m={M.glowAlt} line={false} shadow={false} p={[0, ch * 0.7, -cd * 0.22]} r={[Math.PI / 2 + 0.15, 0, Math.PI]} />)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.018, 0.05, 0.008)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.55, ch * (0.35 + (i % 3) * 0.2), Math.sin(a) * cd * 0.35 - 0.04]}
            r={[0.4, a, 0.3]}
          />,
        )
      }
      // Soft invincibility shell halo.
      add('spine', <P s={S.torus(0.2, 0.012, Math.PI * 2, 20)} m={M.glow} line={false} shadow={false} p={[0, pr.abdomen * 0.5, 0]} r={[Math.PI / 2, 0, 0]} />)
    }
  }

  if (has('pochitaHell')) {
    // Hero of Hell — dark chitin armor, permanent chainsaw head, intestine scarf, extra arm pair.
    const r = pr.headR
    const front = cd * 0.55

    // Sleek eyeless helmet + forward forehead saw.
    add('head', <P s={S.sphere(r * 1.08, 14, 12)} m={M.primary} p={[0, r * 0.05, 0]} sc={[1.05, 0.95, 1.15]} />)
    add('head', <P s={S.box(r * 0.85, r * 0.45, r * 0.35, r * 0.08)} m={M.trim} p={[0, -r * 0.15, r * 0.85]} />)
    // Grill teeth.
    for (let i = 0; i < 5; i++) {
      add(
        'head',
        <P
          s={S.box(r * 0.08, r * 0.28, r * 0.06, r * 0.02)}
          m={M.light}
          line={false}
          p={[(i - 2) * r * 0.14, -r * 0.22, r * 1.05]}
        />,
      )
    }
    // Forehead chainsaw blade.
    add('head', <P s={S.box(r * 0.12, r * 0.55, r * 1.6, r * 0.04)} m={M.metal} p={[0, r * 0.15, r * 1.55]} r={[0.15, 0, 0]} />)
    for (let i = 0; i < 7; i++) {
      add(
        'head',
        <P
          s={S.cone(r * 0.045, r * 0.1, 4)}
          m={M.trim}
          line={false}
          p={[0, r * (0.4 - i * 0.08), r * (1.05 + i * 0.14)]}
          r={[Math.PI * 0.5, 0, i % 2 ? 0.4 : -0.4]}
        />,
      )
    }
    // Top starter handle.
    add('head', <P s={S.box(r * 0.55, r * 0.12, r * 0.16, r * 0.04)} m={M.trim} p={[0, r * 0.95, -r * 0.1]} />)
    add('head', <P s={S.cyl(r * 0.06, r * 0.06, r * 0.35, 8)} m={M.trim} p={[0, r * 0.7, -r * 0.15]} />)

    // Cross-hatched chest armor plates + spikes.
    add('chest', <P s={S.box(cw * 1.08, ch * 0.95, cd * 1.1, 0.02)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.55, 0.04, 0.012)} m={M.secondary} p={[0, ch * 0.5, front]} />)
    sides((s) => {
      add('chest', <P s={S.shard(0.05 * L, 0.09 * L, 0.035)} m={M.trim} p={[s * cw * 0.42, ch * 0.55, front * 0.6]} r={[0.3, s * 0.4, s * 0.5]} />)
      add('chest', <P s={S.cone(0.03 * L, 0.07 * L, 4)} m={M.trim} line={false} p={[s * cw * 0.48, ch * 0.72, -cd * 0.2]} r={[-0.8, 0, s * 0.4]} />)
    })

    // Thick red intestine scarf — collar + cape trail.
    add('neck', <P s={S.torus(0.055 * Math.sqrt(L), 0.028, Math.PI * 2, 14)} m={M.accent} p={[0, 0.01, 0]} r={[Math.PI / 2 - 0.1, 0, 0]} />)
    add('neck', <P s={S.torus(0.05 * Math.sqrt(L), 0.022, Math.PI * 2, 14)} m={M.glow} line={false} p={[0, 0.03, 0.005]} r={[Math.PI / 2 + 0.15, 0, 0]} />)
    add('cape', <P s={S.panel(0.08, 0.55, 0.03, 0.02)} m={M.accent} p={[0.04, -0.22, -0.02]} r={[0.35, 0, -0.12]} />)
    add('cape', <P s={S.panel(0.06, 0.4, 0.025, 0.015)} m={M.glow} line={false} p={[-0.03, -0.16, -0.03]} r={[0.45, 0, 0.18]} />)
    add('cape', <P s={S.sphere(0.035, 8, 6)} m={M.accent} line={false} p={[0.08, -0.48, -0.08]} />)

    // Forearm chainsaw blades (primary arms).
    sides((s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.box(0.04 * L, 0.12 * L, 0.28 * L, 0.012)} m={M.metal} p={[s * 0.04 * L, -pr.forearm * 0.45, 0.02]} r={[0.15, s * 0.2, 0]} />)
      for (let i = 0; i < 5; i++) {
        add(
          fore,
          <P
            s={S.cone(0.012 * L, 0.028 * L, 4)}
            m={M.trim}
            line={false}
            p={[s * 0.05 * L, -pr.forearm * (0.25 + i * 0.1), 0.12 * L]}
            r={[Math.PI * 0.5, 0, s * (i % 2 ? 0.5 : -0.5)]}
          />,
        )
      }
      // Elbow spike.
      add(`${l}Upper` as BoneName, <P s={S.cone(0.025 * L, 0.06 * L, 4)} m={M.trim} line={false} p={[s * 0.02, -pr.upperArm * 0.95, -0.02]} r={[Math.PI * 0.85, 0, 0]} />)
    })

    // Extra upper arm pair (static second set) with blades — four-armed silhouette.
    sides((s) => {
      const ox = s * cw * 0.62
      const oy = ch * 0.78
      const oz = -cd * 0.15
      add('chest', <P s={S.limb(0.038 * L, 0.032 * L, 0.16 * L)} m={M.primary} p={[ox, oy, oz]} r={[0.55, 0, s * 0.85]} />)
      add('chest', <P s={S.limb(0.032 * L, 0.028 * L, 0.14 * L)} m={M.primary} p={[ox + s * 0.08 * L, oy - 0.12 * L, oz + 0.06 * L]} r={[1.1, 0, s * 0.55]} />)
      add('chest', <P s={S.box(0.035 * L, 0.1 * L, 0.22 * L, 0.01)} m={M.metal} p={[ox + s * 0.1 * L, oy - 0.2 * L, oz + 0.12 * L]} r={[0.9, s * 0.3, 0]} />)
      // Glitch spark accents at blade roots.
      add('chest', <P s={S.sphere(0.02 * L, 6, 4)} m={M.glow} line={false} shadow={false} p={[ox + s * 0.06 * L, oy - 0.14 * L, oz + 0.08 * L]} />)
    })

    // Knee / shin armor spikes.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cone(0.028 * L, 0.06 * L, 4)} m={M.trim} line={false} p={[0, -pr.shin * 0.15, 0.04]} r={[Math.PI * 0.9, 0, 0]} />)
      add(shin, <P s={S.box(0.07 * L, pr.shin * 0.45, 0.06 * L, 0.014)} m={M.secondary} p={[0, -pr.shin * 0.4, 0.01]} />)
    })
  }

  if (has('killuaSuit')) {
    // Killua — lavender short-sleeve tee over navy turtleneck, grey shorts, maroon boots; blue arcs.
    const front = cd * 0.55

    // Navy turtleneck collar + long sleeves under the tee.
    add('chest', <P s={S.box(cw * 0.48, ch * 0.22, cd * 0.5, 0.018)} m={M.secondary} p={[0, ch * 0.98, -cd * 0.02]} />)
    add('neck', <P s={S.cyl(0.042 * L, 0.048 * L, 0.055, 12)} m={M.secondary} p={[0, 0.01, 0]} />)
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.cyl(0.042 * L, 0.046 * L, pr.upperArm * 0.95, 12)} m={M.secondary} p={[0, -pr.upperArm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.034 * L, 0.036 * L, pr.forearm * 0.9, 12)} m={M.secondary} p={[0, -pr.forearm * 0.42, 0]} />)
    })

    // Lavender V-neck short-sleeve shell.
    add('chest', <P s={S.box(cw * 1.02, ch * 0.72, cd * 1.04, 0.018)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.box(cw * 0.22, ch * 0.28, 0.014, 0.006)} m={M.secondary} p={[0, ch * 0.72, front]} />)
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.cyl(0.05 * L, 0.054 * L, 0.07, 12)} m={M.primary} p={[0, -pr.upperArm * 0.42, 0]} />)
      add(up, <P s={S.cyl(0.056 * L, 0.056 * L, 0.014, 12)} m={M.trim} p={[0, -pr.upperArm * 0.28, 0]} />)
    })

    // Bluish-grey knee shorts over bare legs.
    sides((_s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.cyl(0.056 * L, 0.05 * L, pr.thigh * 0.48, 12)} m={M.metal} p={[0, -pr.thigh * 0.2, 0]} />)
      add(thigh, <P s={S.cyl(0.052 * L, 0.052 * L, 0.014, 12)} m={M.trim} p={[0, -pr.thigh * 0.42, 0]} />)
    })

    // Maroon lace-up boots with thick grey soles.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.07 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.038 * L, 0.044 * L, pr.shin * 0.42, 12)} m={M.trim} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.04 * L, 0.04 * L, 0.016, 12)} m={M.metal} p={[0, -pr.shin * 0.55, 0]} />)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.045, 0.01)} m={M.metal} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.016)} m={M.trim} p={[0, -A + 0.04, FL * 0.26]} />)
      add(foot, <P s={S.box(fw * 0.35, 0.01, FL * 0.5, 0.004)} m={M.metal} p={[0, -A + 0.055, FL * 0.35]} />)
    })

    // Live blue Godspeed arcs on shoulders / hands / hairline.
    const arcs: [BoneName, number, number, number, number, number, number][] = [
      ['rUpper', -0.04 * L, -pr.upperArm * 0.2, 0.04 * L, 0.012, 0.06, -0.85],
      ['lUpper', 0.04 * L, -pr.upperArm * 0.28, 0.035 * L, 0.01, 0.055, 0.8],
      ['chest', -cw * 0.32, ch * 0.7, cd * 0.52, 0.012, 0.05, 1.0],
      ['chest', cw * 0.28, ch * 0.62, cd * 0.5, 0.01, 0.045, -0.85],
      ['rHand', -0.01 * L, -pr.hand * 1.2, 0.02 * L, 0.008, 0.03, 0.7],
      ['lHand', 0.01 * L, -pr.hand * 1.2, 0.02 * L, 0.008, 0.03, -0.65],
      ['head', -0.03, pr.headR * 0.55, pr.headR * 0.55, 0.01, 0.04, 0.9],
      ['head', 0.04, pr.headR * 0.4, pr.headR * 0.5, 0.008, 0.035, -0.7],
    ]
    arcs.forEach(([b, x, y, z, w, h, rot], i) => {
      add(b, <P s={S.shard(w, h, 0.005)} m={i % 2 ? M.glow : M.glowAlt} line={false} shadow={false} p={[x, y, z]} r={[0.2, 0.15, rot]} />)
      add(b, <P s={S.shard(w * 0.5, h * 0.5, 0.004)} m={M.glowAlt} line={false} shadow={false} p={[x + 0.008, y - h * 0.25, z + 0.004]} r={[-0.2, -0.15, rot + 0.9]} />)
    })
  }

  if (has('kanekiSuit')) {
    // Kaneki — black tactical jacket over long sleeves, knee shorts, white stripe sneakers.
    const front = cd * 0.55
    const r = pr.headR

    // High collar + twin studs.
    add('chest', <P s={S.box(cw * 0.55, ch * 0.18, cd * 0.55, 0.02)} m={M.primary} p={[0, ch * 0.95, -cd * 0.05]} />)
    sides((s) => {
      add('chest', <P s={S.cyl(0.014, 0.014, 0.012, 10)} m={M.metal} p={[s * cw * 0.12, ch * 0.98, front * 0.55]} r={[Math.PI / 2, 0, 0]} />)
    })

    // Short-sleeve vest shell + rib straps across the chest.
    add('chest', <P s={S.box(cw * 1.05, ch * 0.55, cd * 1.08, 0.02)} m={M.primary} p={[0, ch * 0.55, 0]} />)
    for (let i = 0; i < 4; i++) {
      add(
        'chest',
        <P
          s={S.box(cw * 0.9, 0.012, 0.014, 0.004)}
          m={M.secondary}
          line={false}
          p={[0, ch * (0.72 - i * 0.1), front]}
          r={[0, 0, (i % 2 ? 1 : -1) * 0.04]}
        />,
      )
    }
    // Open sleeve hems on the upper arms.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.cyl(0.048 * L, 0.052 * L, 0.06, 12)} m={M.primary} p={[0, -pr.upperArm * 0.55, 0]} />)
      add(up, <P s={S.cyl(0.054 * L, 0.054 * L, 0.016, 12)} m={M.trim} p={[0, -pr.upperArm * 0.42, 0]} />)
    })
    // Twin white sleeve stripes on the forearms.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.036 * L, 0.038 * L, 0.018, 12)} m={M.accent} p={[0, -pr.forearm * 0.35, 0]} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.038 * L, 0.018, 12)} m={M.accent} p={[0, -pr.forearm * 0.48, 0]} />)
    })

    // Knee-length black shorts over the tights.
    sides((_s, l) => {
      const thigh = `${l}Thigh` as BoneName
      add(thigh, <P s={S.cyl(0.055 * L, 0.05 * L, pr.thigh * 0.55, 12)} m={M.primary} p={[0, -pr.thigh * 0.22, 0]} />)
      add(thigh, <P s={S.cyl(0.052 * L, 0.052 * L, 0.016, 12)} m={M.trim} p={[0, -pr.thigh * 0.48, 0]} />)
    })

    // Black slip-ons with white ankle stripes.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.07 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.036 * L, 0.04 * L, 0.02, 12)} m={M.accent} p={[0, -pr.shin * 0.92, 0]} />)
      add(shin, <P s={S.cyl(0.036 * L, 0.04 * L, 0.016, 12)} m={M.accent} p={[0, -pr.shin * 0.82, 0]} />)
      add(foot, <P s={S.box(fw, 0.022, FL + 0.04, 0.01)} m={M.trim} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.048, FL + 0.02, 0.016)} m={M.primary} p={[0, -A + 0.038, FL * 0.26]} />)
    })

    // Leather eyepatch over the right eye (normal form only).
    if (!has('kanekiMask')) {
      add('head', <P s={S.box(r * 0.42, r * 0.28, r * 0.1, r * 0.06)} m={M.trim} p={[r * 0.34, r * 0.08, r * 0.72]} r={[0, 0.25, 0.08]} />)
      add('head', <P s={S.box(r * 0.08, r * 0.04, r * 0.7, r * 0.02)} m={M.trim} line={false} p={[0, r * 0.22, 0]} r={[0.15, 0, 0.05]} />)
      add('head', <P s={S.box(r * 0.06, r * 0.04, r * 0.55, r * 0.02)} m={M.trim} line={false} p={[r * 0.55, r * 0.05, -r * 0.15]} r={[0, 0.9, 0]} />)
    }
  }

  if (has('kanekiMask')) {
    // Centipede ghoul mask — black leather, zipper teeth, left kakugan exposed.
    const r = pr.headR
    const ey = r * 0.08

    // Lower-face shell covering mouth + right cheek/eye.
    add('head', <P s={S.sphere(r * 0.92, 16, 12)} m={M.trim} p={[0, -r * 0.18, r * 0.28]} sc={[0.98, 1.05, 0.82]} />)
    add('head', <P s={S.box(r * 0.7, r * 0.55, r * 0.35, r * 0.1)} m={M.trim} p={[r * 0.28, ey, r * 0.55]} />)
    // Zipper mouth with bared teeth / gums.
    add('head', <P s={S.torus(r * 0.32, r * 0.055, Math.PI * 1.15, 16)} m={M.glow} line={false} p={[0, -r * 0.28, r * 0.95]} r={[0.35, 0, Math.PI]} />)
    for (let i = -3; i <= 3; i++) {
      add(
        'head',
        <P
          s={S.box(r * 0.035, r * 0.14, r * 0.04, r * 0.012)}
          m={M.light}
          line={false}
          p={[i * r * 0.09, -r * 0.42 + Math.abs(i) * r * 0.02, r * 0.98]}
        />,
      )
      add(
        'head',
        <P
          s={S.box(r * 0.028, r * 0.08, r * 0.03, r * 0.01)}
          m={M.light}
          line={false}
          p={[i * r * 0.09, -r * 0.18 - Math.abs(i) * r * 0.015, r * 0.96]}
        />,
      )
    }
    // Zipper track + pull.
    add('head', <P s={S.box(r * 0.04, r * 0.55, r * 0.03, r * 0.012)} m={M.metal} p={[0, -r * 0.05, r * 1.02]} />)
    add('head', <P s={S.box(r * 0.08, r * 0.06, r * 0.05, r * 0.02)} m={M.metal} p={[0, r * 0.18, r * 1.05]} />)
    // Left kakugan — black sclera, crimson iris.
    {
      const x = -r * 0.34
      const y = ey
      const a = x / (0.96 * r)
      const b = y / r
      const z = 0.98 * r * Math.sqrt(Math.max(0, 1 - a * a - b * b))
      add('head', <P s={S.sphere(r * 0.13, 10, 8)} m={M.ink} line={false} p={[x, y, z + r * 0.02]} sc={[1, 0.85, 0.55]} />)
      add('head', <P s={S.sphere(r * 0.07, 8, 6)} m={M.glow} line={false} shadow={false} p={[x, y, z + r * 0.06]} sc={[1, 0.85, 0.5]} />)
      add('head', <P s={S.sphere(r * 0.03, 6, 4)} m={M.ink} line={false} p={[x, y, z + r * 0.09]} />)
    }
    // Leather straps around the skull.
    add('head', <P s={S.torus(r * 0.95, r * 0.035, Math.PI * 1.4, 16)} m={M.trim} p={[0, r * 0.05, -r * 0.05]} r={[Math.PI / 2, 0, Math.PI * 0.15]} />)
    sides((s) => {
      add('head', <P s={S.box(r * 0.08, r * 0.04, r * 0.5, r * 0.02)} m={M.trim} line={false} p={[s * r * 0.7, r * 0.15, -r * 0.1]} r={[0.1, s * 0.4, 0]} />)
    })
  }

  if (has('rinkaku')) {
    // Four crimson rinkaku kagune — thick scaled tails from the lower back.
    const roots: { bone: BoneName; p: [number, number, number]; bend: [number, number, number] }[] = [
      { bone: 'wingL', p: [0.04, 0.02, -0.02], bend: [0.35, 0.55, -0.85] },
      { bone: 'wingR', p: [-0.04, 0.02, -0.02], bend: [0.35, -0.55, 0.85] },
      { bone: 'cape', p: [0.05, -0.08, -0.02], bend: [0.75, 0.35, -0.45] },
      { bone: 'tails', p: [-0.04, -0.02, -0.01], bend: [0.85, -0.3, 0.4] },
    ]
    for (const root of roots) {
      const [bx, by, bz] = root.bend
      // Muscular base.
      add(root.bone, <P s={S.limb(0.045 * L, 0.038 * L, 0.22 * L)} m={M.glow} p={root.p} r={root.bend} />)
      // Mid segment.
      add(
        root.bone,
        <P
          s={S.limb(0.036 * L, 0.028 * L, 0.28 * L)}
          m={M.glow}
          p={[root.p[0] + bx * 0.12 * L, root.p[1] + by * 0.05 * L - 0.08 * L, root.p[2] - 0.14 * L]}
          r={[bx + 0.35, by * 0.7, bz * 0.6]}
        />,
      )
      // Tip — blade-like point.
      add(
        root.bone,
        <P
          s={S.shard(0.04 * L, 0.22 * L, 0.03 * L)}
          m={M.glow}
          p={[root.p[0] + bx * 0.18 * L, root.p[1] + by * 0.08 * L - 0.22 * L, root.p[2] - 0.32 * L]}
          r={[bx + 0.7, by * 0.5, bz * 0.4]}
        />,
      )
      // Scale diamond accents along the length.
      for (let i = 0; i < 5; i++) {
        const t = (i + 1) / 6
        add(
          root.bone,
          <P
            s={S.shard(0.022 * L, 0.04 * L, 0.012 * L)}
            m={i % 2 ? M.glow : M.trim}
            line={false}
            p={[
              root.p[0] + bx * t * 0.16 * L,
              root.p[1] - t * 0.2 * L + by * t * 0.06 * L,
              root.p[2] - t * 0.3 * L,
            ]}
            r={[0.4 + t, by * 0.3, bz * 0.2]}
          />,
        )
      }
    }
  }

  if (has('moriSuit')) {
    // Jin Mori normal — white tee accents, navy jacket tied at the waist, red high-tops, black wristband.
    const r = pr.headR

    // Soft tee collar + short sleeve cuffs.
    add('chest', <P s={S.torus(0.055 * Math.sqrt(L), 0.016, Math.PI * 1.7, 14)} m={M.light} p={[0, ch * 0.98, 0.005]} r={[Math.PI / 2 + 0.2, 0, 0]} />)
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      add(up, <P s={S.cyl(0.038 * L, 0.04 * L, 0.05, 12)} m={M.primary} p={[0, -pr.upperArm * 0.55, 0]} />)
      add(up, <P s={S.cyl(0.042 * L, 0.042 * L, 0.014, 12)} m={M.light} p={[0, -pr.upperArm * 0.42, 0]} />)
    })

    // Jacket tied around the waist — sleeves dangling.
    add('spine', <P s={S.box(pr.waistW * 1.35, 0.07, pr.chestD * 1.15, 0.02)} m={M.trim} p={[0, pr.abdomen * 0.05, 0]} />)
    add('spine', <P s={S.box(0.04, 0.045, 0.02, 0.008)} m={M.metal} p={[0, pr.abdomen * 0.05, pr.chestD * 0.58]} />)
    sides((s) => {
      add('pelvis', <P s={S.panel(0.07, 0.28, 0.03, 0.012)} m={M.trim} p={[s * pr.pelvisW * 0.55, -0.08, 0.02]} r={[0.35, s * 0.25, s * 0.55]} />)
      add('pelvis', <P s={S.cyl(0.032 * L, 0.028 * L, 0.16, 10)} m={M.trim} p={[s * pr.pelvisW * 0.62, -0.2, -0.02]} r={[0.9, s * 0.2, s * 0.35]} />)
    })

    // Black left wristband.
    add('lFore', <P s={S.cyl(0.032 * L, 0.034 * L, 0.04, 12)} m={M.trim} p={[0, -pr.forearm * 0.78, 0]} />)

    // Green oval goggles bridge (extra goggles also adds lenses).
    add('head', <P s={S.box(r * 0.12, r * 0.06, r * 0.04, r * 0.015)} m={M.metal} line={false} p={[0, r * 0.58, r * 0.55]} />)

    // Red high-tops with yellow/gold trim + white laces.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.074 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.42, 12)} m={M.accent} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.048 * L, 0.018, 12)} m={M.glow} p={[0, -pr.shin * 0.52, 0]} />)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.055, FL + 0.02, 0.018)} m={M.accent} p={[0, -A + 0.042, FL * 0.26]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.01, 0.014, 0.003)} m={M.light} line={false} p={[0, -A + 0.058, FL * 0.5]} />)
      add(foot, <P s={S.box(fw * 0.5, 0.008, FL * 0.55, 0.003)} m={M.light} line={false} p={[0, -A + 0.05, FL * 0.22]} />)
      add(foot, <P s={S.box(fw * 0.96, 0.012, FL + 0.04, 0.004)} m={M.glow} p={[0, -A + 0.006, FL * 0.28]} />)
    })
  }

  if (has('silverSurferSuit')) {
    // Silver Surfer — sleek chrome surfboard under the feet (rides with pelvis).
    const board = M.metal
    const edge = M.accent
    const glow = M.glow
    add('pelvis', <P s={S.box(0.16, 0.028, 0.62, 0.012)} m={board} p={[0, -0.3, 0.02]} r={[0.08, 0, 0]} />)
    add('pelvis', <P s={S.box(0.14, 0.016, 0.56, 0.008)} m={edge} line={false} p={[0, -0.288, 0.02]} r={[0.08, 0, 0]} />)
    // Rounded nose / tail tips.
    add('pelvis', <P s={S.sphere(0.07, 12, 10)} m={board} p={[0, -0.295, 0.32]} sc={[1.05, 0.35, 0.9]} r={[0.08, 0, 0]} />)
    add('pelvis', <P s={S.sphere(0.065, 12, 10)} m={board} p={[0, -0.305, -0.28]} sc={[1.0, 0.32, 0.85]} r={[0.08, 0, 0]} />)
    // Soft cosmic trail under the board.
    add('pelvis', <P s={S.box(0.1, 0.01, 0.4, 0.004)} m={glow} line={false} shadow={false} p={[0, -0.318, -0.06]} r={[0.08, 0, 0]} />)
  }

  if (has('zoroSuit')) {
    // Wano Zoro — open white kimono, dark green haori, purple obi, chest scar, triple earrings.
    const front = cd * 0.52
    const r = pr.headR

    // Three gold drop earrings on the left ear.
    for (let i = 0; i < 3; i++) {
      add(
        'head',
        <P
          s={S.sphere(r * 0.055, 8, 6)}
          m={M.metal}
          line={false}
          p={[-r * 0.92, -r * (0.05 + i * 0.14), r * 0.12]}
        />,
      )
      add(
        'head',
        <P
          s={S.cyl(r * 0.012, r * 0.012, r * 0.08, 6)}
          m={M.metal}
          line={false}
          p={[-r * 0.92, -r * (0.0 + i * 0.14), r * 0.12]}
        />,
      )
    }

    // Diagonal stitched chest scar (collarbone → hip).
    for (let i = 0; i < 6; i++) {
      const t = i / 5
      add(
        'chest',
        <P
          s={S.box(0.012, 0.028, 0.008, 0.004)}
          m={M.mouth}
          line={false}
          p={[-cw * 0.22 + t * cw * 0.48, ch * (0.85 - t * 0.7), front * 0.55]}
          r={[0, 0, -0.55]}
        />,
      )
    }

    // Open kimono panels — white with dark collar trim.
    add('chest', <P s={S.box(cw * 0.38, ch * 0.95, 0.035, 0.012)} m={M.primary} p={[-cw * 0.32, ch * 0.42, front * 0.85]} r={[0, 0.2, -0.08]} />)
    add('chest', <P s={S.box(cw * 0.38, ch * 0.95, 0.035, 0.012)} m={M.primary} p={[cw * 0.32, ch * 0.42, front * 0.85]} r={[0, -0.2, 0.08]} />)
    add('chest', <P s={S.box(0.022, ch * 0.9, 0.012, 0.006)} m={M.trim} p={[-cw * 0.14, ch * 0.45, front + 0.01]} r={[0, 0, -0.45]} />)
    add('chest', <P s={S.box(0.022, ch * 0.9, 0.012, 0.006)} m={M.trim} p={[cw * 0.14, ch * 0.45, front + 0.01]} r={[0, 0, 0.45]} />)

    // Purple obi — thick wrap + knot at the back.
    add('spine', <P s={S.box(pr.waistW * 1.25, pr.abdomen * 0.7, pr.chestD * 1.05, 0.014)} m={M.accent} p={[0, pr.abdomen * 0.28, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.012, pr.chestD * 1.08, 0.004)} m={M.trim} line={false} p={[0, pr.abdomen * 0.28, 0]} />)
    add('spine', <P s={S.box(0.08, 0.06, 0.05, 0.016)} m={M.accent} p={[0, pr.abdomen * 0.35, -pr.chestD * 0.55]} />)
    sides((s) =>
      add('spine', <P s={S.panel(0.055, 0.05, 0.014)} m={M.accent} p={[s * 0.04, pr.abdomen * 0.4, -pr.chestD * 0.52]} r={[0, 0, s * 0.4]} />),
    )

    // Dark green haori draped over the shoulders (cape bone).
    {
      const len = pr.hipH * 1.15 + ch * 0.85 + pr.thigh * 0.45
      const w = cw * 1.35
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.2)} m={M.secondary} p={[0, -len / 2 + 0.02, -0.03]} r={[0.08, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.92, len * 0.95, 0.01, -w * 0.18)} m={M.trim} line={false} p={[0, -len / 2 + 0.03, -0.016]} r={[0.08, 0, 0]} />)
      // Circular Wano crest on the back.
      add('cape', <P s={S.cyl(0.07, 0.07, 0.012, 16)} m={M.trim} line={false} p={[0, -len * 0.22, -0.04]} r={[Math.PI / 2, 0, 0]} />)
      add('cape', <P s={S.cyl(0.045, 0.045, 0.01, 12)} m={M.secondary} line={false} p={[0, -len * 0.22, -0.045]} r={[Math.PI / 2, 0, 0]} />)
      sides((s) => {
        add(
          'cape',
          <P
            s={S.panel(w * 0.28, len * 0.75, 0.018, -0.04)}
            m={M.secondary}
            p={[s * w * 0.38, -len * 0.28, 0.02]}
            r={[0.12, s * 0.55, s * 0.06]}
          />,
        )
      })
      add('chest', <P s={S.torus(cw * 0.44, 0.022, Math.PI, 14)} m={M.secondary} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
    }

    // Wide dark hakama legs already from bottom; reinforce black boots.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.07 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.038 * L, 0.042 * L, pr.shin * 0.4, 10)} m={M.trim} p={[0, -pr.shin * 0.7, 0]} />)
      add(foot, <P s={S.box(fw, 0.028, FL + 0.04, 0.01)} m={M.trim} p={[0, -A + 0.014, FL * 0.28]} />)
    })
  }

  if (has('moriKing')) {
    // Monkey King — open dark jacket, bandage torso, tiger sash, circlet, Geindun cloud, red boots.
    const front = cd * 0.52
    const r = pr.headR

    // Loop of Binding — white winged circlet.
    add('head', <P s={S.torus(r * 0.95, r * 0.055, Math.PI * 2, 20)} m={M.light} p={[0, r * 0.55, -r * 0.05]} r={[Math.PI / 2 + 0.2, 0, 0]} />)
    sides((s) => {
      add('head', <P s={S.panel(r * 0.18, r * 0.22, r * 0.04, r * 0.02)} m={M.light} p={[s * r * 0.85, r * 0.62, r * 0.05]} r={[0.2, s * 0.4, s * -0.55]} />)
      add('head', <P s={S.shard(r * 0.08, r * 0.16, r * 0.03)} m={M.glow} line={false} p={[s * r * 0.95, r * 0.7, r * 0.02]} r={[0.3, s * 0.5, s * -0.4]} />)
    })

    // Open cropped jacket with gold trim + bandage torso wrap.
    add('chest', <P s={S.box(cw * 0.42, ch * 0.72, 0.04, 0.014)} m={M.primary} p={[-cw * 0.28, ch * 0.42, front]} r={[0, 0.15, -0.08]} />)
    add('chest', <P s={S.box(cw * 0.42, ch * 0.72, 0.04, 0.014)} m={M.primary} p={[cw * 0.28, ch * 0.42, front]} r={[0, -0.15, 0.08]} />)
    add('chest', <P s={S.box(0.012, ch * 0.7, 0.01, 0.004)} m={M.glow} line={false} p={[-cw * 0.1, ch * 0.42, front + 0.02]} />)
    add('chest', <P s={S.box(0.012, ch * 0.7, 0.01, 0.004)} m={M.glow} line={false} p={[cw * 0.1, ch * 0.42, front + 0.02]} />)
    for (let i = 0; i < 5; i++) {
      add(
        'chest',
        <P
          s={S.box(cw * 0.55, 0.018, 0.02, 0.006)}
          m={i % 2 ? M.trim : M.accent}
          p={[0, ch * (0.72 - i * 0.12), front * 0.35]}
        />,
      )
    }
    // High collar.
    add('chest', <P s={S.cyl(0.055 * Math.sqrt(L), 0.05 * Math.sqrt(L), 0.06, 12, true)} m={M.primary} p={[0, ch * 1.0, -0.01]} />)

    // Tiger-skin waist cloth + red sash.
    add('spine', <P s={S.box(pr.waistW * 1.4, 0.09, pr.chestD * 1.2, 0.024)} m={M.glow} p={[0, pr.abdomen * 0.08, 0]} />)
    add('spine', <P s={S.box(pr.waistW * 1.35, 0.04, pr.chestD * 1.15, 0.012)} m={M.trim} p={[0, pr.abdomen * 0.02, 0]} />)
    for (let i = 0; i < 6; i++) {
      add(
        'spine',
        <P
          s={S.box(0.04, 0.07, 0.012, 0.004)}
          m={M.trim}
          line={false}
          p={[(i - 2.5) * 0.045, pr.abdomen * 0.08, pr.chestD * 0.62]}
        />,
      )
    }
    add('cape', <P s={S.panel(0.06, 0.38, 0.016, 0.01)} m={M.accent} p={[0.04, -0.12, -0.01]} r={[0.35, 0, -0.1]} />)
    add('cape', <P s={S.panel(0.05, 0.3, 0.014, 0.008)} m={M.accent} p={[-0.03, -0.08, -0.02]} r={[0.45, 0, 0.12]} />)

    // Beaded prayer bracelets.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      for (let i = 0; i < 4; i++) {
        add(fore, <P s={S.sphere(0.012 * L, 8, 6)} m={i % 2 ? M.glow : M.metal} line={false} p={[0, -pr.forearm * (0.7 + i * 0.04), 0.028 * L]} />)
      }
    })

    // Dark boots with white toe.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const shin = `${l}Shin` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.072 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.48, 12)} m={M.trim} p={[0, -pr.shin * 0.68, 0]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.048 * L, 0.016, 12)} m={M.light} p={[0, -pr.shin * 0.45, 0]} />)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.016)} m={M.trim} p={[0, -A + 0.04, FL * 0.26]} />)
      add(foot, <P s={S.box(fw * 0.7, 0.03, FL * 0.35, 0.01)} m={M.light} p={[0, -A + 0.035, FL * 0.55]} />)
    })

    // Geindun — fluffy cloud under the feet.
    add('pelvis', <P s={S.sphere(0.14, 12, 10)} m={M.light} line={false} p={[0, -0.28, 0.02]} sc={[1.6, 0.55, 1.15]} />)
    add('pelvis', <P s={S.sphere(0.1, 10, 8)} m={M.white} line={false} p={[0.1, -0.26, -0.04]} sc={[1.2, 0.5, 1.0]} />)
    add('pelvis', <P s={S.sphere(0.09, 10, 8)} m={M.white} line={false} p={[-0.1, -0.27, 0.04]} sc={[1.15, 0.48, 0.95]} />)
    add('pelvis', <P s={S.sphere(0.06, 8, 6)} m={M.glow} line={false} shadow={false} p={[0, -0.22, 0]} sc={[1.3, 0.4, 1.0]} />)
  }

  if (has('arthurSuit') || has('arthurAwaken')) {
    // Arthur Boyle — Special Fire Force Co. 8 bunker coat, neon cyan stripes, gear-8 patch.
    const front = cd * 0.55
    const awaken = has('arthurAwaken')
    const stripe = awaken ? M.glow : M.accent
    const stripeAlt = awaken ? M.glowAlt : M.glow

    // Brown hood shell + thick bunker collar.
    add('chest', <P s={S.torus(0.078, 0.038, Math.PI * 2, 16)} m={M.trim} p={[0, ch * 1.02, -0.02]} r={[Math.PI / 2 + 0.2, 0, 0]} />)
    add('chest', <P s={S.torus(0.062, 0.022, Math.PI * 1.7, 14)} m={M.primary} p={[0, ch * 1.05, 0.01]} r={[Math.PI / 2 + 0.4, 0, 0]} />)
    add('chest', <P s={S.panel(0.14, 0.1, 0.04, 0.02)} m={M.trim} p={[0, ch * 1.08, -cd * 0.35]} r={[0.55, 0, 0]} />)

    // Perforated metal neck guard.
    add('neck', <P s={S.cyl(0.052 * Math.sqrt(L), 0.058 * Math.sqrt(L), pr.neck * 0.85, 14)} m={M.metal} p={[0, pr.neck * 0.25, 0.005]} />)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      add(
        'neck',
        <P
          s={S.sphere(0.006, 6, 4)}
          m={M.dark}
          line={false}
          p={[Math.cos(a) * 0.048 * Math.sqrt(L), pr.neck * 0.3, Math.sin(a) * 0.048 * Math.sqrt(L)]}
        />,
      )
    }

    // Twin neon cyan reflective bands across the torso.
    add('chest', <P s={S.box(cw * 1.02, 0.028, 0.018, 0.006)} m={stripe} line={false} p={[0, ch * 0.72, front]} />)
    add('chest', <P s={S.box(cw * 1.02, 0.028, 0.018, 0.006)} m={stripe} line={false} p={[0, ch * 0.52, front]} />)
    add('chest', <P s={S.box(cw * 0.95, 0.012, 0.01, 0.003)} m={stripeAlt} line={false} p={[0, ch * 0.72, front + 0.006]} />)
    add('chest', <P s={S.box(cw * 0.95, 0.012, 0.01, 0.003)} m={stripeAlt} line={false} p={[0, ch * 0.52, front + 0.006]} />)

    // Side clasps + zipper rail.
    add('chest', <P s={S.box(0.012, ch * 0.85, 0.01, 0.004)} m={M.metal} line={false} p={[0, ch * 0.48, front + 0.004]} />)
    sides((s) => {
      for (let i = 0; i < 3; i++) {
        add(
          'chest',
          <P
            s={S.box(0.028, 0.02, 0.016, 0.006)}
            m={M.metal}
            p={[s * cw * 0.42, ch * (0.78 - i * 0.16), front * 0.35]}
            r={[0, s * 0.4, 0]}
          />,
        )
      }
    })

    // Company 8 gear patch on the left shoulder.
    {
      const sx = -cw * 0.48
      const sy = ch * 0.85
      const sz = cd * 0.15
      add('chest', <P s={S.cyl(0.042, 0.042, 0.014, 12)} m={M.metal} p={[sx, sy, sz]} r={[0, 0, Math.PI / 2]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.box(0.012, 0.022, 0.008, 0.003)}
            m={M.metal}
            p={[sx + Math.cos(a) * 0.048, sy + Math.sin(a) * 0.048, sz]}
            r={[0, 0, a]}
          />,
        )
      }
      add('chest', <P s={S.box(0.018, 0.028, 0.008, 0.003)} m={M.light} line={false} p={[sx, sy, sz + 0.01]} />)
      add('chest', <P s={S.box(0.028, 0.01, 0.008, 0.003)} m={M.light} line={false} p={[sx, sy - 0.004, sz + 0.01]} />)
    }

    // Neon arm stripes on the bunker sleeves.
    sides((_s, l) => {
      const up = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      add(up, <P s={S.cyl(0.048 * L, 0.05 * L, 0.022, 12)} m={stripe} p={[0, -pr.upperArm * 0.45, 0]} />)
      add(up, <P s={S.cyl(0.048 * L, 0.05 * L, 0.022, 12)} m={stripe} p={[0, -pr.upperArm * 0.62, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.042 * L, 0.02, 12)} m={stripe} p={[0, -pr.forearm * 0.4, 0]} />)
      add(fore, <P s={S.cyl(0.042 * L, 0.044 * L, 0.016, 12)} m={M.trim} p={[0, -pr.forearm * 0.85, 0]} />)
    })

    // Baggy bunker trousers — neon shin bands.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      add(shin, <P s={S.cyl(0.05 * L, 0.052 * L, 0.028, 12)} m={stripe} p={[0, -pr.shin * 0.72, 0]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.05 * L, 0.016, 12)} m={stripeAlt} p={[0, -pr.shin * 0.58, 0]} />)
    })

    // Black tactical boots.
    sides((_s, l) => {
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.072 * Math.sqrt(L)
      add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.012, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.016)} m={M.dark} p={[0, -A + 0.04, FL * 0.26]} />)
    })

    if (awaken) {
      // Awakened knight — fire-plasma corona rings around the coat.
      add('chest', <P s={S.torus(cw * 0.65, 0.018, Math.PI * 1.6, 18)} m={M.glow} line={false} shadow={false} p={[0, ch * 0.5, -cd * 0.25]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      add('chest', <P s={S.torus(cw * 0.42, 0.012, Math.PI * 1.4, 14)} m={M.glowAlt} line={false} shadow={false} p={[0, ch * 0.7, -cd * 0.15]} r={[Math.PI / 2 + 0.2, 0, Math.PI]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.02, 0.08, 0.01)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.55, ch * 0.55 + Math.sin(a) * ch * 0.2, -cd * 0.2]}
            r={[0.3, 0, a]}
          />,
        )
      }
    }
  }

  if (has('gohanSuit') || has('gohanSsj2')) {
    // Gohan — orange Piccolo gi (base) or purple SSJ2 gi with red wraps.
    const ssj2 = has('gohanSsj2')
    const front = cd * 0.52
    const sash = ssj2 ? M.accent : M.secondary
    const wrap = ssj2 ? M.accent : M.secondary

    // Undershirt / open V (navy on base, deeper purple peek on SSJ2).
    if (!ssj2) {
      add('chest', <P s={S.box(cw * 0.42, ch * 0.55, 0.02, 0.008)} m={M.secondary} p={[0, ch * 0.58, front + 0.002]} />)
      add('chest', <P s={S.box(0.028, ch * 0.72, 0.012, 0.005)} m={M.primary} p={[0.035, ch * 0.52, front + 0.01]} r={[0, 0, -0.55]} />)
      add('chest', <P s={S.box(0.028, ch * 0.72, 0.012, 0.005)} m={M.primary} p={[-0.035, ch * 0.52, front + 0.012]} r={[0, 0, 0.55]} />)
    } else {
      // Sleeveless purple gi — open collar flaps.
      add('chest', <P s={S.box(0.03, ch * 0.7, 0.014, 0.006)} m={M.secondary} p={[0.04, ch * 0.55, front + 0.008]} r={[0, 0, -0.5]} />)
      add('chest', <P s={S.box(0.03, ch * 0.7, 0.014, 0.006)} m={M.secondary} p={[-0.04, ch * 0.55, front + 0.01]} r={[0, 0, 0.5]} />)
      add('chest', <P s={S.torus(0.048, 0.01, Math.PI * 1.2, 14)} m={M.primary} p={[0, ch * 0.98, 0.01]} r={[Math.PI / 2 - 0.35, 0, 0]} />)
    }

    // Wide fabric sash.
    add('spine', <P s={S.box(pr.waistW * 1.32, 0.055, pr.chestD * 1.08, 0.016)} m={sash} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.box(0.07, 0.07, 0.04, 0.014)} m={sash} p={[0.02, pr.abdomen * 0.08, pr.chestD * 0.52]} r={[0, 0, 0.2]} />)
    add('spine', <P s={S.box(0.055, 0.09, 0.03, 0.01)} m={sash} p={[-0.01, pr.abdomen * 0.02, pr.chestD * 0.48]} r={[0.15, 0, -0.25]} />)

    // Wristbands.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, 0.055, 12)} m={wrap} p={[0, -pr.forearm * 0.12, 0]} />)
      add(fore, <P s={S.cyl(0.036 * L, 0.036 * L, 0.012, 12)} m={M.trim} line={false} p={[0, -pr.forearm * 0.05, 0]} />)
    })

    if (ssj2) {
      // Red ankle wraps + dark slippers with white soles.
      sides((_s, l) => {
        const shin = `${l}Shin` as BoneName
        const foot = `${l}Foot` as BoneName
        const A = pr.ankle
        const FL = pr.footL
        const fw = 0.068 * Math.sqrt(L)
        add(shin, <P s={S.cyl(0.032 * L, 0.038 * L, pr.shin * 0.42, 12)} m={wrap} p={[0, -pr.shin * 0.72, 0]} />)
        for (let i = 0; i < 3; i++) {
          add(
            shin,
            <P
              s={S.box(0.055 * L, 0.01, 0.008, 0.003)}
              m={M.trim}
              line={false}
              p={[0, -pr.shin * (0.55 + i * 0.1), 0.032 * L]}
              r={[0, 0, 0.25]}
            />,
          )
        }
        add(foot, <P s={S.box(fw * 0.9, 0.016, FL + 0.04, 0.006)} m={M.light} p={[0, -A + 0.01, FL * 0.28]} />)
        add(foot, <P s={S.box(fw * 0.84, 0.028, FL * 0.75, 0.01)} m={M.trim} p={[0, -A + 0.028, FL * 0.26]} />)
      })
      // Static lightning shards around the body (live aura also crackles in HeroFighter).
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.014, 0.08 + (i % 3) * 0.03, 0.01)}
            m={i % 2 ? M.glow : M.glowAlt}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.55, ch * (0.15 + (i % 4) * 0.22), Math.sin(a) * cd * 0.4 - 0.02]}
            r={[0.5, a, Math.PI * 0.4]}
          />,
        )
      }
    } else {
      // Dark blue boots with red center stripe + tan ankle wraps.
      sides((_s, l) => {
        const shin = `${l}Shin` as BoneName
        const foot = `${l}Foot` as BoneName
        const A = pr.ankle
        const FL = pr.footL
        const fw = 0.072 * Math.sqrt(L)
        add(shin, <P s={S.cyl(0.04 * L, 0.048 * L, pr.shin * 0.55, 12)} m={M.secondary} p={[0, -pr.shin * 0.62, 0]} />)
        add(shin, <P s={S.box(0.028 * L, pr.shin * 0.48, 0.01, 0.004)} m={M.accent} line={false} p={[0, -pr.shin * 0.62, 0.042 * L]} />)
        // Tan cord wraps.
        for (let i = 0; i < 4; i++) {
          add(
            shin,
            <P
              s={S.box(0.06 * L, 0.012, 0.01, 0.004)}
              m={M.metal}
              line={false}
              p={[0, -pr.shin * (0.4 + i * 0.08), 0.038 * L]}
              r={[0, 0, (i % 2 ? 1 : -1) * 0.2]}
            />,
          )
        }
        add(foot, <P s={S.box(fw, 0.024, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.014, FL * 0.3]} />)
        add(foot, <P s={S.box(fw * 0.94, 0.048, FL + 0.02, 0.016)} m={M.secondary} p={[0, -A + 0.04, FL * 0.26]} />)
        add(foot, <P s={S.box(0.022, 0.04, FL * 0.7, 0.006)} m={M.accent} line={false} p={[0, -A + 0.038, FL * 0.32]} />)
      })
      // Soft blue ki outline shards.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(
          'chest',
          <P
            s={S.shard(0.012, 0.05, 0.008)}
            m={M.glow}
            line={false}
            shadow={false}
            p={[Math.cos(a) * cw * 0.5, ch * (0.2 + (i % 3) * 0.25), Math.sin(a) * cd * 0.35 - 0.03]}
            r={[0.3, a, 0.2]}
          />,
        )
      }
    }
  }

  if (has('saitamaSuit')) {
    // Caped Baldy — yellow jumpsuit, white cape, red gloves/boots, gold belt buckle.
    const front = cd * 0.52

    // Short collar zipper.
    add('chest', <P s={S.box(0.018, ch * 0.22, 0.01, 0.004)} m={M.trim} line={false} p={[0, ch * 0.92, front]} />)
    add('chest', <P s={S.box(0.028, 0.022, 0.014, 0.005)} m={M.metal} p={[0, ch * 0.82, front + 0.004]} />)

    // Black belt + circular gold buckle.
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.04, pr.chestD * 1.05, 0.012)} m={M.trim} p={[0, pr.abdomen * 0.12, 0]} />)
    add('spine', <P s={S.cyl(0.038, 0.038, 0.016, 16)} m={M.metal} p={[0, pr.abdomen * 0.12, pr.chestD * 0.54]} r={[Math.PI / 2, 0, 0]} />)
    add('spine', <P s={S.cyl(0.022, 0.022, 0.01, 12)} m={M.glow} line={false} p={[0, pr.abdomen * 0.12, pr.chestD * 0.555]} r={[Math.PI / 2, 0, 0]} />)

    // White cape + black shoulder fasteners.
    {
      const len = pr.hipH * 1.05 + ch * 0.85
      const w = cw * 1.4
      add('cape', <P s={S.panel(w, len, 0.022, -w * 0.3)} m={M.light} p={[0, -len / 2 + 0.03, -0.03]} r={[0.06, 0, 0]} />)
      add('cape', <P s={S.panel(w * 0.94, len * 0.97, 0.012, -w * 0.28)} m={M.white} line={false} p={[0, -len / 2 + 0.035, -0.014]} r={[0.06, 0, 0]} />)
      add('chest', <P s={S.torus(cw * 0.44, 0.02, Math.PI, 16)} m={M.light} p={[0, ch * 0.96, -0.01]} r={[Math.PI / 2 + 0.25, 0, Math.PI]} />)
      sides((s) => {
        add('chest', <P s={S.cyl(0.024, 0.024, 0.014, 12)} m={M.trim} p={[s * cw * 0.32, ch * 0.92, cd * 0.42]} r={[Math.PI / 2, 0, 0]} />)
        add('chest', <P s={S.cyl(0.012, 0.012, 0.008, 10)} m={M.metal} line={false} p={[s * cw * 0.32, ch * 0.92, cd * 0.45]} r={[Math.PI / 2, 0, 0]} />)
      })
    }

    // Thick red gloves to mid-forearm.
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.cyl(0.034 * L, 0.038 * L, pr.forearm * 0.72, 12)} m={M.accent} p={[0, -pr.forearm * 0.55, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.04 * L, 0.02, 12)} m={M.trim} p={[0, -pr.forearm * 0.26, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.2, pr.hand * 2.45, pr.hand * 1.85, pr.hand * 0.65)} m={M.accent} p={[0, -pr.hand * 1.05, 0.002]} />)
    })

    // Matching red mid-calf boots.
    sides((_s, l) => {
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      const A = pr.ankle
      const FL = pr.footL
      const fw = 0.072 * Math.sqrt(L)
      add(shin, <P s={S.cyl(0.04 * L, 0.046 * L, pr.shin * 0.55, 12)} m={M.accent} p={[0, -pr.shin * 0.62, 0]} />)
      add(shin, <P s={S.cyl(0.048 * L, 0.048 * L, 0.02, 12)} m={M.trim} p={[0, -pr.shin * 0.4, 0]} />)
      add(foot, <P s={S.box(fw, 0.026, FL + 0.05, 0.01)} m={M.trim} p={[0, -A + 0.014, FL * 0.3]} />)
      add(foot, <P s={S.box(fw * 0.94, 0.05, FL + 0.02, 0.016)} m={M.accent} p={[0, -A + 0.04, FL * 0.26]} />)
    })
  }

  buildWeapon(c)
  void d
}

function buildWeapon(c: Ctx) {
  const { d, pr, M, add, has } = c
  const h = pr.hand
  const fist = -h * 1.05

  switch (d.weapon) {
    case 'micStaff': {
      const len = 0.62
      add('rHand', <P s={S.cyl(0.009, 0.009, len, 8)} m={M.metal} p={[0, fist, 0.12]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.sphere(0.03, 12, 10)} m={M.trim} p={[0, fist, 0.12 + len / 2 + 0.02]} />)
      add('rHand', <P s={S.torus(0.032, 0.006, Math.PI * 2, 14)} m={M.glow} line={false} p={[0, fist, 0.12 + len / 2 + 0.005]} />)
      add('rHand', <P s={S.shard(0.02, 0.05, 0.02)} m={M.accent} p={[0, fist, 0.12 - len / 2 - 0.02]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 2; i++) {
        add('rHand', <P s={S.panel(0.012, 0.12, 0.004)} m={M.accent} line={false} p={[0.012 * (i ? 1 : -1), fist - 0.06, 0.12 + len / 2 - 0.02]} r={[0, 0, (i ? 1 : -1) * 0.2]} />)
      }
      break
    }
    case 'staff': {
      // Ryūjin Jakka — tall gnarled wooden cane; long enough that idle staffLean plants tip-down.
      const cane = 1.05
      add('rHand', <P s={S.cyl(0.016, 0.013, cane, 8)} m={M.metal} p={[0, fist - cane * 0.5, 0.02]} r={[0.06, 0, 0.03]} />)
      add('rHand', <P s={S.sphere(0.03, 10, 8)} m={M.metal} p={[0, fist + 0.015, 0.03]} />)
      add('rHand', <P s={S.cyl(0.022, 0.018, 0.07, 8)} m={M.trim} p={[0, fist - cane * 0.9, 0.015]} />)
      for (let i = 0; i < 5; i++) {
        add(
          'rHand',
          <P
            s={S.shard(0.014, 0.04, 0.014)}
            m={i % 2 ? M.trim : M.metal}
            line={false}
            p={[(i % 2 ? 1 : -1) * 0.014, fist - cane * (0.22 + i * 0.13), 0.035]}
            r={[0.45, i * 0.8, (i % 2 ? 1 : -1) * 0.35]}
          />,
        )
      }
      // Sealed tip — flares into fire during the signature (glow core).
      add('rHand', <P s={S.sphere(0.018, 8, 6)} m={M.glow} line={false} p={[0, fist - cane * 0.9, 0.015]} />)
      break
    }
    case 'needle':
      add('rHand', <P s={S.cone(0.008, 0.36, 6)} m={M.metal} p={[0, fist, 0.2]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.torus(0.012, 0.004, Math.PI * 2, 10)} m={M.accent} line={false} p={[0, fist, 0.022]} />)
      add('rHand', <P s={S.panel(0.006, 0.14, 0.003)} m={M.glow} line={false} p={[0, fist - 0.07, 0.0]} />)
      break
    case 'scalpel':
      add('rHand', <P s={S.box(0.012, 0.012, 0.07, 0.004)} m={M.trim} p={[0, fist, 0.03]} />)
      add('rHand', <P s={S.shard(0.012, 0.004, 0.045)} m={M.metal} p={[0, fist, 0.1]} />)
      add('lHand', <P s={S.box(0.006, 0.006, 0.05, 0.002)} m={M.metal} p={[0, fist, 0.03]} />)
      break
    case 'cards':
      sides((s, l) => {
        for (let i = 0; i < 3; i++) {
          add(
            `${l}Hand` as BoneName,
            <P s={S.box(0.045, 0.065, 0.003, 0.004)} m={i === 1 ? M.accent : M.light} p={[s * 0.01, fist - 0.03, h * 1.0 + i * 0.003]} r={[0, 0, (i - 1) * 0.35]} />,
          )
        }
      })
      break
    case 'hook':
      add('rHand', <P s={S.cyl(0.008, 0.008, 0.16, 8)} m={M.metal} p={[0, fist, 0.08]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        add(
          'rHand',
          <P s={S.torus(0.03, 0.006, Math.PI * 0.8, 10)} m={M.metal} p={[Math.cos(a) * 0.02, fist + Math.sin(a) * 0.02, 0.17]} r={[0, Math.PI / 2, a]} />,
        )
      }
      add('lFore', <P s={S.torus(0.038 * pr.limb, 0.012, Math.PI * 2, 14)} m={M.accent} p={[0, -pr.forearm * 0.6, 0]} r={[Math.PI / 2, 0, 0]} />)
      add('lFore', <P s={S.torus(0.038 * pr.limb, 0.012, Math.PI * 2, 14)} m={M.accent} p={[0, -pr.forearm * 0.72, 0]} r={[Math.PI / 2, 0, 0]} />)
      break
    case 'scrapers':
      sides((_s, l) => {
        for (let i = 0; i < 3; i++) {
          add(
            `${l}Hand` as BoneName,
            <P s={S.box(0.006, 0.11, 0.02, 0.003)} m={M.metal} p={[(i - 1) * h * 0.65, fist - h * 1.2 - 0.04, h * 0.9]} r={[0.35, 0, 0]} />,
          )
        }
        add(`${l}Hand` as BoneName, <P s={S.box(h * 2.2, h * 0.6, h * 0.6, h * 0.2)} m={M.metal} p={[0, fist - h * 0.9, h * 0.5]} />)
      })
      break
    case 'katana': {
      const hipX = pr.pelvisW * 0.6
      const senbon = has('byakuyaSuit')
      const thunder = has('zenitsuSuit') || has('zenitsuAwaken')
      const zaraki = has('kenpachiSuit')
      const wrap = zaraki ? M.light : senbon ? M.metal : thunder ? M.light : M.secondary
      const blade = senbon ? M.light : thunder ? M.metal : M.metal
      const guard = zaraki ? M.light : senbon ? M.dark : thunder ? M.light : M.metal
      add('pelvis', <P s={S.box(0.024, 0.024, 0.5, 0.01)} m={thunder ? M.light : M.trim} p={[hipX, -0.02, -0.12]} r={[-0.5, 0.1, 0]} />)
      add('pelvis', <P s={S.box(0.026, 0.026, 0.02, 0.006)} m={senbon ? M.metal : thunder ? M.accent : M.accent} line={false} p={[hipX, 0.1, 0.1]} r={[-0.5, 0.1, 0]} />)
      add('propStow', <P s={S.box(0.016, 0.018, 0.12, 0.006)} m={wrap} p={[hipX, 0.135, 0.17]} r={[-0.5, 0.1, 0]} />)
      add('propStow', <P s={S.box(0.042, 0.006, 0.042, 0.002)} m={guard} p={[hipX, 0.11, 0.12]} r={[-0.5, 0.1, 0]} />)
      add('propHand', <P s={S.box(0.016, 0.018, zaraki ? 0.18 : 0.12, 0.006)} m={wrap} p={[0, fist, zaraki ? -0.03 : 0.0]} />)
      add('propHand', <P s={S.box(0.042, 0.006, 0.042, 0.002)} m={guard} p={[0, fist, 0.06]} />)
      add('propHand', <P s={S.box(0.006, zaraki ? 0.028 : 0.02, zaraki ? 0.58 : 0.5, 0.003)} m={blade} p={[0, fist, zaraki ? 0.36 : 0.31]} />)
      add('propHand', <P s={S.box(0.002, 0.008, zaraki ? 0.55 : 0.48, 0.001)} m={M.glowAlt} line={false} p={[0, fist + 0.008, zaraki ? 0.36 : 0.31]} />)
      if (zaraki) {
        // Long trailing bandage wrap from the pommel + notched edge chips.
        add('propHand', <P s={S.panel(0.035, 0.32, 0.01, 0.008)} m={M.light} p={[0.02, fist - 0.1, -0.12]} r={[0.65, 0.25, 0.4]} />)
        add('propHand', <P s={S.panel(0.028, 0.22, 0.008, 0.006)} m={M.light} p={[-0.015, fist - 0.06, -0.1]} r={[0.8, -0.2, -0.3]} />)
        for (let i = 0; i < 5; i++) {
          add(
            'propHand',
            <P
              s={S.shard(0.018, 0.04, 0.01)}
              m={M.metal}
              line={false}
              p={[0.012, fist + (i % 2 ? 0.01 : -0.01), 0.18 + i * 0.08]}
              r={[0.2, 0.5, i % 2 ? 0.4 : -0.35]}
            />,
          )
        }
      }
      if (has('zenitsuAwaken')) {
        // Lightning edge trail on the drawn blade.
        add('propHand', <P s={S.box(0.004, 0.014, 0.52, 0.002)} m={M.glow} line={false} shadow={false} p={[0, fist + 0.012, 0.31]} />)
        add('propHand', <P s={S.shard(0.02, 0.08, 0.01)} m={M.glow} line={false} shadow={false} p={[0.02, fist + 0.02, 0.42]} r={[0.4, 0.6, 0.2]} />)
        add('propHand', <P s={S.shard(0.016, 0.06, 0.008)} m={M.accent} line={false} shadow={false} p={[-0.015, fist, 0.5]} r={[-0.3, -0.4, 0.3]} />)
      }
      break
    }
    case 'kunai': {
      // Flying Thunder God kunai — three-pronged blade + seal-tag handle.
      const tip = fist - 0.02
      add('rHand', <P s={S.box(0.014, 0.014, 0.07, 0.005)} m={M.light} p={[0, tip, 0.04]} />)
      add('rHand', <P s={S.box(0.01, 0.028, 0.004, 0.002)} m={M.trim} line={false} p={[0, tip, 0.05]} />)
      add('rHand', <P s={S.box(0.01, 0.028, 0.004, 0.002)} m={M.trim} line={false} p={[0, tip, 0.03]} />)
      add('rHand', <P s={S.cone(0.012, 0.09, 3)} m={M.metal} p={[0, tip, 0.12]} r={[Math.PI / 2, 0, 0]} />)
      sides((s) =>
        add('rHand', <P s={S.cone(0.007, 0.05, 3)} m={M.metal} p={[s * 0.018, tip, 0.1]} r={[Math.PI / 2, 0, s * 0.55]} />),
      )
      // Spare marked kunai on the hip.
      add('pelvis', <P s={S.box(0.012, 0.012, 0.05, 0.004)} m={M.light} p={[pr.pelvisW * 0.48, 0.02, pr.pelvisD * 0.2]} r={[0.4, 0.3, 0.2]} />)
      add('pelvis', <P s={S.cone(0.01, 0.06, 3)} m={M.metal} p={[pr.pelvisW * 0.52, -0.02, pr.pelvisD * 0.28]} r={[1.2, 0.3, 0.2]} />)
      break
    }
    case 'cleaver': {
      // Blunt wrapped cleaver — black grip, spotted cloth wrap, flat tip.
      const gripZ = 0.02
      add('rHand', <P s={S.box(0.022, 0.028, 0.11, 0.008)} m={M.trim} p={[0, fist, gripZ]} />)
      add('rHand', <P s={S.cyl(0.014, 0.014, 0.1, 10)} m={M.dark} p={[0, fist, gripZ]} r={[Math.PI / 2, 0, 0]} />)
      for (const rz of [0.0, 0.035, 0.07] as const) {
        add('rHand', <P s={S.cyl(0.018, 0.018, 0.006, 10)} m={M.metal} p={[0, fist, gripZ - 0.04 + rz]} r={[Math.PI / 2, 0, 0]} />)
      }
      // Wide rectangular blade (blunt tip).
      const bladeZ = gripZ + 0.22
      add('rHand', <P s={S.box(0.018, 0.11, 0.34, 0.006)} m={M.light} p={[0, fist, bladeZ]} />)
      add('rHand', <P s={S.box(0.006, 0.1, 0.32, 0.002)} m={M.metal} line={false} p={[-0.008, fist, bladeZ]} />)
      // Spotted wrap pattern along the blade face.
      for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 2)
        const col = i % 2
        add(
          'rHand',
          <P
            s={S.sphere(0.012 + (i % 3) * 0.004, 6, 4)}
            m={M.trim}
            line={false}
            p={[(col - 0.5) * 0.02, fist + (col ? 0.02 : -0.015), gripZ + 0.1 + row * 0.055]}
          />,
        )
      }
      // Cloth wrap ridges.
      for (let i = 0; i < 5; i++) {
        add('rHand', <P s={S.box(0.02, 0.112, 0.008, 0.003)} m={M.light} line={false} p={[0.002, fist, gripZ + 0.08 + i * 0.06]} />)
      }
      break
    }
    case 'santoryu': {
      // Zoro — three differently colored katanas: dual hands + mouth; three saya at the right hip.
      // Hand blades: grip at fist, edge along +Z. Mouth: bite the wrap, blade along +Z → his right.
      const placeHand = (
        bone: BoneName,
        wrap: typeof M.trim,
        guard: typeof M.metal,
        blade: typeof M.metal,
        edge: typeof M.glowAlt,
        y = fist,
      ) => {
        const gripZ = 0.02
        add(bone, <P s={S.box(0.016, 0.018, 0.12, 0.006)} m={wrap} p={[0, y, gripZ]} />)
        add(bone, <P s={S.box(0.042, 0.006, 0.042, 0.002)} m={guard} p={[0, y, gripZ + 0.06]} />)
        add(bone, <P s={S.box(0.006, 0.02, 0.5, 0.003)} m={blade} p={[0, y, gripZ + 0.31]} />)
        add(bone, <P s={S.box(0.002, 0.008, 0.48, 0.001)} m={edge} line={false} p={[0, y + 0.008, gripZ + 0.31]} />)
      }
      // Mouth sword — hilt centered on the lips; blade extends sideways (bone +Z → character −X).
      const placeMouth = (
        wrap: typeof M.light,
        guard: typeof M.metal,
        blade: typeof M.light,
        edge: typeof M.glowAlt,
      ) => {
        // Bite mid-tsuka so the blade starts at the mouth and runs out to his right.
        add('propMouth', <P s={S.box(0.016, 0.018, 0.14, 0.006)} m={wrap} p={[0, 0, -0.02]} />)
        add('propMouth', <P s={S.box(0.04, 0.006, 0.04, 0.002)} m={guard} p={[0, 0, 0.06]} />)
        add('propMouth', <P s={S.box(0.006, 0.02, 0.52, 0.003)} m={blade} p={[0, 0, 0.34]} />)
        add('propMouth', <P s={S.box(0.002, 0.008, 0.5, 0.001)} m={edge} line={false} p={[0, 0.008, 0.34]} />)
      }
      // Right hand — Enma: black wrap, dark steel.
      placeHand('propHand', M.trim, M.metal, M.dark, M.glow)
      // Left hand — Kitetsu: purple/crimson wrap, warm metal edge.
      placeHand('propHandL', M.accent, M.metal, M.metal, M.glowAlt)
      // Mouth — Wado Ichimonji: white wrap, pale blade, held against the head to his right.
      placeMouth(M.light, M.metal, M.light, M.white)
      // Three sheathed swords at the right hip (white / black / purple hilts + matching saya).
      {
        const hipX = pr.pelvisW * 0.55
        const wraps = [M.light, M.trim, M.accent] as const
        const saya = [M.primary, M.dark, M.secondary] as const
        for (let i = 0; i < 3; i++) {
          const ox = hipX + i * 0.022
          const oz = -0.1 + i * 0.035
          const oy = -0.01 + i * 0.012
          const rr: [number, number, number] = [-0.55 + i * 0.05, 0.12, 0.08 * i]
          add('propStow', <P s={S.box(0.022, 0.022, 0.48, 0.008)} m={saya[i]} p={[ox, oy, oz]} r={rr} />)
          add('propStow', <P s={S.box(0.015, 0.017, 0.11, 0.005)} m={wraps[i]} p={[ox, oy + 0.14, oz + 0.16]} r={rr} />)
          add('propStow', <P s={S.box(0.038, 0.006, 0.038, 0.002)} m={M.metal} p={[ox, oy + 0.11, oz + 0.12]} r={rr} />)
        }
      }
      break
    }
    case 'dualCleaver': {
      // Tengen — dual Nichirin cleavers; stowed in a V on the back, drawn into both hands.
      const wrap = M.accent
      const guard = M.metal
      const blade = M.light
      const edge = M.metal
      // Hand-held grip — blade extends forward from the fist along +Z.
      const placeDrawn = (bone: BoneName) => {
        const gripZ = 0.02
        add(bone, <P s={S.cyl(0.016, 0.015, 0.14, 10)} m={wrap} p={[0, fist, gripZ]} r={[Math.PI / 2, 0, 0]} />)
        for (const t of [-0.04, 0.0, 0.04] as const) {
          add(bone, <P s={S.cyl(0.02, 0.02, 0.012, 10)} m={M.trim} line={false} p={[0, fist, gripZ + t]} r={[Math.PI / 2, 0, 0]} />)
        }
        add(bone, <P s={S.torus(0.045, 0.01, Math.PI * 2, 14)} m={guard} p={[0, fist, gripZ + 0.08]} r={[Math.PI / 2, 0, 0]} />)
        add(bone, <P s={S.torus(0.028, 0.006, Math.PI * 2, 12)} m={M.glow} line={false} p={[0, fist, gripZ + 0.08]} r={[Math.PI / 2, 0, 0]} />)
        const bladeZ = gripZ + 0.28
        add(bone, <P s={S.box(0.022, 0.14, 0.42, 0.008)} m={blade} p={[0, fist, bladeZ]} />)
        add(bone, <P s={S.box(0.008, 0.12, 0.4, 0.003)} m={edge} line={false} p={[-0.01, fist, bladeZ]} />)
        add(bone, <P s={S.box(0.004, 0.1, 0.36, 0.002)} m={M.glow} line={false} shadow={false} p={[-0.016, fist, bladeZ]} />)
        add(bone, <P s={S.shard(0.04, 0.08, 0.02)} m={blade} p={[0.01, fist + 0.04, gripZ + 0.5]} r={[0.3, 0.2, 0]} />)
        add(bone, <P s={S.shard(0.03, 0.06, 0.016)} m={edge} line={false} p={[-0.01, fist - 0.03, gripZ + 0.48]} r={[-0.25, 0, 0]} />)
      }
      placeDrawn('propHand')
      placeDrawn('propHandL')
      // Stowed — handles over the shoulders, blades hang down the BACK only (clear of the torso).
      {
        const back = -pr.pelvisD * 0.55 - 0.08
        for (const s of [-1, 1] as const) {
          const hx = s * 0.11
          const hy = pr.abdomen + pr.chestH * 0.85
          // Handle tips near the shoulders, angled so blades fall outward + down behind him.
          const hr: [number, number, number] = [0.35, s * 0.15, s * 0.55]
          add('propStow', <P s={S.cyl(0.015, 0.014, 0.13, 10)} m={wrap} p={[hx, hy, back]} r={hr} />)
          for (const t of [-0.035, 0.0, 0.035] as const) {
            add('propStow', <P s={S.cyl(0.019, 0.019, 0.01, 10)} m={M.trim} line={false} p={[hx, hy + t * 0.3, back + t]} r={hr} />)
          }
          add('propStow', <P s={S.torus(0.04, 0.009, Math.PI * 2, 14)} m={guard} p={[hx + s * 0.01, hy - 0.06, back - 0.02]} r={hr} />)
          // Blade hangs down the spine line, kept fully behind the body.
          const bx = hx + s * 0.06
          const by = hy - 0.28
          const bz = back - 0.06
          add('propStow', <P s={S.box(0.02, 0.42, 0.12, 0.008)} m={blade} p={[bx, by, bz]} r={[0.15, s * 0.1, s * 0.35]} />)
          add('propStow', <P s={S.box(0.006, 0.38, 0.1, 0.003)} m={edge} line={false} p={[bx - s * 0.008, by, bz - 0.01]} r={[0.15, s * 0.1, s * 0.35]} />)
          add('propStow', <P s={S.shard(0.035, 0.07, 0.018)} m={blade} p={[bx + s * 0.02, by - 0.22, bz - 0.02]} r={[0.4, s * 0.15, s * 0.2]} />)
        }
        // Chain looping between the two handles behind the neck.
        for (let i = 0; i < 7; i++) {
          const t = i / 6
          add(
            'propStow',
            <P
              s={S.sphere(0.011, 8, 6)}
              m={M.trim}
              line={false}
              p={[(t - 0.5) * 0.2, pr.abdomen + pr.chestH * 0.95 + Math.sin(t * Math.PI) * 0.04, back + 0.02]}
            />,
          )
        }
      }
      break
    }
    case 'yeoui': {
      // Ruyi Jingu Bang — thick grey stone pillar resting on the prop hand.
      const fistY = fist
      const len = 0.72
      const rad = 0.055
      add('propHand', <P s={S.cyl(rad, rad * 0.95, len, 12)} m={M.metal} p={[0, fistY - len * 0.15, 0.08]} r={[0.35, 0, 0.1]} />)
      add('propHand', <P s={S.cyl(rad * 1.15, rad * 1.1, 0.06, 12)} m={M.trim} p={[0, fistY + len * 0.28, 0.12]} r={[0.35, 0, 0.1]} />)
      add('propHand', <P s={S.cyl(rad * 1.15, rad * 1.1, 0.06, 12)} m={M.trim} p={[0, fistY - len * 0.55, 0.04]} r={[0.35, 0, 0.1]} />)
      for (let i = 0; i < 6; i++) {
        const t = (i + 0.5) / 6
        add(
          'propHand',
          <P
            s={S.shard(0.02, 0.05, 0.016)}
            m={i % 2 ? M.trim : M.metal}
            line={false}
            p={[(i % 2 ? 1 : -1) * rad * 0.9, fistY - len * (0.05 + t * 0.7), 0.08 + t * 0.04]}
            r={[0.5, i * 0.7, (i % 2 ? 1 : -1) * 0.4]}
          />,
        )
      }
      break
    }
    case 'excalibur':
    case 'excaliburHuge': {
      // Excalibur — bronze crossguard + ignited plasma blade (fat & wide when awakened).
      const huge = d.weapon === 'excaliburHuge'
      const gripZ = 0.02
      const bladeLen = huge ? 1.05 : 0.48
      // Awakened reads as a thick plasma slab, not a skinny beam.
      const bladeR = huge ? 0.072 : 0.016
      const bladeW = huge ? 0.11 : bladeR
      const guard = huge ? 0.16 : 0.07
      // Tan/bronze cross hilt.
      add('rHand', <P s={S.cyl(huge ? 0.02 : 0.014, huge ? 0.02 : 0.014, huge ? 0.14 : 0.1, 10)} m={M.trim} p={[0, fist, gripZ]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.box(guard * 2, huge ? 0.028 : 0.018, huge ? 0.032 : 0.022, 0.006)} m={M.metal} p={[0, fist, gripZ + 0.04]} />)
      add('rHand', <P s={S.box(huge ? 0.028 : 0.018, guard * 1.6, huge ? 0.032 : 0.022, 0.006)} m={M.metal} p={[0, fist, gripZ + 0.04]} />)
      add('rHand', <P s={S.sphere(huge ? 0.032 : 0.022, 10, 8)} m={M.metal} p={[0, fist, gripZ - (huge ? 0.07 : 0.05)]} />)
      // Plasma core + bright edge — wide box slab when huge, cylinder when normal.
      const bladeZ = gripZ + 0.08 + bladeLen / 2
      if (huge) {
        add('rHand', <P s={S.box(bladeW, bladeR * 2.1, bladeLen, 0.02)} m={M.glow} line={false} shadow={false} p={[0, fist, bladeZ]} />)
        add('rHand', <P s={S.box(bladeW * 0.72, bladeR * 1.45, bladeLen * 0.98, 0.012)} m={M.glowAlt} line={false} shadow={false} p={[0, fist, bladeZ]} />)
        add('rHand', <P s={S.box(bladeW * 0.35, bladeR * 0.7, bladeLen * 0.96, 0.006)} m={M.white} line={false} shadow={false} p={[0, fist, bladeZ]} />)
        add('rHand', <P s={S.cone(bladeW * 0.55, bladeR * 2.8, 8)} m={M.glowAlt} line={false} shadow={false} p={[0, fist, gripZ + 0.08 + bladeLen + bladeR * 0.5]} r={[Math.PI / 2, 0, 0]} />)
      } else {
        add('rHand', <P s={S.cyl(bladeR, bladeR * 0.7, bladeLen, 12)} m={M.glow} line={false} shadow={false} p={[0, fist, bladeZ]} r={[Math.PI / 2, 0, 0]} />)
        add('rHand', <P s={S.cyl(bladeR * 0.55, bladeR * 0.35, bladeLen * 0.98, 10)} m={M.glowAlt} line={false} shadow={false} p={[0, fist, bladeZ]} r={[Math.PI / 2, 0, 0]} />)
        add('rHand', <P s={S.cone(bladeR * 0.85, bladeR * 2.2, 8)} m={M.glowAlt} line={false} shadow={false} p={[0, fist, gripZ + 0.08 + bladeLen + bladeR * 0.4]} r={[Math.PI / 2, 0, 0]} />)
      }
      // Jagged blue plasma arcs along the blade.
      const arcs = huge ? 12 : 6
      for (let i = 0; i < arcs; i++) {
        const t = (i + 0.5) / arcs
        const side = i % 2 ? 1 : -1
        add(
          'rHand',
          <P
            s={S.shard(huge ? bladeW * 0.55 : bladeR * 1.4, huge ? bladeR * 2.8 : bladeR * 2.2, huge ? 0.02 : bladeR * 0.4)}
            m={i % 2 ? M.glow : M.glowAlt}
            line={false}
            shadow={false}
            p={[side * (huge ? bladeW * 0.7 : bladeR * 1.6), fist + side * bladeR * 0.35, gripZ + 0.1 + t * bladeLen]}
            r={[0.2, side * 0.5, side * (0.6 + t)]}
          />,
        )
      }
      if (huge) {
        // Extra blue corona around the colossal blade.
        for (let i = 0; i < 8; i++) {
          const t = (i + 0.5) / 8
          add(
            'rHand',
            <P
              s={S.shard(0.055, 0.14, 0.025)}
              m={i % 2 ? M.glow : M.glowAlt}
              line={false}
              shadow={false}
              p={[(i % 2 ? 1 : -1) * bladeW * 0.75, fist, gripZ + 0.15 + t * bladeLen * 0.85]}
              r={[0.4, 0.2, (i % 2 ? 1 : -1) * 0.8]}
            />,
          )
        }
      }
      break
    }
    case 'zangetsu': {
      // Oversized cleaver Zangetsu — no tsuba, black spine, silver edge, white wrap + trailing cloth.
      const gripZ = 0.02
      const bladeLen = 0.78
      const bladeH = 0.22
      // White bandage-wrapped grip.
      add('rHand', <P s={S.cyl(0.018, 0.016, 0.16, 10)} m={M.light} p={[0, fist, gripZ]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 5; i++) {
        add(
          'rHand',
          <P
            s={S.cyl(0.02, 0.02, 0.012, 10)}
            m={i % 2 ? M.light : M.trim}
            line={false}
            p={[0, fist, gripZ - 0.06 + i * 0.032]}
            r={[Math.PI / 2, 0, 0]}
          />,
        )
      }
      // Trailing white cloth from the pommel.
      add('rHand', <P s={S.panel(0.04, 0.28, 0.01, 0.008)} m={M.light} p={[0.02, fist - 0.08, gripZ - 0.1]} r={[0.6, 0.2, 0.35]} />)
      add('rHand', <P s={S.panel(0.03, 0.18, 0.008, 0.006)} m={M.light} p={[-0.015, fist - 0.05, gripZ - 0.08]} r={[0.75, -0.15, -0.25]} />)
      // Wide cleaver blade — black back, silver cutting face, slight tip curve.
      const bladeZ = gripZ + 0.1 + bladeLen / 2
      add('rHand', <P s={S.box(0.045, bladeH, bladeLen, 0.01)} m={M.dark} p={[0, fist, bladeZ]} />)
      add('rHand', <P s={S.box(0.018, bladeH * 0.92, bladeLen * 0.96, 0.005)} m={M.metal} line={false} p={[-0.018, fist, bladeZ]} />)
      add('rHand', <P s={S.box(0.006, bladeH * 0.88, bladeLen * 0.94, 0.002)} m={M.light} line={false} p={[-0.028, fist, bladeZ]} />)
      // Curved tip shards.
      add('rHand', <P s={S.shard(0.05, 0.14, 0.03)} m={M.dark} p={[0.01, fist + bladeH * 0.2, gripZ + 0.1 + bladeLen + 0.02]} r={[0.35, 0.15, 0.2]} />)
      add('rHand', <P s={S.shard(0.035, 0.1, 0.02)} m={M.metal} line={false} p={[-0.01, fist - bladeH * 0.15, gripZ + 0.1 + bladeLen]} r={[-0.25, 0.1, -0.15]} />)
      // Soft orange Getsuga edge glow when idle/attack reads from palette glow.
      add('rHand', <P s={S.box(0.004, bladeH * 0.7, bladeLen * 0.9, 0.002)} m={M.glow} line={false} shadow={false} p={[-0.032, fist, bladeZ]} />)
      break
    }
    case 'book': {
      // Night Escanor olive paperback; Kakashi gets orange Icha Icha covers.
      const cover = has('kakashiSuit') ? M.accent : M.secondary
      const spine = has('kakashiSuit') ? M.trim : M.accent
      const bx = 0.02
      const by = fist - 0.02
      const bz = h * 0.85
      add('lHand', <P s={S.box(0.055, 0.078, 0.012, 0.005)} m={cover} p={[bx - 0.018, by, bz]} r={[0.15, 0.55, 0.08]} />)
      add('lHand', <P s={S.box(0.048, 0.07, 0.006, 0.002)} m={M.light} line={false} p={[bx - 0.01, by, bz + 0.006]} r={[0.15, 0.35, 0.05]} />)
      add('rHand', <P s={S.box(0.055, 0.078, 0.012, 0.005)} m={cover} p={[-bx + 0.018, by, bz]} r={[0.15, -0.55, -0.08]} />)
      add('rHand', <P s={S.box(0.048, 0.07, 0.006, 0.002)} m={M.light} line={false} p={[-bx + 0.01, by, bz + 0.006]} r={[0.15, -0.35, -0.05]} />)
      add('rHand', <P s={S.box(0.01, 0.074, 0.018, 0.004)} m={spine} p={[0, by, bz - 0.004]} r={[0.1, 0, 0]} />)
      add('lHand', <P s={S.box(0.04, 0.008, 0.01, 0.002)} m={M.metal} line={false} p={[bx - 0.012, by + 0.028, bz + 0.01]} r={[0.15, 0.4, 0]} />)
      break
    }
    case 'rhitta': {
      // Divine Axe Rhitta — oversized crescent blade, golden sun boss, blue grip.
      const gripZ = 0.04
      // Gold haft + navy grip.
      add('rHand', <P s={S.cyl(0.018, 0.016, 0.22, 10)} m={M.metal} p={[0, fist, gripZ]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.cyl(0.022, 0.022, 0.09, 10)} m={M.dark} p={[0, fist, gripZ - 0.02]} r={[Math.PI / 2, 0, 0]} />)
      // Spiked circular handguard near the pommel.
      add('rHand', <P s={S.torus(0.045, 0.01, Math.PI * 2, 14)} m={M.metal} p={[0, fist, gripZ - 0.08]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'rHand',
          <P
            s={S.cone(0.01, 0.035, 4)}
            m={M.metal}
            p={[Math.cos(a) * 0.05, fist + Math.sin(a) * 0.05, gripZ - 0.08]}
            r={[Math.cos(a), 0, Math.sin(a)]}
          />,
        )
      }
      // Neck of the axe + golden sun boss.
      const bossZ = gripZ + 0.2
      add('rHand', <P s={S.cyl(0.028, 0.04, 0.08, 10)} m={M.metal} p={[0, fist, bossZ - 0.06]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.cyl(0.07, 0.07, 0.045, 14)} m={M.accent} p={[0, fist, bossZ]} r={[Math.PI / 2, 0, 0]} />)
      add('rHand', <P s={S.cyl(0.035, 0.035, 0.05, 12)} m={M.metal} p={[0, fist, bossZ + 0.01]} r={[Math.PI / 2, 0, 0]} />)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2
        add(
          'rHand',
          <P
            s={S.shard(0.018, 0.055, 0.01)}
            m={M.accent}
            line={false}
            p={[Math.cos(a) * 0.08, fist + Math.sin(a) * 0.08, bossZ]}
            r={[0.15, 0, a]}
          />,
        )
      }
      // Crescent silver blade (thick wedge + curved face).
      add('rHand', <P s={S.box(0.04, 0.28, 0.42, 0.012)} m={M.light} p={[0.02, fist, bossZ + 0.22]} r={[0, 0, 0.15]} />)
      add('rHand', <P s={S.box(0.02, 0.22, 0.36, 0.006)} m={M.metal} line={false} p={[-0.005, fist, bossZ + 0.22]} />)
      add('rHand', <P s={S.shard(0.08, 0.22, 0.04)} m={M.light} p={[0.03, fist + 0.12, bossZ + 0.38]} r={[0.4, 0.2, 0.3]} />)
      add('rHand', <P s={S.shard(0.07, 0.18, 0.035)} m={M.light} p={[0.03, fist - 0.12, bossZ + 0.36]} r={[-0.35, 0.15, -0.25]} />)
      // Rear spear spike opposite the crescent.
      add('rHand', <P s={S.cone(0.035, 0.22, 5)} m={M.metal} p={[0, fist, bossZ - 0.18]} r={[-Math.PI / 2, 0, 0]} />)
      break
    }
    case 'flameBroom': {
      // Flame-bristled matoi — wooden shaft with a cage head and fire for bristles.
      const shaft = 0.72
      const gripZ = 0.02
      add('propHand', <P s={S.cyl(0.014, 0.012, shaft, 10)} m={M.metal} p={[0, fist - 0.02, gripZ + shaft * 0.15]} r={[0.55, 0.15, 0.1]} />)
      add('propHand', <P s={S.cyl(0.02, 0.02, 0.04, 10)} m={M.trim} p={[0, fist + 0.08, gripZ + 0.02]} r={[0.55, 0.15, 0.1]} />)
      // Cage / matoi head.
      add('propHand', <P s={S.sphere(0.055, 10, 8)} m={M.metal} p={[0, fist - 0.28, gripZ + 0.48]} sc={[1.1, 0.85, 1.1]} />)
      add('propHand', <P s={S.box(0.07, 0.04, 0.07, 0.012)} m={M.trim} p={[0, fist - 0.22, gripZ + 0.42]} r={[0.4, 0, 0]} />)
      // Paper streamer block with a rough "7" mark.
      add('propHand', <P s={S.box(0.05, 0.05, 0.018, 0.006)} m={M.light} p={[0, fist + 0.22, gripZ - 0.12]} r={[0.3, 0.2, 0]} />)
      add('propHand', <P s={S.box(0.012, 0.032, 0.008, 0.003)} m={M.ink} line={false} p={[0, fist + 0.22, gripZ - 0.1]} />)
      add('propHand', <P s={S.panel(0.018, 0.18, 0.006)} m={M.light} p={[0.02, fist + 0.12, gripZ - 0.08]} r={[0.4, 0.3, 0.2]} />)
      add('propHand', <P s={S.panel(0.016, 0.14, 0.005)} m={M.light} p={[-0.015, fist + 0.1, gripZ - 0.06]} r={[0.35, -0.25, -0.15]} />)
      // Flame bristles — glowing cones + shards at the head.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(
          'propHand',
          <P
            s={S.cone(0.028, 0.14 + (i % 3) * 0.03, 5)}
            m={i % 2 ? M.glow : M.accent}
            line={false}
            shadow={false}
            p={[Math.cos(a) * 0.04, fist - 0.38 - (i % 2) * 0.04, gripZ + 0.52 + Math.sin(a) * 0.04]}
            r={[Math.PI + 0.2, a, 0.15]}
          />,
        )
      }
      add('propHand', <P s={S.sphere(0.04, 8, 6)} m={M.glow} line={false} shadow={false} p={[0, fist - 0.42, gripZ + 0.55]} />)
      break
    }
    case 'none':
      break
  }
}
