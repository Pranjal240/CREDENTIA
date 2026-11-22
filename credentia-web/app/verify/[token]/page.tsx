import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CreditCard, Eye, FileText, GraduationCap, Paperclip, Shield, ShieldCheck } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/dash/kit'
import { ShareBlock } from '@/components/site/share-block'

// A shared profile belongs to its owner, so it stays out of search results.
export const metadata: Metadata = { title: 'Verified profile', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

type Verification = { type: string; status: string; ai_result?: Record<string, any> | null }

const VERIFIED = ['ai_approved', 'admin_verified', 'verified']
const PENDING = ['pending', 'needs_review']

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const { data: student } = await supabaseAdmin.from('students').select('*').eq('share_token', params.token).eq('profile_is_public', true).single()
  if (!student) notFound()

  const views = (student.profile_views || 0) + 1
  await supabaseAdmin.from('students').update({ profile_views: views }).eq('share_token', params.token)

  const { data } = await supabaseAdmin.from('verifications').select('*').eq('student_id', student.id).order('updated_at', { ascending: false })
  const verifications = (data ?? []) as Verification[]

  const name: string = student.name || 'Verified student'
  const get = (type: string) => verifications.find((v) => v.type === type)
  const state = (v?: Verification) => (v && VERIFIED.includes(v.status) ? 'verified' : v && PENDING.includes(v.status) ? 'pending' : 'none')
  const join = (...parts: (string | number | null | undefined)[]) => parts.filter(Boolean).join(', ')

  const resume = get('resume')
  const police = get('police')
  const aadhaar = get('aadhaar')
  const degree = get('degree')
  const tenth = get('marksheet_10th')
  const twelfth = get('marksheet_12th')
  const other = get('passport')

  const items = [
    { icon: FileText, label: 'Resume', v: resume, detail: resume?.ai_result?.ats_score ? `ATS score ${resume.ai_result.ats_score} out of 100` : '' },
    { icon: Shield, label: 'Police certificate', v: police, detail: state(police) === 'verified' ? join(police?.ai_result?.district || police?.ai_result?.state || 'Background checked') : '' },
    { icon: CreditCard, label: 'Aadhaar identity', v: aadhaar, detail: state(aadhaar) === 'verified' ? join(student.aadhaar_name || aadhaar?.ai_result?.name, student.aadhaar_state || aadhaar?.ai_result?.state) : '' },
    { icon: GraduationCap, label: 'Degree certificate', v: degree, detail: state(degree) === 'verified' ? join(student.course || degree?.ai_result?.course, `CGPA ${student.cgpa || degree?.ai_result?.grade_cgpa || 'not stated'}`) : '' },
    { icon: BookOpen, label: '10th marksheet', v: tenth, detail: state(tenth) === 'verified' ? join(tenth?.ai_result?.board_name || 'Board', tenth?.ai_result?.percentage || tenth?.ai_result?.grade) : '' },
    { icon: FileText, label: '12th marksheet', v: twelfth, detail: state(twelfth) === 'verified' ? join(twelfth?.ai_result?.board_name || 'Board', twelfth?.ai_result?.percentage || twelfth?.ai_result?.grade) : '' },
    { icon: Paperclip, label: 'Additional credential', v: other, detail: '' },
  ]
  const verifiedCount = items.filter((i) => state(i.v) === 'verified').length

  const trust: number = student.trust_score || 0
  const ringColor = trust >= 70 ? 'rgb(var(--success))' : trust >= 40 ? 'rgb(var(--warning))' : 'rgb(var(--danger))'
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://credentiaonline.in'}/verify/${params.token}`

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="glass-flat inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-success">
            <ShieldCheck className="size-[18px]" aria-hidden="true" />
            Verified by Credentia
          </span>
        </div>

        <main className="glass-strong rounded-3xl p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/20 text-xl font-extrabold" aria-hidden="true">
              {name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-extrabold tracking-tight">{name}</h1>
              {student.course ? <p className="truncate text-sm text-muted-foreground">{join(student.course, student.graduation_year)}</p> : null}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {verifiedCount} of {items.length} verified
              </p>
            </div>

            <div className="relative size-16 shrink-0" role="img" aria-label={`Trust score ${trust} out of 100`}>
              <svg viewBox="0 0 80 80" className="size-16 -rotate-90" aria-hidden="true">
                <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="36" pathLength="100" stroke={ringColor} strokeWidth="6" fill="none" strokeDasharray="100" strokeDashoffset={100 - trust} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                <span className="text-sm font-extrabold leading-none">{trust}</span>
                <span className="mt-0.5 text-[8px] font-bold leading-none text-muted-foreground">TRUST</span>
              </div>
            </div>
          </div>

          <ul className="space-y-2.5">
            {items.map((item) => {
              const s = state(item.v)
              return (
                <li key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <item.icon className="size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      {item.detail ? <span className="block truncate text-xs text-muted-foreground">{item.detail}</span> : null}
                    </div>
                  </div>
                  <Badge tone={s === 'verified' ? 'success' : s === 'pending' ? 'warning' : 'neutral'} className="shrink-0">
                    {s === 'verified' ? 'Verified' : s === 'pending' ? 'Pending review' : 'Not verified'}
                  </Badge>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 border-t border-white/10 pt-5">
            <ShareBlock url={url} />
          </div>
        </main>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Eye className="size-3" aria-hidden="true" />
          {views.toLocaleString('en-IN')} profile views
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Powered by <span className="font-extrabold text-brand-ink">Credentia</span>
          </Link>
        </p>
      </div>
    </div>
  )
}
