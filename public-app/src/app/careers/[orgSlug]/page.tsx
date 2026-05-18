import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CareersHeader from '../../../components/careers/CareersHeader'
import CareersHero from '../../../components/careers/Hero'
import JobsList from '../../../components/careers/JobsList'
import CareersFooter from '../../../components/careers/CareersFooter'
import { getOrgCareers, ApiError } from '../../../lib/api'
import { getBrandStyles } from '../../../lib/brand'

interface PageProps { params: { orgSlug: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { data } = await getOrgCareers(params.orgSlug)
    return {
      title: `Careers at ${data.org.name}`,
      description: `${data.org.name} is hiring. Browse open positions.`,
    }
  } catch {
    return { title: 'Careers' }
  }
}

export default async function CareersPage({ params }: PageProps) {
  let result
  try {
    result = await getOrgCareers(params.orgSlug)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
  const { org, jobs } = result.data
  return (
    <div style={getBrandStyles(org)} className="bg-white min-h-screen text-ink">
      <CareersHeader org={org} />
      <CareersHero org={org} openRoles={jobs.length} teamSize={60} locations={2} remoteFriendly />
      <JobsList jobs={jobs} orgSlug={params.orgSlug} />
      <CareersFooter org={org} />
    </div>
  )
}
