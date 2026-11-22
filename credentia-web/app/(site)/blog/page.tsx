import type { Metadata } from 'next'
import { PenLine } from 'lucide-react'
import { InfoPage } from '@/components/site/info-kit'
import { EmptyState } from '@/components/dash/kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Blog' }

export default function BlogPage() {
  return (
    <InfoPage eyebrow="Blog" title="Writing is on the way" subtitle="We are preparing articles on how verification works, what we learn building it, and tips for students.">
      <div className="glass-flat mx-auto max-w-2xl rounded-3xl">
        <EmptyState
          className="py-16"
          icon={<PenLine />}
          title="No articles yet"
          hint="Nothing is published here yet. Until it is, the best place to see how Credentia works is the guide."
          action={
            <Button href="/how-it-works" variant="primary" size="sm">
              Read how it works
            </Button>
          }
        />
      </div>
    </InfoPage>
  )
}
