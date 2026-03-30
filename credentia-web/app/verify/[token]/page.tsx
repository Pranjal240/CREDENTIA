import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { CheckCircle2, XCircle, FileText, Shield, CreditCard, GraduationCap, Eye } from 'lucide-react'

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('share_token', params.token)
    .eq('profile_is_public', true)
    .single()

  if (!student) notFound()

  await supabaseAdmin.from('students').update({ profile_views: (student.profile_views || 0) + 1 }).eq('share_token', params.token)

  const { data: verifications } = await supabaseAdmin.from('verifications').select('*').eq('student_id', student.id)

  const name = student.name || 'Verified Student'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const policeV = verifications?.find(v => v.type === 'police')
  const isPoliceVerified = policeV && (policeV.status === 'ai_approved' || policeV.status === 'admin_approved')

  const items = [
    { icon: FileText, label: 'Resume', verified: !!student.ats_score, detail: student.ats_score ? `ATS Score: ${student.ats_score}/100` : 'Not submitted' },
    { icon: Shield, label: 'Police Certificate', verified: isPoliceVerified, detail: isPoliceVerified ? 'Clear Background Check' : (policeV?.status === 'needs_review' ? 'Pending Review' : 'Not verified') },
    { icon: CreditCard, label: 'Aadhaar', verified: student.aadhaar_verified, detail: student.aadhaar_verified ? `${student.aadhaar_name || ''} — ${student.aadhaar_state || ''}` : 'Not verified' },
    { icon: GraduationCap, label: 'Degree', verified: student.degree_verified, detail: student.degree_verified ? `${student.course || ''} — CGPA ${student.cgpa || 'N/A'}` : 'Not verified' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Verified badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold text-sm">Verified by CREDENTIA</span>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center text-black font-bold text-xl">
              {initials}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">{name}</h2>
              {student.course && <p className="text-[#9999AA] text-sm">{student.course} {student.graduation_year ? `— ${student.graduation_year}` : ''}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${item.verified ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1C1C26] border-[#2A2A3A]'}`}>
                <div className="flex items-center gap-3">
                  <item.icon size={16} className={item.verified ? 'text-green-400' : 'text-[#9999AA]'} />
                  <span className="text-sm text-white">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${item.verified ? 'text-green-400' : 'text-[#9999AA]'}`}>{item.detail}</span>
                  {item.verified ? <CheckCircle2 size={14} className="text-green-400" /> : <XCircle size={14} className="text-[#9999AA]" />}
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
