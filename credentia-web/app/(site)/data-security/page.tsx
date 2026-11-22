import type { Metadata } from 'next'
import { Cloud, Eye, Fingerprint, KeyRound, ScrollText, Sparkles } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage } from '@/components/site/info-kit'
import { CONTACT_EMAIL } from '@/lib/site-config'

export const metadata: Metadata = { title: 'Data security', description: 'Where your documents go, who can see them, and what we keep.' }

export default function DataSecurityPage() {
  return (
    <InfoPage eyebrow="Data security" title="Plain facts about your data" subtitle="Where your documents go, who can see them, and what we keep. We only state what is true today.">
      <CardGrid cols={3}>
        <InfoCard icon={<KeyRound />} title="Sign in and roles">
          Accounts use Supabase authentication. Students, companies, universities and admins each see only their own portal.
        </InfoCard>
        <InfoCard icon={<Cloud />} title="Where files live">
          Uploaded documents are kept in Cloudflare R2 object storage. Account and verification data lives in our Supabase database.
        </InfoCard>
        <InfoCard icon={<Sparkles />} title="How documents are read">
          To read a document, its content is sent to an AI provider: Google Gemini, with Groq as a backup. Those providers handle it under their own terms.
        </InfoCard>
        <InfoCard icon={<Fingerprint />} title="Aadhaar">
          Only the last four digits of an Aadhaar number are saved as data, along with the other details you see in your dashboard.
        </InfoCard>
        <InfoCard icon={<Eye />} title="Who can see a profile">
          Companies can find only the students who made their profile public. A shared link also works only while the profile is public.
        </InfoCard>
        <InfoCard icon={<ScrollText />} title="Audit trail">
          Admin overrides and status changes are written to an audit log so decisions can be traced.
        </InfoCard>
      </CardGrid>

      <div className="glass-flat mx-auto mt-10 max-w-3xl rounded-3xl p-6 text-center sm:p-8">
        <h2 className="text-lg font-extrabold">Found a problem?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No system is perfect. If you find a security issue, please write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-ink hover:underline">
            {CONTACT_EMAIL}
          </a>
          . We will read it and reply.
        </p>
      </div>
    </InfoPage>
  )
}
