'use client'

import { Settings, Building, Shield, GraduationCap, AlertCircle } from 'lucide-react'

export default function UniversitySettings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-indigo-400" /> University Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure your institution preferences and verification policies.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Building size={16} className="text-indigo-400" /> Institution Profile</h2>
        <div className="space-y-3">
          {[
            { label: 'Institution Name', placeholder: 'Enter your university name' },
            { label: 'UGC ID', placeholder: 'e.g. UGC-12345' },
            { label: 'NAAC Grade', placeholder: 'e.g. A+' },
            { label: 'State', placeholder: 'e.g. Maharashtra' },
            { label: 'City', placeholder: 'e.g. Mumbai' },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><GraduationCap size={16} className="text-amber-400" /> Verification Policies</h2>
        <div className="space-y-3">
          {[
            { label: 'Auto-approve degree certificates', desc: 'When AI confidence is above threshold', enabled: false },
            { label: 'Share student data with companies', desc: 'Allow verified companies to view student profiles', enabled: true },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-sm text-white/80">{p.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{p.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-all ${p.enabled ? 'bg-indigo-500' : 'bg-white/10'} relative`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${p.enabled ? 'left-5' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        <AlertCircle size={14} />
        <span>University profile updates require admin verification before going live.</span>
      </div>

      <button className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:translate-y-[-1px]" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.25)' }}>
        Save Settings
      </button>
    </div>
  )
}
