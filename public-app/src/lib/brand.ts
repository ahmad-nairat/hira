import type { CSSProperties } from 'react'
import type { OrgBranding } from '../types/api'

/**
 * Compute a slightly-darker "ink" version of the brand color for hover/link states.
 */
function darken(hex: string, amount = 0.18): string {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m || m.length < 3) return hex
  const [r, g, b] = m.map((x) => parseInt(x, 16))
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))))
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

export function getBrandStyles(org: OrgBranding): CSSProperties {
  return {
    ['--brand' as keyof CSSProperties]: org.primaryColor,
    ['--brand-ink' as keyof CSSProperties]: darken(org.primaryColor),
    ['--brand-soft' as keyof CSSProperties]: hexToRgba(org.primaryColor, 0.07),
    ['--brand-soft-strong' as keyof CSSProperties]: hexToRgba(org.primaryColor, 0.14),
  } as CSSProperties
}

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m || m.length < 3) return `rgba(59, 109, 240, ${a})`
  const [r, g, b] = m.map((x) => parseInt(x, 16))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function heroBackground(org: OrgBranding): CSSProperties {
  const primary = org.primaryColor
  const secondary = org.secondaryColor || '#3DBFB1'
  if (org.careersHeroBgType === 'image' && org.careersHeroBgValue) {
    return {
      backgroundImage: `linear-gradient(rgba(13,24,50,0.45), rgba(13,24,50,0.45)), url(${org.careersHeroBgValue})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  if (org.careersHeroBgType === 'pattern1') {
    return {
      background: `radial-gradient(120% 60% at 20% 20%, ${primary} 0%, ${secondary} 100%)`,
    }
  }
  if (org.careersHeroBgType === 'pattern2') {
    return {
      background: `linear-gradient(135deg, ${primary} 0%, #1a1a1f 100%)`
    }
  }
  // solid (default) — use a subtle gradient on top of the primary for depth
  return {
    background: `linear-gradient(180deg, ${primary} 0%, ${darken(primary, 0.2)} 100%)`,
  }
}
