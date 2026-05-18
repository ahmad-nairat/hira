import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Upload } from 'lucide-react'
import { orgsApi } from '../../api/orgs.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'

const PRESETS = ['#6D5EF7', '#5B9DF8', '#3FCB7E', '#FF8A6B', '#F4C75A', '#E370C7', '#1A1A1F']

export default function BrandingSettingsPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const org = useQuery({ queryKey: ['org', orgId], queryFn: () => orgsApi.get(orgId) })
  const [primary, setPrimary] = useState('#6D5EF7')
  const [secondary, setSecondary] = useState('#3DBFB1')
  const [headline, setHeadline] = useState('')
  const [subhead, setSubhead] = useState('')
  const [cta, setCta] = useState('See open roles')
  const [bg, setBg] = useState<'solid' | 'pattern1' | 'pattern2' | 'image'>('solid')

  useEffect(() => {
    if (org.data) {
      setPrimary(org.data.primaryColor)
      setSecondary(org.data.secondaryColor)
      setHeadline(org.data.careersHeroHeadline ?? '')
      setSubhead(org.data.careersHeroSubheadline ?? '')
      setCta(org.data.careersCtaLabel)
      const t = org.data.careersHeroBgType
      if (t === 'solid' || t === 'image') setBg(t)
      else setBg('pattern1')
    }
  }, [org.data])

  const save = useMutation({
    mutationFn: () => orgsApi.updateBranding(orgId, {
      primaryColor: primary,
      secondaryColor: secondary,
      careersHeroHeadline: headline || null,
      careersHeroSubheadline: subhead || null,
      careersCtaLabel: cta,
      careersHeroBgType: bg,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', orgId] }),
  })

  if (org.isLoading) return <Spinner block />

  const bgStyle =
    bg === 'pattern1' ? `radial-gradient(at top left, ${primary} 0%, ${secondary} 100%)` :
    bg === 'pattern2' ? `linear-gradient(135deg, ${primary} 0%, #1a1a1f 100%)` :
    bg === 'image' ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=800') center/cover` :
    primary

  return (
    <>
      <SettingsHeader label="Branding" title={<>Careers page <span className="ital">style</span></>} sub="Control how your public careers page looks." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="card p-[22px]">
          <div className="field mb-4">
            <label className="label">Primary color</label>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              {PRESETS.map((c) => (
                <button key={c} className={clsx('swatch', primary === c && 'active')} style={{ background: c }} onClick={() => setPrimary(c)} />
              ))}
              <input className="input w-[100px] font-mono text-xs" value={primary} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </div>
          <div className="field mb-4">
            <label className="label">Secondary color</label>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              {PRESETS.map((c) => (
                <button key={c} className={clsx('swatch', secondary === c && 'active')} style={{ background: c }} onClick={() => setSecondary(c)} />
              ))}
              <input className="input w-[100px] font-mono text-xs" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
            </div>
          </div>
          <div className="field mb-3.5">
            <label className="label">Careers page logo</label>
            <div className="p-[18px] border border-dashed border-border rounded-md text-center text-ink-3 mt-1.5">
              <Upload size={18} className="mx-auto" />
              <div className="text-sm mt-1.5">Drop PNG or SVG · transparent background</div>
            </div>
          </div>
          <Input label="Hero headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <div className="mt-3.5">
            <Textarea label="Hero subheadline" rows={2} value={subhead} onChange={(e) => setSubhead(e.target.value)} />
          </div>
          <div className="field mt-3.5">
            <label className="label">Hero background</label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {(['solid', 'pattern1', 'pattern2', 'image'] as const).map((id) => (
                <button
                  key={id} onClick={() => setBg(id)}
                  className={clsx('h-[60px] rounded-md text-white text-[11px] capitalize font-medium grid place-items-center', bg === id ? 'border-[2px] border-primary' : 'border border-border')}
                  style={{
                    background:
                      id === 'solid' ? primary :
                      id === 'pattern1' ? `radial-gradient(at top left, ${primary} 0%, ${secondary} 100%)` :
                      id === 'pattern2' ? `linear-gradient(135deg, ${primary} 0%, #1a1a1f 100%)` :
                      'var(--surface-3)',
                  }}
                >
                  {id === 'image' ? 'Upload' : id}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3.5">
            <Input label="CTA button label" value={cta} onChange={(e) => setCta(e.target.value)} />
          </div>
          {save.isError && <div className="field-error mt-3">{extractError(save.error)}</div>}
          <div className="flex gap-2 mt-5">
            <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>Save changes</Button>
          </div>
        </div>

        <div>
          <div className="mono-label mb-2">Live preview</div>
          <div className="card overflow-hidden">
            <div className="px-8 py-[60px] text-white" style={{ background: bgStyle }}>
              <div className="font-mono text-xs opacity-70 mb-3">{org.data?.slug}.careers</div>
              <div className="font-serif text-[28px] font-medium tracking-tight leading-[1.15] mb-2.5">{headline || `Join our team`}</div>
              <div className="text-[13px] opacity-85 leading-snug mb-5 max-w-[320px]">{subhead || 'Be part of what comes next.'}</div>
              <button className="bg-white px-5 py-2.5 rounded-md font-semibold text-[13px]" style={{ color: primary }}>{cta} →</button>
            </div>
            <div className="p-[18px] bg-bg">
              <div className="mono-label mb-2">Open roles</div>
              <div className="p-3.5 border border-border-soft rounded-md">
                <div className="text-sm font-semibold text-white">Senior Frontend Engineer</div>
                <div className="text-xs text-ink-4 mt-1">Engineering · Berlin · Remote</div>
                <div className="mt-2 text-xs font-medium" style={{ color: primary }}>Apply →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
