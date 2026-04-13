import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { FileText, Shield, CreditCard, GraduationCap, CheckCircle2, AlertCircle, Clock, XCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Types
type Verification = {
  type: string;
  status: string;
  ai_confidence: number;
  ai_result: any;
  updated_at: string;
}

type Student = {
  full_name: string;
  ats_score: number;
}

export default async function StudentOverview() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  const { data: { session }, error } = await supabase.auth.getSession()
  const user = session?.user

  if (!user || error) {
    redirect('/login/student')
  }

  // Fetch Student Data (column is 'name', not 'full_name')
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('name, ats_score, cgpa, percentage_10th, percentage_12th, trust_score, course, branch, graduation_year')
    .eq('id', user.id)
    .single()

  // Also get the profile name as a fallback
  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Fetch Verifications Data
  const { data: verifications } = await supabaseAdmin
    .from('verifications')
    .select('*')
    .eq('student_id', user.id)

  const vList: Verification[] = verifications || []

  // Check verification counts
  const requiredDocs = ['resume', 'police', 'aadhaar', 'degree', 'marksheet_10th', 'marksheet_12th', 'passport']
  let verifiedCount = 0

  requiredDocs.forEach(type => {
    const doc = vList.find(v => v.type === type)
    if (doc?.status === 'ai_approved' || doc?.status === 'verified' || doc?.status === 'admin_verified') {
      verifiedCount++
    }
  })

  // Set maximum bounds to 100
  const rawPercentage = Math.round((verifiedCount / 7) * 100)
  const completionPercentage = Math.min(100, Math.max(0, rawPercentage))

  // Document Config
  const documents = [
    { type: 'resume', label: 'Resume', desc: 'Get your ATS score with AI', icon: FileText, href: '/dashboard/student/resume' },
    { type: 'police', label: 'Police Check', desc: 'Secure verification via AI', icon: Shield, href: '/dashboard/student/police' },
    { type: 'aadhaar', label: 'Aadhaar Card', desc: 'Fast identity clearance', icon: CreditCard, href: '/dashboard/student/aadhaar' },
    { type: 'degree', label: 'Degree Pass', desc: 'University records check', icon: GraduationCap, href: '/dashboard/student/degree' },
    { type: 'marksheet_10th', label: '10th Marksheet', desc: 'High school records check', icon: FileText, href: '/dashboard/student/saved' },
    { type: 'marksheet_12th', label: '12th Marksheet', desc: 'Senior secondary records check', icon: FileText, href: '/dashboard/student/saved' },
    { type: 'passport', label: 'Other Credentials', desc: 'Certificates and diplomas', icon: FileText, href: '/dashboard/student/saved' },
  ]

  const getBadgeInfo = (status: string | undefined) => {
    switch (status) {
      case 'ai_approved':
      case 'admin_verified':
      case 'verified':
        return { text: 'Verified ✓', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', active: true }
      case 'needs_review':
      case 'pending':
        return { text: 'Needs Review', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', active: true }
      case 'rejected':
        return { text: 'Rejected ✗', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', active: true }
      default:
        return { text: 'Not Uploaded', color: 'text-slate-400', bg: 'bg-slate-800/40', border: 'border-white/5', active: false }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 p-4 md:p-8">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Hi, {(student?.name || profileData?.full_name || 'Student').split(' ')[0]} 👋
          </h1>
          <p className="text-white/50 mt-2 text-lg">Here is your verification progress overview.</p>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-5 w-full md:w-80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/70">Profile Completion</span>
            <span className="text-sm font-bold text-green-400">{completionPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Academic Overview Cards */}
      {(student?.cgpa || student?.percentage_10th || student?.percentage_12th || student?.trust_score) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {[
            { label: 'CGPA', value: student?.cgpa ? String(student.cgpa) : null, color: '#3b82f6', icon: '🎓' },
            { label: '10th %', value: student?.percentage_10th ? `${student.percentage_10th}%` : null, color: '#f59e0b', icon: '📊' },
            { label: '12th %', value: student?.percentage_12th ? `${student.percentage_12th}%` : null, color: '#8b5cf6', icon: '📈' },
            { label: 'Trust Score', value: student?.trust_score ? `${student.trust_score}%` : null, color: '#10b981', icon: '🛡️' },
          ].filter(d => d.value).map((d, i) => (
            <div key={i} className="relative overflow-hidden bg-[#0A0F1C] border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5" style={{ background: `radial-gradient(circle, ${d.color}, transparent)` }} />
              <span className="text-2xl mb-2 block">{d.icon}</span>
              <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{d.label}</p>
              <p className="text-2xl font-bold text-white">{d.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {documents.map((doc) => {
          const record = vList.find(v => v.type === doc.type)
          const badge = getBadgeInfo(record?.status)
          const IconStyle = doc.icon
          
          return (
            <Link 
              key={doc.type} 
              href={doc.href}
              className="group block relative overflow-hidden bg-[#0A0F1C] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
            >
              {/* Top Row: Icon & Badge */}
              <div className="flex items-start justify-between mb-8">
                <div className={`p-3 rounded-xl border ${badge.border} ${badge.bg}`}>
                  <IconStyle className={`w-6 h-6 ${badge.color}`} />
                </div>
                <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${badge.bg} ${badge.color} ${badge.border}`}>
                  {badge.text}
                </div>
              </div>

              {/* Title Area */}
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {doc.label}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{doc.desc}</p>
              </div>

              {/* Bottom Metadata Row */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                
                {/* Confidence / ATS Score */}
                <div className="flex flex-col">
                  {doc.type === 'resume' ? (
                    <>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ATS Score</span>
                      {badge.active ? (
                        <span className="text-2xl font-bold text-white mt-1">
                          {student?.ats_score || record?.ai_confidence || 0}<span className="text-slate-500 text-sm font-normal">/100</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium mt-1">--</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">AI Confidence</span>
                      {badge.active ? (
                        <span className="text-lg font-bold text-white mt-1">
                          {record?.ai_confidence || 0}%
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium mt-1">--</span>
                      )}
                    </>
                  )}
                </div>

                {/* Upload Date */}
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Last Update</span>
                  <div className="flex items-center gap-1.5 text-sm text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(record?.updated_at)}
                  </div>
                </div>

              </div>

              {/* Hover Indicator */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300">
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
