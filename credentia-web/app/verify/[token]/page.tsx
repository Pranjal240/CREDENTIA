import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { CheckCircle2, XCircle, FileText, Shield, CreditCard, GraduationCap, Eye, BookOpen, Paperclip, Clock } from 'lucide-react'

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('share_token', params.token)
    .eq('profile_is_public', true)
    .single()

  if (!student) notFound()

  await supabaseAdmin.from('students').update({ profile_views: (student.profile_views || 0) + 1 }).eq('share_token', params.token)

  const { data: verifications } = await supabaseAdmin
    .from('verifications')
    .select('*')
    .eq('student_id', student.id)
    .order('updated_at', { ascending: false })

  const name = student.name || 'Verified Student'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const getVerif = (type: string) => verifications?.find(v => v.type === type)
  const isVerified = (v: any) => v && ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
  const isPending = (v: any) => v && ['pending', 'needs_review'].includes(v.status)

  const resumeV = getVerif('resume')
  const policeV = getVerif('police')
  const aadhaarV = getVerif('aadhaar')
  const degreeV = getVerif('degree')
  const tenthV = getVerif('marksheet_10th')
  const twelfthV = getVerif('marksheet_12th')
  const otherV = getVerif('passport')

  const trustScore = student.trust_score || 0
  const trustColor = trustScore >= 70 ? '#22c55e' : trustScore >= 40 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 36

  const getStatusLabel = (v: any, notSubmittedLabel = 'Not verified') => {
    if (!v) return notSubmittedLabel
    if (isVerified(v)) return 'Verified ✓'
    if (isPending(v)) return 'Pending Review'
    if (v.status === 'rejected') return 'Not verified'
    return notSubmittedLabel
  }

  const items = [
    {
      icon: FileText,
      label: 'Resume',
      verified: isVerified(resumeV),
      pending: isPending(resumeV),
      detail: resumeV?.ai_result?.ats_score ? `ATS Score: ${resumeV.ai_result.ats_score}/100` : getStatusLabel(resumeV, 'Not submitted'),
    },
    {
      icon: Shield,
      label: 'Police Certificate',
      verified: isVerified(policeV),
      pending: isPending(policeV),
      detail: isVerified(policeV)
        ? `Clear — ${policeV?.ai_result?.district || policeV?.ai_result?.state || 'Background Checked'}`
        : getStatusLabel(policeV),
    },
    {
      icon: CreditCard,
      label: 'Aadhaar KYC',
      verified: isVerified(aadhaarV),
      pending: isPending(aadhaarV),
      detail: isVerified(aadhaarV)
        ? `${student.aadhaar_name || aadhaarV?.ai_result?.name || ''} — ${student.aadhaar_state || aadhaarV?.ai_result?.state || ''}`
        : getStatusLabel(aadhaarV),
    },
    {
      icon: GraduationCap,
      label: 'Degree Certificate',
      verified: isVerified(degreeV),
      pending: isPending(degreeV),
      detail: isVerified(degreeV)
        ? `${student.course || degreeV?.ai_result?.course || ''} — CGPA ${student.cgpa || degreeV?.ai_result?.grade_cgpa || 'N/A'}`
        : getStatusLabel(degreeV),
    },
    ...(tenthV ? [{
      icon: BookOpen,
      label: '10th Marksheet',
      verified: isVerified(tenthV),
      pending: isPending(tenthV),
      detail: isVerified(tenthV)
        ? `${tenthV.ai_result?.board_name || 'Board'} — ${tenthV.ai_result?.percentage || tenthV.ai_result?.grade || 'Verified'}`
        : getStatusLabel(tenthV),
    }] : []),
    ...(twelfthV ? [{
      icon: FileText,
      label: '12th Marksheet',
      verified: isVerified(twelfthV),
      pending: isPending(twelfthV),
      detail: isVerified(twelfthV)
        ? `${twelfthV.ai_result?.board_name || 'Board'} — ${twelfthV.ai_result?.percentage || twelfthV.ai_result?.grade || 'Verified'}`
        : getStatusLabel(twelfthV),
    }] : []),
    ...(otherV ? [{
      icon: Paperclip,
      label: 'Additional Credential',
      verified: isVerified(otherV),
      pending: isPending(otherV),
      detail: getStatusLabel(otherV),
    }] : []),
  ]

  const verifiedCount = items.filter(i => i.verified).length

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Verified by Credentia badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold text-sm">Verified by CREDENTIA</span>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 mb-4">

          {/* Identity + Trust Ring */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center text-black font-bold text-xl flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl text-white truncate">{name}</h2>
              {student.course && (
                <p className="text-[#9999AA] text-sm truncate">
                  {student.course}{student.graduation_year ? ` — ${student.graduation_year}` : ''}
                </p>
              )}
              <p className="text-xs text-[#9999AA] mt-0.5">{verifiedCount}/{items.length} verified</p>
            </div>

            {/* Trust Score ring */}
            <div className="relative flex-shrink-0 w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="36"
                  stroke={trustColor}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - trustScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-bold text-sm text-white leading-none">{trustScore}</span>
                <span className="text-[8px] text-[#9999AA] font-medium leading-none mt-0.5">TRUST</span>
              </div>
            </div>
          </div>

          {/* Verification items */}
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                item.verified ? 'bg-green-500/5 border-green-500/20' :
                item.pending ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-[#1C1C26] border-[#2A2A3A]'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon size={15} className={
                    item.verified ? 'text-green-400 flex-shrink-0' :
                    item.pending ? 'text-amber-400 flex-shrink-0' :
                    'text-[#9999AA] flex-shrink-0'
                  } />
                  <div className="min-w-0">
                    <span className="text-sm text-white block">{item.label}</span>
                    <span className={`text-xs truncate block ${
                      item.verified ? 'text-green-400/70' :
                      item.pending ? 'text-amber-400/70' :
                      'text-[#9999AA]'
                    }`}>{item.detail}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {item.verified
                    ? <CheckCircle2 size={16} className="text-green-400" />
                    : item.pending
                    ? <Clock size={16} className="text-amber-400" />
                    : <XCircle size={16} className="text-[#9999AA]" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Views */}
        <div className="flex items-center justify-center gap-2 text-[#9999AA] text-xs mb-4">
          <Eye size={12} />
          <span>{(student.profile_views || 0) + 1} profile views</span>
        </div>

        {/* Footer */}
        <div className="text-center">
          <a href="https://credentiaonline.in" className="text-[#9999AA] text-xs hover:text-[#F5C542] transition-colors">
            Powered by <span className="font-bold text-[#F5C542]">CREDENTIA</span>
          </a>
        </div>
      </div>
    </div>
  )
}
