'use client'

import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { CircleCheck, ExternalLink, FileUp, RotateCcw, X } from 'lucide-react'
import AILoader from '@/components/smoothui/components/ai-loader'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/utils'
import { formatDateShort } from '@/lib/format'
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT, UPLOAD_ACCEPT_TEXT, docLabel, type DocType, type UploadFolder } from '@/lib/documents'
import type { VerificationRow } from '@/hooks/use-student-data'
import { AnalysisReport } from './analysis-report'
import { Panel, StatusBadge } from './kit'

type Analysis = Record<string, any>

export interface FlowConfig {
  /** Where the file is kept in storage. Must be one of the folders the server lists. */
  uploadFolder: UploadFolder
  /** The route that reads the document. Leave out for a document that is stored without the AI. */
  analyzeUrl?: string
  /** Extra fields sent to that route, for example the marksheet class. */
  analyzeExtra?: Record<string, unknown>
  /** Also writes a row to the documents table, as the marksheet pages always did. */
  documentSlot?: '10th' | '12th' | 'other'
  /** Label of the main button, for example "Analyze resume". */
  verb: string
}

type Phase = 'idle' | 'ready' | 'uploading' | 'reading' | 'review' | 'saving' | 'saved'

/** What the read step returns. The seal is the server's signed copy of the result, and it is what Save sends back. */
interface Outcome {
  analysis: Analysis
  status: string
  seal: string | null
}

/** One stage for each real request, with the pause for the student's review between reading and saving. */
const STAGES = [
  { id: 'uploading', label: 'Upload' },
  { id: 'reading', label: 'Read' },
  { id: 'review', label: 'Review' },
  { id: 'saving', label: 'Save' },
] as const

const WORKING_LABEL: Record<string, string> = {
  uploading: 'Uploading your file',
  reading: 'Reading the document',
  saving: 'Saving to your profile',
}

const MESSAGE: Record<string, string> = {
  ai_approved: 'The AI accepted this document. Save it to add it to your profile.',
  verified: 'The AI accepted this document. Save it to add it to your profile.',
  needs_review: 'An admin needs to check this document before it counts. Save it and it goes to the review queue.',
  pending: 'This document is stored as it is. Save it to add it to your profile.',
  rejected: 'The AI did not accept this document. You can save it for an admin to look at, or upload a clearer file.',
}

async function withRetry<T>(run: () => Promise<T>, tries = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run()
    } catch (error) {
      const message = (error as Error).message
      const transient = message === 'Failed to fetch' || message === 'Load failed'
      if (attempt >= tries || !transient) throw error
      await new Promise((resolve) => setTimeout(resolve, Math.min(2000 * 2 ** (attempt - 1), 8000)))
    }
  }
}

const friendly = (message: string) =>
  message === 'Failed to fetch' || message === 'Load failed' ? 'The server could not be reached. Check your connection and try again in a few seconds.' : message

/**
 * Upload, read, review and save for one document. Nothing reaches the profile
 * until the student has looked at what the AI found and pressed Save. The saved
 * result is shown first when there is one.
 *
 * Nothing here is believed by the server. The student is the signed in session,
 * the file must be one this student uploaded, and the AI's result and the
 * decision made from it come back from the read step sealed by the server.
 * Save sends that seal back untouched, so the page can show the result but
 * cannot change it.
 */
