'use client'

import { Settings, AlertCircle, Building, Briefcase } from 'lucide-react'

export default function CompanySettings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-emerald-400" /> Company Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure your company profile and hiring preferences.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Briefcase size={16} className="text-emerald-400" /> Company Profile</h2>
        <div className="space-y-3">
          {[
            { label: 'Company Name', placeholder: 'Your company name' },
            { label: 'Industry', placeholder: 'e.g. Technology, Finance' },
            { label: 'Website', placeholder: 'https://...' },
            { label: 'Company Size', placeholder: 'e.g. 50-200' },
            { label: 'GST Number', placeholder: 'Optional' },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Building size={16} className="text-blue-400" /> Hiring Preferences</h2>
        <div className="space-y-3">
          {[
            { label: 'Minimum ATS Score', placeholder: '0', type: 'number' },
            { label: 'Minimum CGPA', placeholder: '0.0', type: 'number' },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
          ))}
          {[
            { label: 'Require Police Verification', desc: 'Only show candidates with verified PCC', enabled: false },
            { label: 'Require Aadhaar KYC', desc: 'Only show identity-verified candidates', enabled: true },
            { label: 'Require Degree', desc: 'Only show candidates with verified degree', enabled: true },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-sm text-white/80">{p.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{p.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all ${p.enabled ? 'bg-emerald-500' : 'bg-white/10'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${p.enabled ? 'left-5' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        <AlertCircle size={14} />
        <span>Preference changes affect your talent search filter defaults.</span>
      </div>

      <button className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:translate-y-[-1px]" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 24px rgba(16,185,129,0.25)' }}>
        Save Settings
      </button>
    </div>
  )
}
