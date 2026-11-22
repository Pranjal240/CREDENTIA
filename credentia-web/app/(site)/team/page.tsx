import type { Metadata } from 'next'
import Image from 'next/image'
import { InfoPage } from '@/components/site/info-kit'

export const metadata: Metadata = { title: 'Team', description: 'The people behind Credentia.' }

interface Person {
  name: string
  role: string
  img: string
  position: string
  bio: string
}

const FOUNDERS: Person[] = [
  { name: 'Pranjal Mishra', role: 'Founder, CEO and Senior Developer', img: '/team/pranjal.png', position: '50% 0%', bio: 'Building the trust layer for credentials in India, so hiring fraud gets harder and honest students get easier to believe.' },
  { name: 'Kriti Ahlawat', role: 'Co-founder, Product', img: '/team/kriti.png', position: '50% 50%', bio: 'Shapes the product and the partnerships across education and hiring, with a focus on verification that feels simple.' },
  { name: 'Pragya Mishra', role: 'Co-founder, Design', img: '/team/pragya-mishra.png', position: '30% 0%', bio: 'Designs and builds the interfaces people use every day, from the first upload to the shared profile.' },
  { name: 'Sourav', role: 'Co-founder, Engineering', img: '/team/sourav.png', position: '50% 0%', bio: 'Builds the backend and integrations that keep verification fast and dependable.' },
]

const CONTRIBUTORS: Person[] = [
  { name: 'Nihal Kumar', role: 'Founder and Manager', img: '/team/NIHAL Kumar.png', position: '50% 50%', bio: 'Designs the verification systems and keeps the platform secure and dependable as it grows.' },
  { name: 'Harshita Sangwan', role: 'Founder and Backend Developer', img: '/team/Harshita Sangwan.png', position: '50% 15%', bio: 'Builds the backend services and data pipelines that make credential verification reliable.' },
]

function Group({ title, people }: { title: string; people: Person[] }) {
  return (
    <section className="mt-14 first:mt-0">
      <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {people.map((person) => (
          <li key={person.name} className="glass-flat overflow-hidden rounded-2xl sm:last:odd:col-span-1">
            <div className="relative aspect-[4/5] w-full bg-white/[0.04]">
              <Image
                src={person.img}
                alt={person.name}
                fill
                sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 90vw"
                className="object-cover"
                style={{ objectPosition: person.position }}
              />
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold">{person.name}</h3>
              <p className="mt-0.5 text-xs font-semibold text-brand-ink">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function TeamPage() {
  return (
    <InfoPage eyebrow="Team" title="The people behind Credentia" subtitle="A small team building a verification platform for students, companies and universities." width="max-w-6xl">
      <Group title="Founders" people={FOUNDERS} />
      <Group title="Contributors" people={CONTRIBUTORS} />
    </InfoPage>
  )
}