export function DocumentFlow({
  type,
  current,
  config,
  onSaved,
}: {
  type: DocType
  current?: VerificationRow
  config: FlowConfig
  onSaved: () => void
}) {
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [file, setFile] = React.useState<File | null>(null)
  const [replacing, setReplacing] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fileUrl, setFileUrl] = React.useState('')
  const [result, setResult] = React.useState<Outcome | null>(null)

  const hasSaved = Boolean(current && current.status !== 'not_submitted')
  const showSaved = hasSaved && !replacing && (phase === 'idle' || phase === 'ready')

  const reset = () => {
    setPhase('idle')
    setFile(null)
    setError('')
    setFileUrl('')
    setResult(null)
    setReplacing(false)
  }

  const onDrop = React.useCallback((accepted: File[], rejected: unknown[]) => {
    if (rejected.length > 0) {
      setError(`That file cannot be used. ${UPLOAD_ACCEPT_TEXT}`)
      return
    }
    if (accepted[0]) {
      setFile(accepted[0])
      setError('')
      setPhase('ready')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: UPLOAD_ACCEPT, maxFiles: 1, maxSize: MAX_UPLOAD_BYTES })

  /** Reads the uploaded file. The result comes back decided and sealed by the server. */
  const read = async (url: string): Promise<Outcome> => {
    if (!config.analyzeUrl) {
      // Stored without the AI. This summary is only for the screen, the server builds the record itself.
      return { analysis: { document_type: docLabel(type), file_name: file?.name ?? null, file_size_mb: file ? (file.size / 1048576).toFixed(2) : null, status: 'uploaded', confidence: 0 }, status: 'pending', seal: null }
    }
    setPhase('reading')
    const data = await withRetry(async () => {
      const res = await fetch(config.analyzeUrl as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url, ...config.analyzeExtra }),
        signal: AbortSignal.timeout(58_000),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) throw new Error(body.error || 'The document could not be read.')
      return body as { analysis?: Analysis; status?: string; seal?: string }
    })
    if (!data.seal || !data.status) throw new Error('The document could not be read.')
    return { analysis: data.analysis ?? {}, status: data.status, seal: data.seal }
  }

  const start = async () => {
    if (!file) return
    setError('')
    setPhase('uploading')
    try {
      const uploaded = await withRetry(async () => {
        const body = new FormData()
        body.append('file', file)
        body.append('folder', config.uploadFolder)
        const res = await fetch('/api/upload', { method: 'POST', body })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) throw new Error(data.error || 'The upload failed.')
        return data as { url: string }
      })
      setFileUrl(uploaded.url)
      setResult(await read(uploaded.url))
      setPhase('review')
    } catch (err) {
      const message = (err as Error).name === 'TimeoutError' ? 'Reading is taking too long. Try a smaller or clearer file.' : friendly((err as Error).message)
      setError(message)
      setPhase('ready')
    }
  }

  const save = async () => {
    if (!result) return
    setError('')
    setPhase('saving')
    try {
      const res = await fetch('/api/save-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.analyzeUrl ? { type, seal: result.seal } : { type, fileUrl }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'The record could not be saved.')

      if (config.documentSlot && file) {
        // Older records of these documents also live in the documents table. The main record is saved already, so a failure here is not shown.
        await fetch('/api/save-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: config.documentSlot, fileUrl, fileName: file.name, fileSize: file.size }),
        }).catch(() => undefined)
      }
      setPhase('saved')
      onSaved()
    } catch (err) {
      setError(friendly((err as Error).message))
      setPhase('review')
    }
  }

  const working = phase === 'uploading' || phase === 'reading' || phase === 'saving'
  const stages = config.analyzeUrl ? STAGES : STAGES.filter((stage) => stage.id !== 'reading')
  const stageIndex = stages.findIndex((stage) => stage.id === phase)

  return (
    <div className="space-y-3">
      {showSaved && current ? (
        <Panel
          title="Saved result"
          subtitle={current.updated_at ? `Last updated ${formatDateShort(current.updated_at)}` : undefined}
          action={<StatusBadge status={current.status} />}
        >
          <AnalysisReport type={type} result={current.ai_result} confidence={current.ai_confidence} />
          {current.status === 'rejected' && current.rejection_reason ? (
            <p role="status" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Reason from the reviewer: {current.rejection_reason}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            {current.document_url ? (
              <>
                <Button href={current.document_url} target="_blank" rel="noreferrer" variant="default" size="sm">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open file
                </Button>
                <CopyButton value={current.document_url} />
              </>
            ) : null}
            <SmoothButton size="sm" variant="ghost" shape="pill" onClick={() => setReplacing(true)}>
              <RotateCcw aria-hidden="true" />
              Replace file
            </SmoothButton>
          </div>
        </Panel>
      ) : null}

      {!showSaved && (phase === 'idle' || phase === 'ready') ? (
        <Panel title={hasSaved ? 'Replace the file' : 'Upload'} subtitle={UPLOAD_ACCEPT_TEXT}>
          <div
            {...getRootProps({
              'aria-label': 'Choose a file or drop it here',
              className: cn(
                'grid min-h-[200px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80',
                isDragActive ? 'border-brand bg-brand/10' : file ? 'border-success/50 bg-success/[0.05]' : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]',
              ),
            })}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-brand-ink">
                <FileUp className="size-6" aria-hidden="true" />
              </span>
              {file ? (
                <>
                  <p className="max-w-full break-all text-sm font-bold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1048576).toFixed(2)} MB. Press to choose a different file.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">{isDragActive ? 'Drop the file here' : 'Drop a file here or press to browse'}</p>
                  <p className="text-xs text-muted-foreground">{UPLOAD_ACCEPT_TEXT}</p>
                </>
              )}
            </div>
          </div>

          {file ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={start}>
                {config.verb}
              </Button>
              <SmoothButton variant="ghost" shape="pill" onClick={() => { setFile(null); setPhase('idle') }}>
                <X aria-hidden="true" />
                Remove
              </SmoothButton>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {working ? (
        <Panel>
          <div className="grid place-items-center gap-5 py-8 text-center" role="status" aria-live="polite">
            <AILoader variant="bar" label={WORKING_LABEL[phase]} showElapsed />
            <ol className="flex flex-wrap items-center justify-center gap-2" aria-label="Progress">
              {stages.map((stage, i) => (
                <li
                  key={stage.id}
                  aria-current={i === stageIndex ? 'step' : undefined}
                  className={cn('rounded-lg border px-3 py-1 text-xs font-bold', i < stageIndex ? 'border-success/40 bg-success/10 text-success' : i === stageIndex ? 'border-brand/50 bg-brand/15 text-brand-ink' : 'border-white/10 text-muted-foreground')}
                >
                  {stage.label}
                </li>
              ))}
            </ol>
            <p className="max-w-sm text-xs text-muted-foreground">
              {phase === 'saving' ? 'Saving your result and updating your scores. Please keep this page open.' : 'A scanned file can take up to a minute. Please keep this page open.'}
            </p>
          </div>
        </Panel>
      ) : null}

      {phase === 'review' && result ? (
        <Panel title="What the AI found" subtitle="Nothing is saved yet. Check it, then save it to your profile." action={<StatusBadge status={result.status} />}>
          <AnalysisReport type={type} result={result.analysis} confidence={(result.analysis.confidence as number | undefined) ?? null} />
          <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground/85">
            {MESSAGE[result.status] ?? 'Save it to add it to your profile.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            <Button variant="primary" onClick={save}>
              Save to profile
            </Button>
            <SmoothButton variant="ghost" shape="pill" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Start again
            </SmoothButton>
          </div>
        </Panel>
      ) : null}

      {phase === 'saved' ? (
        <Panel>
          <div className="grid place-items-center gap-3 py-8 text-center" role="status">
            <CircleCheck className="size-12 text-success" aria-hidden="true" />
            <p className="text-base font-extrabold">Saved to your profile</p>
            <p className="max-w-sm text-sm text-muted-foreground">Your scores and records are updating now. You can see this document on the My Verifications page.</p>
            <SmoothButton variant="outline" shape="pill" onClick={reset}>
              Done
            </SmoothButton>
          </div>
        </Panel>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
