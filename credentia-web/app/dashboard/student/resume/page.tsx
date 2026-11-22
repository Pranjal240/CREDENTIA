'use client'

import { DocumentFlow, type FlowConfig } from '@/components/dash/document-flow'
import { ErrorState, PageHeader, PageSkeleton } from '@/components/dash/kit'
import { ResumeTools } from '@/components/dash/resume-tools'
import { useStudentData } from '@/hooks/use-student-data'

const CONFIG: FlowConfig = {
  uploadFolder: 'resumes',
  analyzeUrl: '/api/analyze-resume',
  verb: 'Analyze resume',
}

export default function ResumePage() {
  const { userId, byType, loading, error, refresh } = useStudentData()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Resume" description="Upload and save your resume to get a free ATS score, your top skills and what to improve. Then check it against a job, or get it as LaTeX for Overleaf. Companies see your score on your profile." />
      {loading ? <PageSkeleton metrics={0} panels={1} /> : error ? <ErrorState message={error} onRetry={refresh} /> : userId ? (
        <>
          <DocumentFlow type="resume" current={byType.resume} config={CONFIG} onSaved={refresh} />
          <ResumeTools hasResume={Boolean(byType.resume?.document_url && byType.resume.status !== 'not_submitted')} />
        </>
      ) : null}
    </div>
  )
}
