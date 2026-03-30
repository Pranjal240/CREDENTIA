export default function UniversityOutreach() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">University Outreach</h1>
        <p className="text-white/50 text-sm mt-1">Review and approve pending university registration requests.</p>
      </div>
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold font-heading text-white">University Affiliations</h2>
        <p className="text-sm text-white/40 max-w-sm text-center mt-2">
          No pending university requests require your attention at the moment.
        </p>
      </div>
    </div>
  )
}
