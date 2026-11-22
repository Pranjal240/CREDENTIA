'use client'

import { DocumentFlow, type FlowConfig } from '@/components/dash/document-flow'
import { ErrorState, PageHeader, PageSkeleton } from '@/components/dash/kit'
import { useStudentData } from '@/hooks/use-student-data'

const CONFIG: FlowConfig = {
  uploadFolder: 'police',
  analyzeUrl: '/api/verify-police',
  verb: 'Verify certificate',
}

export default function PolicePage() {
  const { userId, byType, loading, error, refresh } = useStudentData()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Police certificate" description="Upload your police clearance certificate. The AI reads the certificate number, authority, district and dates, and sends anything it is unsure about to an admin." />
      {loading ? <PageSkeleton metrics={0} panels={1} /> : error ? <ErrorState message={error} onRetry={refresh} /> : userId ? <DocumentFlow type="police" current={byType.police} config={CONFIG} onSaved={refresh} /> : null}
    </div>
  )
}
