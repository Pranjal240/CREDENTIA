'use client'

import { motion } from 'framer-motion'
import { ShieldAlert, Clock, Building2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function PendingApproval() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-[#0e0e14] border border-white/10 rounded-[2rem] p-8 text-center relative overflow-hidden shadow-2xl"
      >
        <div className="absolute w-[200px] h-[200px] bg-orange-500/20 rounded-full blur-[80px] -top-20 -right-20 pointer-events-none" />
        
        <div className="w-20 h-20 mx-auto bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-center justify-center text-orange-400 mb-6 shadow-inner relative z-10">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="font-heading text-2xl font-black text-white mb-3">Account Setup Pending</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Welcome to Credentia! Your university account is currently under review by our administration team. You will receive an email once your account has been fully verified and activated.
        </p>
        
        <div className="space-y-3 mb-8 text-left">
          {[
            { icon: Building2, text: 'Account Created', done: true },
            { icon: ShieldAlert, text: 'Identity & UGC Verification', done: false, active: true },
            { icon: CheckCircle2, text: 'Platform Access Granted', done: false }
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${step.active ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' : step.done ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-white/[0.02] border-white/5 text-white/30'}`}>
              {step.done ? <CheckCircle2 size={18} /> : step.active ? <Clock size={18} className="animate-pulse" /> : <div className="w-4 h-4 rounded-full border-2 border-current ml-0.5" />}
              <span className="text-sm font-medium">{step.text}</span>
            </div>
          ))}
        </div>
        
        <Link 
          href="/" 
          className="inline-flex w-full items-center justify-center h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-colors text-sm"
        >
          Return to Home
        </Link>
      </motion.div>
    </div>
  )
}
