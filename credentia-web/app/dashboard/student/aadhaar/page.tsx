'use client'

import { DocumentFlow, type FlowConfig } from '@/components/dash/document-flow'
import { ErrorState, PageHeader, PageSkeleton } from '@/components/dash/kit'
import { useStudentData } from '@/hooks/use-student-data'

const CONFIG: FlowConfig = {
  uploadFolder: 'aadhaar',
  analyzeUrl: '/api/verify-aadhaar',
  verb: 'Verify Aadhaar',
}

export default function AadhaarPage() {
  const { userId, byType, loading, error, refresh } = useStudentData()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Aadhaar" description="Upload your Aadhaar card to confirm your identity. The AI reads your name, date of birth, gender, state and the last four digits. Only those last four digits are saved in your profile data." />
      {loading ? <PageSkeleton metrics={0} panels={1} /> : error ? <ErrorState message={error} onRetry={refresh} /> : userId ? <DocumentFlow type="aadhaar" current={byType.aadhaar} config={CONFIG} onSaved={refresh} /> : null}
    </div>
  )
}
