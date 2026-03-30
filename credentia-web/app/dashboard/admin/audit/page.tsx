export default function AuditLogs() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">Audit Logs</h1>
        <p className="text-white/50 text-sm mt-1">Review history of administrative actions taken on the platform.</p>
      </div>
      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold font-heading text-white">Security Timeline</h2>
        <p className="text-sm text-white/40 max-w-sm text-center mt-2">
          Logs are currently being indexed and retained securely. Detailed views will appear here soon.
        </p>
      </div>
    </div>
  )
}
