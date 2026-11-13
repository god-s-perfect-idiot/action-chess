/** Portrait candidates under /public/roster — drop files named by hero id. */

const EXT = ['.png', '.jpg', '.jpeg', '.webp'] as const

/** Ordered src candidates for a hero portrait (first that loads wins). */
export function heroRosterArtCandidates(heroId: string): string[] {
  return EXT.map((ext) => `/roster/${heroId}${ext}`)
}
