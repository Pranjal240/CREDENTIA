'use client'

import { useState } from 'react'
import { ArrowRight, Download, FileText, GraduationCap, ShieldCheck, Sparkles, Users, Briefcase, Home, Mail, MapPin, BookOpen } from 'lucide-react'
import { GithubLogo as Github, LinkedinLogo as Linkedin, XLogo as Twitter } from '@phosphor-icons/react'
import { SiteHeader } from '@/components/site/site-header'
import { Button, SmoothButton } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import BlurOutUp from '@/components/smoothui/components/blur-out-up'
import GooeyTextReveal from '@/components/ui/gooey-text-reveal'
import MorphText from '@/components/ui/morph-text'
import AILoader from '@/components/smoothui/components/ai-loader'
import SiriOrb from '@/components/smoothui/components/siri-orb'
import { type AIState, useSimulatedAmplitude } from '@/components/smoothui/components/ai-core'
import AIConversation from '@/components/smoothui/components/ai-conversation'
import AIMessage from '@/components/smoothui/components/ai-message'
import AIReasoning from '@/components/smoothui/components/ai-reasoning'
import AIToolCall from '@/components/smoothui/components/ai-tool-call'
import AIResponse from '@/components/smoothui/components/ai-response'
import PinnedList, { type PinnedListItem } from '@/components/smoothui/components/pinned-list'
import GlassFolder from '@/components/ui/glass-folder'
import { FolderWindow, type FolderEntry } from '@/components/shell/folder-window'
import GlassDock from '@/components/ui/glass-dock'
import ExpandableBentoGrid from '@/components/ui/expandable-bento-grid'
import SearchModal from '@/components/ui/search-modal'
import { Plus } from '@phosphor-icons/react'

const STATES: AIState[] = ['idle', 'listening', 'thinking', 'streaming', 'done', 'error']

function StateOrb({ state }: { state: AIState }) {
  const amplitude = useSimulatedAmplitude(state)
  return (
    <div className="flex flex-col items-center gap-2">
      <SiriOrb amplitude={amplitude} size="72px" state={state} />
      <span className="text-xs text-muted-foreground">{state}</span>
    </div>
  )
}

// Fixtures, review only.
const FIXTURE_ENTRIES: FolderEntry[] = [
  { id: '1', name: 'Resume final.pdf', kind: 'pdf', meta: 'PDF, 1.2 MB', date: '12 Nov 2026', timestamp: 3, status: { label: 'Verified', tone: 'success' }, copyValue: 'https://example.test/a', details: [{ label: 'ATS score', value: '82' }], href: '/' },
  { id: '2', name: 'Police certificate.pdf', kind: 'pdf', meta: 'PDF, 640 KB', date: '09 Nov 2026', timestamp: 2, status: { label: 'Pending', tone: 'warning' } },
  { id: '3', name: 'Aadhaar front.jpg', kind: 'image', meta: 'JPG, 2.1 MB', date: '02 Nov 2026', timestamp: 1, status: { label: 'Rejected', tone: 'danger' } },
  { id: '4', name: 'Degree.pdf', kind: 'doc', meta: 'PDF, 980 KB', date: '28 Oct 2026', timestamp: 0, status: { label: 'Verified', tone: 'success' } },
]

const FIXTURE_PINS: PinnedListItem[] = [
  { id: 'a', icon: <Users className="size-4" />, title: 'Candidate one', meta: 'Fixture row' },
  { id: 'b', icon: <FileText className="size-4" />, title: 'Candidate two', meta: 'Fixture row' },
  { id: 'c', icon: <ShieldCheck className="size-4" />, title: 'Candidate three', meta: 'Fixture row' },
]

