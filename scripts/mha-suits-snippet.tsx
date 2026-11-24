  if (has('froppySuit')) {
  // Tsuyu — green bodysuit, black striped legs, cream goggles/gloves/belt, flipper boots.
    const front = cd * 0.52
    const r = pr.headR
    add('chest', <P s={S.box(cw * 1.05, ch * 0.92, cd * 1.05, 0.022)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.35, 0.018, 0.008)} m={M.primary} p={[0, ch * 0.72, front * 0.85]} r={[0, 0, 0.08]} />)
    sides((s) => {
      add('chest', <P s={S.sphere(0.07, 12, 10)} m={M.secondary} p={[s * cw * 0.24, ch * 0.62, front]} sc={[1.1, 0.9, 0.65]} />)
    })
    add('head', <P s={S.box(r * 1.05, r * 0.2, r * 0.22, r * 0.06)} m={M.trim} p={[0, r * 1.05, r * 0.35]} r={[0.35, 0, 0]} />)
    sides((s) => {
      add('head', <P s={S.cyl(r * 0.2, r * 0.22, r * 0.12, 12)} m={M.primary} line={false} p={[s * r * 0.35, r * 1.08, r * 0.45]} r={[0.5, s * 0.3, 0]} />)
      add('head', <P s={S.sphere(r * 0.16, 10, 8)} m={M.glow} line={false} p={[s * r * 0.35, r * 1.08, r * 0.52]} />)
    })
    add('spine', <P s={S.cyl(pr.waistW * 0.92, pr.waistW * 0.95, 0.05, 14)} m={M.trim} p={[0, pr.abdomen * 0.12, pr.chestD * 0.42]} />)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      add('spine', <P s={S.sphere(0.012, 8, 6)} m={M.dark} line={false} p={[Math.cos(a) * pr.waistW * 0.4, pr.abdomen * 0.12, pr.chestD * 0.44 + Math.sin(a) * pr.chestD * 0.38]} />)
    }
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      const thigh = `${l}Thigh` as BoneName
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(fore, <P s={S.cyl(0.05 * L, 0.054 * L, pr.forearm * 0.82, 12)} m={M.trim} p={[0, -pr.forearm * 0.45, 0]} />)
      add(fore, <P s={S.cyl(0.056 * L, 0.06 * L, 0.035, 12)} m={M.primary} p={[0, -pr.forearm * 0.88, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.8, pr.hand * 3.0, pr.hand * 2.2, pr.hand * 0.85)} m={M.trim} p={[0, -pr.hand * 1.1, 0]} />)
      add(hand, <P s={S.cyl(0.05 * L, 0.052 * L, 0.025, 12)} m={M.primary} p={[0, -pr.hand * 0.35, 0]} />)
      add(thigh, <P s={S.cyl(0.054 * L, 0.05 * L, pr.thigh * 0.92, 12)} m={M.secondary} p={[0, -pr.thigh * 0.48, 0]} />)
      add(thigh, <P s={S.box(0.014, pr.thigh * 0.85, 0.01, 0.004)} m={M.accent} line={false} p={[0.044 * L, -pr.thigh * 0.48, 0.038 * L]} />)
      const A = pr.ankle
      const FL = pr.footL
      add(shin, <P s={S.cyl(0.048 * L, 0.044 * L, pr.shin * 0.88, 12)} m={M.secondary} p={[0, -pr.shin * 0.52, 0]} />)
      add(foot, <P s={S.box(0.1 * Math.sqrt(L), 0.035, FL + 0.1, 0.014)} m={M.primary} p={[0, -A + 0.02, FL * 0.28]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.022, FL + 0.12, 0.01)} m={M.secondary} p={[0, -A + 0.012, FL * 0.42]} />)
      for (let t = 0; t < 3; t++) {
        add(foot, <P s={S.sphere(0.024, 8, 6)} m={M.trim} p={[(t - 1) * 0.03, -A + 0.008, FL + 0.05]} />)
      }
    })
  }

  // uravitySuit — see Extras.tsx (teal suit, white stripe/arms/gauntlets/boots, pink collar + ear pads).


  if (has('tsukuyomiSuit')) {
    const r = pr.headR
    const beak = M.trim
    add('head', <P s={S.sphere(r * 1.12, 16, 14)} m={M.trim} p={[0, r * 0.1, -r * 0.12]} sc={[1.08, 1.05, 1.15]} />)
    add('head', <P s={S.cone(r * 0.38, r * 1.05, 10)} m={beak} p={[0, -r * 0.12, r * 0.92]} r={[1.12, 0, 0]} />)
    add('head', <P s={S.box(r * 0.55, r * 0.14, r * 0.3, r * 0.05)} m={beak} p={[0, -r * 0.32, r * 1.35]} />)
    sides((s) => {
      add('head', <P s={S.sphere(r * 0.1, 8, 6)} m={M.glow} line={false} shadow={false} p={[s * r * 0.35, r * 0.08, r * 0.68]} />)
    })
    for (let i = 0; i < 9; i++) {
      const a = ((i - 4) / 4) * 0.85
      add('head', <P s={S.shard(r * 0.11, r * (0.32 + (i % 3) * 0.1), r * 0.045)} m={i % 2 ? M.hair : M.trim} p={[Math.sin(a) * r * 0.7, r * 0.4, -r * (0.58 + Math.abs(Math.sin(a)) * 0.25)]} r={[-0.55, a, 0.25]} />)
    }
    add('neck', <P s={S.cyl(0.042 * L, 0.048 * L, 0.04, 12)} m={M.accent} p={[0, 0.015, 0.01]} />)
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      add(fore, <P s={S.cyl(0.036 * L, 0.034 * L, pr.forearm * 0.9, 12)} m={M.skin} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.04 * L, 0.042 * L, 0.035, 12)} m={M.trim} p={[0, -pr.forearm * 0.88, 0]} />)
    })
    {
      const len = pr.hipH * 1.55 + ch * 1.15
      add('cape', <P s={S.panel(cw * 1.55, len, 0.028, -cw * 0.38)} m={M.primary} p={[0, -len / 2, -0.05]} r={[0.1, 0, 0]} />)
      add('cape', <P s={S.panel(cw * 1.42, len * 0.96, 0.018, -cw * 0.36)} m={M.secondary} line={false} p={[0, -len / 2 + 0.04, -0.02]} r={[0.1, 0, 0]} />)
      for (let i = 0; i < 10; i++) {
        sides((s) => {
          add('cape', <P s={S.shard(0.05, len * (0.15 + (i % 3) * 0.06), 0.014)} m={M.trim} p={[s * cw * (0.38 + (i % 4) * 0.1), -len * (0.12 + i * 0.075), -0.025]} r={[0.2, 0, s * (0.25 + i * 0.15)]} />)
        })
      }
    }
    sides((_s, l) => {
      const thigh = `${l}Thigh` as BoneName
      const foot = `${l}Foot` as BoneName
      add(thigh, <P s={S.cyl(0.05 * L, 0.046 * L, pr.thigh * 0.9, 12)} m={M.secondary} p={[0, -pr.thigh * 0.48, 0]} />)
      add(foot, <P s={S.box(0.08 * Math.sqrt(L), 0.05, pr.footL + 0.08, 0.016)} m={M.trim} p={[0, -pr.ankle + 0.03, pr.footL * 0.28]} />)
    })
  }

  if (has('endeavorSuit')) {
    // Hellflame head is animated live in HeroFighter — suit is navy armor only.
    const front = cd * 0.52
    add('chest', <P s={S.box(cw * 1.02, ch * 0.92, cd * 1.02, 0.022)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.07 * s, ch * 0.32, 0.022, 0.008)} m={M.glow} line={false} p={[s * cw * 0.24, ch * 0.72, front]} sc={[1.2, 1, 0.85]} />)
      add('chest', <P s={S.box(0.1 * s, 0.085, 0.12, 0.028)} m={M.metal} p={[s * 0.03, ch * 0.88, -0.02]} r={[0.15, 0, s * -0.28]} />)
      for (let i = 0; i < 3; i++) {
        add('chest', <P s={S.cyl(0.008, 0.008, 0.012, 8)} m={M.trim} line={false} p={[s * 0.06, ch * (0.8 - i * 0.08), 0.06]} r={[Math.PI / 2, 0, 0]} />)
      }
    })
    add('spine', <P s={S.box(pr.waistW * 1.28, 0.062, pr.chestD * 1.08, 0.018)} m={M.accent} p={[0, pr.abdomen * 0.1, 0]} />)
    add('spine', <P s={S.box(0.065, 0.055, 0.024, 0.01)} m={M.metal} p={[0, pr.abdomen * 0.1, pr.chestD * 0.54]} />)
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.cyl(0.058 * L, 0.062 * L, pr.forearm * 0.95, 12)} m={M.light} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.cyl(0.062 * L, 0.062 * L, 0.022, 12)} m={M.metal} p={[0, -pr.forearm * 0.1, 0]} />)
      add(hand, <P s={S.box(pr.hand * 2.3, pr.hand * 2.4, pr.hand * 2.0, pr.hand * 0.7)} m={M.light} p={[0, -pr.hand * 1.05, 0]} />)
      add(`${l}Thigh` as BoneName, <P s={S.box(0.085 * L, 0.12, 0.045, 0.014)} m={M.glow} line={false} p={[0, -pr.thigh * 0.45, 0.042 * L]} />)
      add(`${l}Foot` as BoneName, <P s={S.box(0.085 * Math.sqrt(L), 0.04, pr.footL + 0.08, 0.016)} m={M.glow} line={false} p={[0, -pr.ankle + 0.022, pr.footL * 0.3]} />)
      add(`${l}Foot` as BoneName, <P s={S.cone(0.04, 0.1, 6)} m={M.accent} line={false} shadow={false} p={[0, -pr.ankle - 0.015, -0.05]} r={[Math.PI, 0, 0]} />)
    })
  }


  if (has('kurogiriSuit')) {
    const r = pr.headR
    add('head', <P s={S.sphere(r * 1.28, 16, 14)} m={M.skin} p={[0, r * 0.08, -r * 0.08]} sc={[1.15, 1.08, 1.2]} />)
    add('head', <P s={S.sphere(r * 0.95, 12, 10)} m={M.dark} p={[0, r * 0.02, r * 0.15]} sc={[1.1, 0.95, 1.05]} />)
    sides((s) => {
      add('head', <P s={S.shard(r * 0.08, r * 0.18, r * 0.025)} m={M.glow} line={false} shadow={false} p={[s * r * 0.32, r * 0.02, r * 0.75]} r={[0.25, s * 0.2, s * -0.35]} />)
      add('head', <P s={S.sphere(r * 0.05, 8, 6)} m={M.accent} line={false} shadow={false} p={[s * r * 0.34, r * 0.04, r * 0.82]} />)
    })
    add('neck', <P s={S.cyl(0.068, 0.072, 0.14, 12)} m={M.metal} p={[0, -0.025, 0]} />)
    sides((s) => {
      for (let i = 0; i < 5; i++) {
        add('neck', <P s={S.box(0.013, 0.1, 0.016, 0.005)} m={M.trim} p={[s * 0.052 + (i - 2) * 0.01, -0.02, 0.04]} />)
      }
    })
    add('chest', <P s={S.box(cw * 0.95, ch * 0.58, 0.048, 0.018)} m={M.primary} p={[0, ch * 0.55, cd * 0.34]} />)
    add('chest', <P s={S.box(cw * 0.88, ch * 0.5, 0.04, 0.014)} m={M.secondary} p={[0, ch * 0.52, cd * 0.38]} />)
    for (let i = 0; i < 3; i++) {
      add('chest', <P s={S.sphere(0.012, 8, 6)} m={M.trim} line={false} p={[(i - 1) * cw * 0.12, ch * 0.72, cd * 0.58]} />)
    }
    add('chest', <P s={S.box(0.048, 0.16, 0.014, 0.005)} m={M.trim} p={[0, ch * 0.88, cd * 0.54]} />)
    add('chest', <P s={S.panel(0.05, ch * 0.55, 0.012)} m={M.accent} p={[0, ch * 0.48, cd * 0.58]} />)
    sides((_s, l) => {
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(fore, <P s={S.sphere(0.055, 12, 10)} m={M.skin} p={[0, -pr.forearm * 0.72, 0]} sc={[1.25, 1.0, 1.15]} />)
      add(hand, <P s={S.sphere(0.042, 10, 8)} m={M.skin} p={[0, -pr.hand * 0.85, 0]} sc={[1.2, 0.85, 1.1]} />)
    })
    sides((_s, l) => {
      add(`${l}Thigh` as BoneName, <P s={S.cyl(0.052 * L, 0.048 * L, pr.thigh * 0.88, 12)} m={M.trim} p={[0, -pr.thigh * 0.48, 0]} />)
    })
  }

  if (has('gangOrcaSuit')) {
    // Synced with Extras.tsx — forward orca head + full white suit.
    const r = pr.headR
    const front = cd * 0.52
    add('head', <P s={S.sphere(r * 1.18, 16, 14)} m={M.skin} p={[0, r * 0.02, -r * 0.06]} sc={[1.15, 1.02, 1.22]} />)
    add('head', <P s={S.cone(r * 0.42, r * 1.05, 10)} m={M.skin} p={[0, -r * 0.12, r * 0.95]} r={[Math.PI / 2 - 0.08, 0, 0]} />)
    add('head', <P s={S.box(r * 0.72, r * 0.22, r * 0.85, r * 0.1)} m={M.light} p={[0, -r * 0.42, r * 0.7]} />)
    add('head', <P s={S.shard(r * 0.1, r * 0.55, r * 0.055)} m={M.skin} p={[0, r * 1.2, -r * 0.15]} r={[-0.35, 0, 0]} />)
    sides((s) => {
      add('head', <P s={S.sphere(r * 0.3, 12, 10)} m={M.light} p={[s * r * 0.55, r * 0.06, r * 0.42]} sc={[0.7, 0.85, 0.5]} />)
    })
    add('chest', <P s={S.cyl(cw * 0.42, cw * 0.46, ch * 0.28, 14)} m={M.primary} p={[0, ch * 1.02, -0.01]} />)
    add('chest', <P s={S.box(cw * 1.08, ch * 0.95, cd * 1.08, 0.022)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.panel(0.055, ch * 0.55, 0.016)} m={M.accent} p={[0, ch * 0.58, front]} />)
    sides((_s, l) => {
      add(`${l}Upper` as BoneName, <P s={S.cyl(0.05 * L, 0.046 * L, pr.upperArm * 0.95, 12)} m={M.primary} p={[0, -pr.upperArm * 0.48, 0]} />)
      add(`${l}Thigh` as BoneName, <P s={S.cyl(0.058 * L, 0.05 * L, pr.thigh * 0.95, 12)} m={M.primary} p={[0, -pr.thigh * 0.48, 0]} />)
      const hand = `${l}Hand` as BoneName
      add(hand, <P s={S.box(pr.hand * 2.4, pr.hand * 2.6, pr.hand * 2.1, pr.hand * 0.75)} m={M.trim} p={[0, -pr.hand * 1.05, 0]} />)
    })
  }

  if (has('chargeboltSuit')) {
    // Synced from Extras.tsx chargeboltSuit — black jacket, blue visor, pointer gauntlet.
    const front = cd * 0.52
    const r = pr.headR
    const h = pr.hand
    add('head', <P s={S.box(r * 0.95, r * 0.16, r * 0.14, r * 0.05)} m={M.accent} p={[0, r * 0.72, r * 0.58]} />)
    add('head', <P s={S.box(r * 0.7, r * 0.06, r * 0.05, r * 0.02)} m={M.light} line={false} p={[0, r * 0.72, r * 0.68]} />)
    sides((s) => {
      add('head', <P s={S.box(r * 0.08, r * 0.1, r * 0.55, r * 0.03)} m={M.trim} p={[s * r * 0.72, r * 0.55, r * 0.05]} r={[0.15, s * 0.1, 0]} />)
    })
    add('head', <P s={S.cyl(r * 0.1, r * 0.1, r * 0.08, 10)} m={M.light} p={[r * 0.78, r * 0.35, r * 0.15]} r={[0, 0, Math.PI / 2]} />)
    add('head', <P s={S.shard(r * 0.09, r * 0.38, r * 0.035)} m={M.hairShade} p={[-r * 0.28, r * 0.88, r * 0.22]} r={[-0.35, 0, 0.45]} />)
    add('neck', <P s={S.cyl(0.034 * Math.sqrt(L), 0.036 * Math.sqrt(L), 0.018, 12)} m={M.trim} p={[0, pr.neck * 0.55, 0.008]} />)
    add('chest', <P s={S.box(cw * 1.1, ch * 0.38, cd * 1.1, 0.022)} m={M.primary} p={[0, ch * 0.82, 0]} r={[0.12, 0, 0]} />)
    add('chest', <P s={S.box(cw * 0.38, ch * 0.72, 0.018, 0.006)} m={M.secondary} p={[0, ch * 0.42, front * 0.88]} />)
    sides((s) => {
      add('chest', <P s={S.shard(0.032, ch * 0.42, 0.014)} m={M.secondary} p={[s * cw * 0.2, ch * 0.62, front]} r={[0, 0, s * 0.55]} />)
    })
    add('lFore', <P s={S.cyl(0.03 * L, 0.028 * L, pr.forearm * 0.88, 12)} m={M.skin} p={[0, -pr.forearm * 0.48, 0]} />)
    add('rFore', <P s={S.cyl(0.058 * L, 0.062 * L, pr.forearm * 0.95, 12)} m={M.light} p={[0, -pr.forearm * 0.48, 0]} />)
    add('rFore', <P s={S.cone(0.016, 0.09, 6)} m={M.light} p={[0.012, -pr.forearm * 0.95, 0.04]} r={[1.15, 0, 0.15]} />)
    sides((s, l) => {
      const hand = `${l}Hand` as BoneName
      add(hand, <P s={S.box(h * 2, h * 2.3, h * 1.7, h * 0.6)} m={M.skin} p={[0, -h * 1.05, 0.002]} />)
    })
    add('spine', <P s={S.box(pr.waistW * 1.32, 0.05, pr.chestD * 1.1, 0.014)} m={M.secondary} p={[0, pr.abdomen * 0.1, 0]} />)
    sides((s, l) => {
      add(`${l}Thigh` as BoneName, <P s={S.shard(0.022, pr.thigh * 0.55, 0.012)} m={M.secondary} line={false} p={[s * 0.048, -pr.thigh * 0.55, 0.035]} r={[0.15, 0, s * 0.2]} />)
      const foot = `${l}Foot` as BoneName
      add(foot, <P s={S.box(0.085 * Math.sqrt(L), 0.045, pr.footL + 0.09, 0.016)} m={M.trim} p={[0, -pr.ankle + 0.028, pr.footL * 0.28]} />)
    })
  }



  if (has('pinkySuit')) {
    // See Extras.tsx pinkySuit — synced from Ashido hero-costume ref.
    const front = cd * 0.52
    const r = pr.headR
    sides((s) => {
      add('head', <P s={S.cone(r * 0.12, r * 0.38, 6)} m={M.accent} p={[s * r * 0.48, r * 1.15, r * 0.2]} r={[-0.55, 0, s * 0.35]} />)
      add('head', <P s={S.cone(r * 0.08, r * 0.28, 5)} m={M.accent} p={[s * r * 0.58, r * 1.38, r * 0.08]} r={[-0.85, 0, s * 0.55]} />)
      add('head', <P s={S.box(r * 0.42, r * 0.16, r * 0.07, r * 0.028)} m={M.light} p={[s * r * 0.28, r * 0.1, r * 0.74]} r={[0.08, s * 0.22, s * 0.12]} />)
    })
    add('chest', <P s={S.box(cw * 1.02, ch * 0.95, cd * 1.02, 0.02)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.box(cw * 1.12, ch * 0.42, cd * 1.1, 0.022)} m={M.trim} p={[0, ch * 0.72, 0]} />)
    add('chest', <P s={S.torus(cw * 0.48, 0.055, Math.PI * 1.7, 18)} m={M.light} p={[0, ch * 1.0, -0.01]} r={[Math.PI / 2 + 0.2, 0, Math.PI * 0.05]} />)
    sides((_s, l) => {
      add(`${l}Thigh` as BoneName, <P s={S.cyl(0.054 * L, 0.048 * L, pr.thigh * 0.92, 12)} m={M.primary} p={[0, -pr.thigh * 0.48, 0]} />)
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.048 * L, 0.052 * L, pr.shin * 0.55, 12)} m={M.primary} p={[0, -pr.shin * 0.68, 0]} />)
      add(shin, <P s={S.cyl(0.056 * L, 0.058 * L, 0.045, 12)} m={M.trim} p={[0, -pr.shin * 0.42, 0]} />)
      add(foot, <P s={S.box(0.09 * Math.sqrt(L), 0.05, pr.footL + 0.1, 0.018)} m={M.primary} p={[0, -pr.ankle + 0.032, pr.footL * 0.28]} />)
    })
  }



  if (has('dabiSuit')) {
    // Classic navy overcoat — purple burned arms/neck, open white shirt, burner cuffs, black boots.
    const front = cd * 0.52
    const burn = M.skinShade
    add('neck', <P s={S.cyl(0.034 * Math.sqrt(L), 0.038 * Math.sqrt(L), pr.neck * 1.15, 12)} m={burn} p={[0, pr.neck * 0.35, 0]} />)
    add('chest', <P s={S.box(cw * 0.55, ch * 0.35, 0.02, 0.008)} m={burn} p={[0, ch * 0.78, front * 0.7]} />)
    add('chest', <P s={S.box(cw * 1.08, ch * 0.88, cd * 1.08, 0.022)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    add('chest', <P s={S.box(cw * 0.4, ch * 0.7, 0.02, 0.008)} m={M.light} p={[0, ch * 0.42, front * 0.82]} />)
    sides((s) => {
      add('chest', <P s={S.box(0.07, 0.018, 0.012, 0.004)} m={M.metal} p={[s * cw * 0.3, ch * 0.88, front * 0.65]} r={[0, 0, s * 0.25]} />)
      add('chest', <P s={S.box(0.018, 0.05, 0.01, 0.003)} m={M.metal} p={[s * cw * 0.22, ch * 0.72, front]} />)
      add('neck', <P s={S.box(0.022, 0.03, 0.01, 0.004)} m={M.metal} p={[s * 0.028, pr.neck * 0.7, 0.03]} />)
    })
    for (let i = 0; i < 5; i++) {
      add('chest', <P s={S.shard(0.03, 0.07, 0.01)} m={M.metal} p={[cw * (0.08 + (i % 2) * 0.12), ch * (0.38 + i * 0.1), front]} r={[0.2, 0, (i % 2 ? 1 : -1) * 0.3]} />)
    }
    for (let i = 0; i < 4; i++) {
      add(
        'cape',
        <P
          s={S.shard(0.05, ch * (0.28 + (i % 2) * 0.1), 0.012)}
          m={M.primary}
          p={[(i % 2 ? 1 : -1) * cw * (0.22 + (i % 3) * 0.1), -ch * (0.15 + i * 0.08), -0.04]}
          r={[0.25, 0, (i % 2 ? 1 : -1) * 0.35]}
        />,
      )
    }
    sides((_s, l) => {
      const upper = `${l}Upper` as BoneName
      const fore = `${l}Fore` as BoneName
      const hand = `${l}Hand` as BoneName
      add(upper, <P s={S.cyl(0.05 * L, 0.054 * L, 0.055, 12)} m={M.metal} p={[0, -pr.upperArm * 0.9, 0]} />)
      add(upper, <P s={S.cyl(0.044 * L, 0.046 * L, 0.018, 12)} m={M.trim} p={[0, -pr.upperArm * 0.98, 0]} />)
      add(fore, <P s={S.cyl(0.03 * L, 0.026 * L, pr.forearm * 0.98, 12)} m={burn} p={[0, -pr.forearm * 0.48, 0]} />)
      add(fore, <P s={S.box(0.028, 0.012, 0.008, 0.003)} m={M.metal} p={[0, -pr.forearm * 0.28, 0.032 * L]} />)
      add(fore, <P s={S.box(0.028, 0.012, 0.008, 0.003)} m={M.metal} p={[0, -pr.forearm * 0.48, 0.03 * L]} />)
      add(fore, <P s={S.box(0.028, 0.012, 0.008, 0.003)} m={M.metal} p={[0, -pr.forearm * 0.68, 0.028 * L]} />)
      const hh = pr.hand
      add(hand, <P s={S.box(hh * 2.05, hh * 2.35, hh * 1.75, hh * 0.62)} m={burn} p={[0, -hh * 1.05, 0.002]} />)
      add(`${l}Thigh` as BoneName, <P s={S.cyl(0.052 * L, 0.048 * L, pr.thigh * 0.88, 12)} m={M.secondary} p={[0, -pr.thigh * 0.48, 0]} />)
      add(`${l}Thigh` as BoneName, <P s={S.box(0.04, 0.035, 0.012, 0.004)} m={M.metal} p={[0, -pr.thigh * 0.35, 0.045 * L]} />)
      const shin = `${l}Shin` as BoneName
      const foot = `${l}Foot` as BoneName
      add(shin, <P s={S.cyl(0.032 * L, 0.034 * L, 0.14, 12)} m={M.trim} p={[0, -pr.shin + 0.07, 0]} />)
      add(foot, <P s={S.box(0.07 * L, 0.028, 0.12 * L, 0.012)} m={M.trim} p={[0, -0.02, 0.035 * L]} />)
      add(foot, <P s={S.box(0.065 * L, 0.05, 0.1 * L, 0.014)} m={M.dark} p={[0, 0.01, 0.03 * L]} />)
    })
  }


  if (has('earphoneJackSuit')) {
    // Implemented in src/scene/fighters/Extras.tsx — pink tee, cropped jacket, jacks, amp boots.
  }






  if (has('nejireSuit')) {
    const front = cd * 0.52
    add('chest', <P s={S.box(cw * 1.02, ch * 0.9, cd * 1.02, 0.02)} m={M.primary} p={[0, ch * 0.48, 0]} />)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2
      add('chest', <P s={S.torus(0.038, 0.008, Math.PI * 1.2, 12)} m={M.glow} line={false} p={[Math.cos(a) * cw * 0.22, ch * (0.55 + Math.sin(a) * 0.15), front + Math.sin(a) * 0.02]} r={[0.3, a, 0.2]} />)
    }
  }

