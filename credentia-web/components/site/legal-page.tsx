import * as React from 'react'
import { InfoPage, Prose } from '@/components/site/info-kit'

/** Renders **bold** markers as strong text, without injecting HTML. */
export function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <React.Fragment key={i}>{part}</React.Fragment>,
  )
}

export interface LegalSection {
  title: string
  items: string[]
}

/** A policy page: an optional introduction followed by numbered sections of bullet points. */
export function LegalPage({
  title,
  subtitle,
  intro,
  sections,
  children,
}: {
  title: string
  subtitle: string
  intro?: string
  sections: LegalSection[]
  children?: React.ReactNode
}) {
  return (
    <InfoPage title={title} subtitle={subtitle} width="max-w-4xl">
      <Prose>
        {intro ? <p>{inline(intro)}</p> : null}
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{inline(item)}</li>
              ))}
            </ul>
          </section>
        ))}
        {children}
      </Prose>
    </InfoPage>
  )
}