const BENTO = [
  { id: 'student', title: 'Student portal', subtitle: 'Upload once, share one verified link.', description: 'For students', icon: <GraduationCap className="size-6" />, content: <p>Fixture body for the expanded card.</p>, href: '/login/student', ctaLabel: 'Open portal', className: 'lg:col-span-2' },
  { id: 'company', title: 'Company portal', subtitle: 'Search verified talent.', description: 'For companies', icon: <Briefcase className="size-6" />, content: <p>Fixture body for the expanded card.</p>, href: '/for-companies' },
  { id: 'uni', title: 'University portal', subtitle: 'Manage your registry.', description: 'For universities', icon: <Users className="size-6" />, content: <p>Fixture body for the expanded card.</p>, href: '/login/university' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h2 className="eyebrow">{title}</h2>
      {children}
    </section>
  )
}

export default function UiGallery() {
  const [pinned, setPinned] = useState<string[]>(['a'])
  const [folderOpen, setFolderOpen] = useState(false)
  const [origin, setOrigin] = useState<DOMRect | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [phase, setPhase] = useState<'thinking' | 'streaming' | 'done'>('done')

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-24 px-4 pb-40 pt-32">
        <header className="space-y-3">
          <p className="eyebrow">Development only</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            <BlurOutUp>Credentia component gallery</BlurOutUp>
          </h1>
          <p className="max-w-2xl text-muted-foreground">Every shared component on the black and red system. All data below is fixture data for review.</p>
        </header>

        <Section title="Liquid buttons">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Get started<ArrowRight className="size-4" /></Button>
            <Button variant="default">Log in</Button>
            <Button variant="accent">Learn more</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="default" href="/pricing">As a link</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Smooth buttons and copy">
          <div className="flex flex-wrap items-center gap-3">
            <SmoothButton color="accent" variant="solid">Solid</SmoothButton>
            <SmoothButton color="accent" variant="soft">Soft</SmoothButton>
            <SmoothButton variant="outline">Outline</SmoothButton>
            <SmoothButton variant="ghost">Ghost</SmoothButton>
            <SmoothButton color="destructive" variant="solid">Destructive</SmoothButton>
            <SmoothButton color="green" variant="soft">Success</SmoothButton>
            <SmoothButton color="accent" variant="solid" loading>Loading</SmoothButton>
            <SmoothButton size="icon" variant="outline" aria-label="Download"><Download /></SmoothButton>
            <CopyButton value="https://credentiaonline.in/verify/fixture" />
          </div>
        </Section>

        <Section title="Text motion">
          <div className="space-y-8">
            <MorphText words={['VERIFY', 'TRUST', 'HIRE', 'SHARE']} interval={2600} fontSize="clamp(2.5rem, 9vw, 6rem)" subtext="One profile, four proofs" />
            <GooeyTextReveal mode="scroll" className="max-w-2xl space-y-3">
              <h3 className="text-2xl font-bold">Text that resolves out of a blur as it scrolls in</h3>
              <p className="text-muted-foreground">Each line sharpens in turn. Resize the window and the lines re split so nothing breaks mid word.</p>
            </GooeyTextReveal>
          </div>
        </Section>

        <Section title="AI loader, orb and chat">
          <div className="flex flex-wrap items-center gap-8">
            <AILoader label="Reading the document" variant="bar" showElapsed />
            <AILoader label="Checking" variant="dots" />
            <AILoader label="Extracting" variant="grid" />
          </div>
          <div className="flex flex-wrap gap-6">
            {STATES.map((s) => (
              <StateOrb key={s} state={s} />
            ))}
          </div>
          <div className="glass flex h-[26rem] max-w-xl flex-col rounded-3xl p-4">
            <AIConversation className="flex-1" contentKey={phase}>
              <div className="flex flex-col gap-5 pb-2">
                <AIMessage from="user" timestamp="14:32">Which of my documents are verified?</AIMessage>
                <AIMessage avatar={<SiriOrb size="26px" state={phase} />} copyText="Two of four documents are verified." from="assistant" onRetry={() => setPhase('thinking')} timestamp="14:32">
                  <div className="flex flex-col gap-3">
                    <AIReasoning isStreaming={phase === 'thinking'}>Checked each document status in the verifications table.</AIReasoning>
                    <AIToolCall name="get_my_verifications" status={phase === 'thinking' ? 'running' : 'success'} summary="4 rows" result={<span>2 verified, 1 pending, 1 rejected</span>} />
                    {phase === 'thinking' ? <AILoader label="Thinking" variant="dots" /> : <AIResponse text="Two of four documents are verified [1]. Your police certificate is still pending." citations={[{ id: '1', index: 1, title: 'Verifications' }]} />}
                  </div>
                </AIMessage>
              </div>
            </AIConversation>
          </div>
          <div className="flex gap-2">
            <SmoothButton size="sm" variant="outline" onClick={() => setPhase('thinking')}>Thinking</SmoothButton>
            <SmoothButton size="sm" variant="outline" onClick={() => setPhase('done')}>Done</SmoothButton>
          </div>
        </Section>

        <Section title="Folders and file window">
          <div className="flex flex-wrap gap-10">
            <GlassFolder
              label="Documents"
              art="crimson"
              files={FIXTURE_ENTRIES.map((e) => ({ name: e.name, meta: e.meta }))}
              mode="window"
              onActivate={(rect) => {
                setOrigin(rect)
                setFolderOpen(true)
              }}
              width={300}
            />
            <GlassFolder label="Evidence" art="obsidian" seed={7} files={[{ name: 'Report', meta: 'PDF' }]} mode="window" onActivate={(r) => { setOrigin(r); setFolderOpen(true) }} width={300} appearDelay={120} />
            <GlassFolder label="Archive" art="ember" seed={11} files={[]} mode="window" onActivate={(r) => { setOrigin(r); setFolderOpen(true) }} width={300} appearDelay={240} />
          </div>
          <FolderWindow open={folderOpen} onClose={() => setFolderOpen(false)} title="Documents" subtitle="Fixture files" entries={FIXTURE_ENTRIES} originRect={origin} actions={<SmoothButton size="sm" color="accent" variant="solid"><Plus size={14} />Upload</SmoothButton>} />
        </Section>

        <Section title="Pinned list">
          <div className="max-w-md">
            <PinnedList items={FIXTURE_PINS} pinnedIds={pinned} onPinnedChange={setPinned} maxPinned={2} label="Fixture pins" emptyPinnedMessage="Pin a row to keep it up here." />
          </div>
        </Section>

        <Section title="Quick access dock">
          <GlassDock
            items={[
              { title: 'Home', icon: Home, morph: 'home', href: '/' },
              { title: 'Blog', icon: BookOpen, morph: 'blog', href: '/blog' },
              { title: 'Location', icon: MapPin, morph: 'marker', href: '/contact' },
              { title: 'Email', icon: Mail, morph: 'email', href: 'mailto:hello@example.test' },
              { title: 'LinkedIn', icon: Linkedin, morph: 'linkedin', href: 'https://www.linkedin.com' },
              { title: 'X', icon: Twitter, morph: 'x', href: 'https://x.com' },
              { title: 'GitHub', icon: Github, morph: 'github', href: 'https://github.com' },
              { title: 'Assistant', icon: Sparkles, onClick: () => {} },
            ]}
          />
        </Section>

        <Section title="Expandable bento grid">
          <ExpandableBentoGrid items={BENTO} />
        </Section>

        <Section title="Search">
          <Button variant="default" onClick={() => setSearchOpen(true)}>Open search (Ctrl K)</Button>
          <SearchModal
            modal
            open={searchOpen}
            onOpenChange={setSearchOpen}
            placeholder="Search students, companies, documents"
            tags={[{ label: 'People', icon: <Users className="size-4" /> }, { label: 'Documents', icon: <FileText className="size-4" /> }]}
            results={[{ name: 'Fixture Person', meta: 'person@example.test', badge: { label: 'Verified', tone: 'success' } }, { name: 'Another Person', meta: 'other@example.test' }]}
            quickActions={[{ label: 'Open verifications', shortcut: 'V' }]}
            files={[{ name: 'Resume', ext: '.pdf', verified: true }]}
          />
        </Section>
      </main>
    </>
  )
}
