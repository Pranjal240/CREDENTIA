import { CONTACT_EMAIL } from '@/lib/site-config'

export interface HelpTopic {
  id: string
  title: string
  keywords: string[]
  body: string
  href: string
}

/**
 * What Peon knows about the platform. Every entry describes something the code
 * really does today. When the product changes, change this file with it.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'how-it-works',
    title: 'How Credentia works',
    keywords: ['how', 'work', 'works', 'start', 'process', 'steps', 'flow', 'what is credentia', 'about'],
    body: 'Students upload a resume, a police certificate, an Aadhaar card and a degree certificate as a PDF or an image. AI reads each document and returns its fields with a confidence score. When the AI is not sure, the document goes to an admin for a decision. Verified documents appear on one profile that can be shared with a public link and a QR code. Companies search verified students and universities see their own students.',
    href: '/how-it-works',
  },
  {
    id: 'documents',
    title: 'Documents you can verify',
    keywords: ['document', 'documents', 'upload', 'accepted', 'which', 'types', 'resume', 'police', 'aadhaar', 'degree', 'marksheet', '10th', '12th', 'pdf', 'image'],
    body: 'The four core documents are the resume, the police certificate, the Aadhaar card and the degree certificate. The 10th and 12th marksheets are extra documents that add to the trust score. Each one is uploaded on its own page of the student dashboard as a PDF or an image, up to 10 MB.',
    href: '/features',
  },
  {
    id: 'statuses',
    title: 'What the statuses mean',
    keywords: ['status', 'statuses', 'pending', 'review', 'needs review', 'rejected', 'approved', 'verified', 'not submitted', 'ai verified', 'admin verified', 'why', 'flagged'],
    body: 'Not submitted means nothing was uploaded yet. AI verified means the AI read the document with enough confidence. Needs review means the AI was unsure, so an admin will decide. Admin verified means an admin approved it. Rejected means the document was not accepted, and the reason is shown on its page so it can be uploaded again.',
    href: '/how-it-works',
  },
  {
    id: 'trust-score',
    title: 'Trust score',
    keywords: ['trust', 'score', 'trust score', 'points', 'calculated', 'calculate', 'increase', 'improve'],
    body: 'The trust score is out of 100. Each verified core document (resume, police certificate, Aadhaar, degree) adds about 21 points, which makes 85 for all four. Each verified extra document (10th marksheet, 12th marksheet, additional credential) adds 5 points, up to 15 in total. Verifying more documents is the only way to raise it.',
    href: '/features',
  },
  {
    id: 'ats-score',
    title: 'ATS score',
    keywords: ['ats', 'resume score', 'keywords', 'resume', 'cv', 'improve resume'],
    body: 'The ATS score from 0 to 100 comes from the AI reading the resume: how clearly the skills, experience and education are written and which keywords are present or missing. The resume page also lists strengths and suggested improvements. It is an AI assessment, not a guarantee of how an employer system will rank the resume.',
    href: '/features',
  },
  {
    id: 'aadhaar',
    title: 'Aadhaar and privacy',
    keywords: ['aadhaar', 'aadhar', 'identity', 'id', 'privacy', 'last four', 'digits', 'safe'],
    body: 'From an Aadhaar card the AI reads the name, date of birth, gender, state and the last four digits of the number. Only the last four digits are saved in the profile data. The file that is uploaded is stored in Cloudflare R2 object storage.',
    href: '/data-security',
  },
  {
    id: 'share-link',
    title: 'The verified share link',
    keywords: ['share', 'link', 'qr', 'public', 'profile', 'visible', 'visibility', 'private', 'views', 'companies see'],
    body: 'The My Link page creates one public link and a QR code for the profile. The link and the company talent search work only while the profile is public. Students can switch that on or off in Settings, and admins can also switch it off. The page shows how many times the profile was viewed.',
    href: '/features',
  },
  {
    id: 'companies',
    title: 'For companies',
    keywords: ['company', 'companies', 'hire', 'hiring', 'recruit', 'talent', 'candidates', 'applicants', 'search', 'filter', 'job description'],
    body: 'The company portal searches students who made their profile public. Companies can filter by ATS score, verified documents, CGPA, course and graduation year, paste a job description to rank candidates with AI, save candidates and review applicants. Company accounts are created at registration and can be switched off by an admin.',
    href: '/for-companies',
  },
  {
    id: 'universities',
    title: 'For universities',
    keywords: ['university', 'universities', 'college', 'institution', 'registry', 'cgpa records', 'approval', 'approved'],
    body: 'A university sees the students linked to it, which documents each has verified, and can keep CGPA records up to date. A new university account waits for admin approval before the registry opens.',
    href: '/about',
  },
  {
    id: 'data',
    title: 'Where data lives',
    keywords: ['data', 'storage', 'stored', 'secure', 'security', 'privacy', 'ai provider', 'gemini', 'groq', 'delete', 'database'],
    body: 'Accounts and verification results live in a Supabase database. Uploaded files are stored in Cloudflare R2. To read a document its content is sent to an AI provider, Google Gemini first and Groq as a backup for text, which handle it under their own terms. Admin overrides are written to an audit log.',
    href: '/data-security',
  },
  {
    id: 'account',
    title: 'Signing in and passwords',
    keywords: ['login', 'log in', 'sign in', 'signin', 'password', 'forgot', 'reset', 'google', 'register', 'sign up', 'account', 'create account'],
    body: 'Sign in with Google or with an email and password on the page for your portal: student, company or university. Passwords can be reset from the Forgot password link on the sign in page. New accounts are created on the Create account page.',
    href: '/login',
  },
  {
    id: 'pricing',
    title: 'Pricing',
    keywords: ['price', 'pricing', 'cost', 'free', 'pay', 'plan', 'plans', 'pro', 'enterprise'],
    body: 'Credentia is free for students. A Pro plan is marked as coming soon and an Enterprise plan for companies and universities is handled through the contact page.',
    href: '/pricing',
  },
  {
    id: 'support',
    title: 'Talking to a person',
    keywords: ['support', 'human', 'person', 'help', 'contact', 'email', 'problem', 'issue', 'bug', 'complain'],
    body: `The support team can be reached from Peon: ask for a person and the conversation is sent to the admins, who reply in the Support Inbox view of that conversation. Email also works at ${CONTACT_EMAIL}.`,
    href: '/contact',
  },
]

const words = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)

/** The best matching topics for a question, most relevant first. */
export function findTopics(question: string, limit = 3): HelpTopic[] {
  const asked = words(question)
  if (asked.length === 0) return HELP_TOPICS.slice(0, limit)

  const scored = HELP_TOPICS.map((topic) => {
    let score = 0
    for (const keyword of topic.keywords) {
      const parts = words(keyword)
      if (parts.length > 1 && question.toLowerCase().includes(keyword)) score += 3
      else if (parts.some((part) => asked.includes(part))) score += 1
    }
    if (asked.some((w) => topic.title.toLowerCase().includes(w))) score += 1
    return { topic, score }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)

  return (scored.length ? scored.map((entry) => entry.topic) : HELP_TOPICS.slice(0, 1)).slice(0, limit)
}
