'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, ShieldCheck, Fingerprint, GraduationCap, Copy, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function StudentDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, students(share_token)')
      .eq('id', user.id)
      .single()
    
    // Fetch verifications
    const { data: vData } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', user.id)

    setProfile({
      ...profileData,
      public_linkToken: profileData?.students?.[0]?.share_token || null
    })
    setVerifications(vData || [])
    setLoading(false)
  }

  const copyLink = () => {
    if (profile?.public_linkToken) {
      navigator.clipboard.writeText(`${window.location.origin}/verify/${profile.public_linkToken}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>

  // Calculate overall progress based on 4 metrics
  const docs = [
    { type: 'resume', label: 'Resume', icon: FileText, route: '/dashboard/student/resume' },
    { type: 'police', label: 'Police Record', icon: ShieldCheck, route: '/dashboard/student/police' },
    { type: 'aadhaar', label: 'Aadhaar ID', icon: Fingerprint, route: '/dashboard/student/aadhaar' },
    { type: 'degree', label: 'Degree', icon: GraduationCap, route: '/dashboard/student/degree' }
  ]

  const totalVerified = docs.filter(d => verifications.some(v => v.type === d.type && v.status === 'verified')).length
  const progressPercent = (totalVerified / 4) * 100

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-[family-name:var(--font-dm-sans)]">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#13131A] p-6 rounded-2xl border border-[#2A2A3A]">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-[family-name:var(--font-syne)] tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-[#9999AA] mt-1">Complete your profile to generate your trusted link.</p>
        </div>
        
        {/* Public Link Generator / Copier */}
        <div className="bg-[#0A0A0F] p-4 rounded-xl border border-[#2A2A3A] min-w-[300px]">
          <p className="text-xs text-[#9999AA] mb-2 uppercase tracking-wider font-bold">Your Public Link</p>
          {profile?.public_linkToken ? (
            <div className="flex items-center gap-2">
              <input 
                readOnly
                value={`${window.location.origin}/verify/${profile.public_linkToken}`}
                className="bg-transparent text-[#F5C542] text-sm w-full outline-none truncate font-medium"
              />
              <button 
                onClick={copyLink}
                className="p-2 hover:bg-[#2A2A3A] rounded-lg transition-colors shrink-0 text-white"
              >
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
             <Link href="/dashboard/student/my-link" className="text-sm font-semibold text-[#F5C542] hover:text-white transition-colors">
               Generate Link →
             </Link>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#13131A] p-6 rounded-2xl border border-[#2A2A3A]">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-syne)]">Trust Score</h2>
            <p className="text-sm text-[#9999AA]">Verify documents to increase your score</p>
          </div>
          <span className="text-3xl font-black text-[#F5C542] font-[family-name:var(--font-syne)]">{progressPercent}%</span>
        </div>
        <div className="w-full bg-[#0A0A0F] rounded-full h-3 overflow-hidden border border-[#2A2A3A]">
          <div 
            className="bg-gradient-to-r from-[#F5C542] to-yellow-300 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Documents Grid */}
      <h2 className="text-xl font-bold text-white font-[family-name:var(--font-syne)] pt-4">Your Credentials</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {docs.map((doc) => {
          const v = verifications.find(x => x.type === doc.type)
          const isVerified = v?.status === 'verified'
          
          return (
            <Link 
              href={doc.route}
              key={doc.type}
              className="bg-[#13131A] p-6 rounded-2xl border border-[#2A2A3A] hover:border-[#F5C542]/50 hover:shadow-[0_0_20px_rgba(245,197,66,0.1)] transition-all group flex flex-col items-start"
            >
              <div className={`p-3 rounded-xl mb-4 ${isVerified ? 'bg-green-500/10 text-green-400' : 'bg-[#1C1C26] text-[#9999AA] group-hover:text-[#F5C542]'}`}>
                <doc.icon size={24} />
              </div>
              <h3 className="font-bold text-white font-[family-name:var(--font-syne)]">{doc.label}</h3>
              <p className="text-sm mt-1 text-[#9999AA]">
                {isVerified ? 'Verified ✓' : 'Pending verification'}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
