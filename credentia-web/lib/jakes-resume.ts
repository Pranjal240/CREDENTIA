/**
 * Builds LaTeX in the style of Jake's resume, the one page, single column layout most often used on Overleaf
 * and read well by applicant tracking systems. The AI only supplies plain fields. The LaTeX is written here,
 * with every value escaped, so a resume can never inject a command into the document.
 */

export interface ResumeEducation {
  school: string
  location: string
  degree: string
  dates: string
}
export interface ResumeExperience {
  role: string
  company: string
  location: string
  dates: string
  bullets: string[]
}
export interface ResumeProject {
  name: string
  tech: string
  dates: string
  bullets: string[]
}
export interface ResumeData {
  name: string
  phone: string
  email: string
  linkedin: string
  github: string
  education: ResumeEducation[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  skills: { label: string; items: string }[]
}

const SPECIAL: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
}

/** Escapes text so it is safe inside a LaTeX document. */
export function escapeLatex(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\&%$#_{}~^]/g, (ch) => SPECIAL[ch])
}

const has = (value: string) => value.trim().length > 0

function bulletList(bullets: string[]): string {
  const items = bullets.filter(has).slice(0, 6)
  if (items.length === 0) return ''
  return `      \\resumeItemListStart\n${items.map((b) => `        \\resumeItem{${escapeLatex(b)}}`).join('\n')}\n      \\resumeItemListEnd\n`
}

const PREAMBLE = String.raw`%-------------------------
% Resume in the style of Jake's resume. Open this file in Overleaf and compile with pdfLaTeX.
%-------------------------
\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}
\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}
\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}
`

/** The finished .tex file for the fields given. Empty sections are left out. */
export function renderJakesResume(data: ResumeData): string {
  const contact = [
    has(data.phone) ? escapeLatex(data.phone) : '',
    has(data.email) ? `\\href{mailto:${escapeLatex(data.email)}}{\\underline{${escapeLatex(data.email)}}}` : '',
    has(data.linkedin) ? `\\href{https://${escapeLatex(data.linkedin.replace(/^https?:\/\//, ''))}}{\\underline{${escapeLatex(data.linkedin.replace(/^https?:\/\//, ''))}}}` : '',
    has(data.github) ? `\\href{https://${escapeLatex(data.github.replace(/^https?:\/\//, ''))}}{\\underline{${escapeLatex(data.github.replace(/^https?:\/\//, ''))}}}` : '',
  ].filter(Boolean)

  let out = PREAMBLE
  out += `\n\\begin{center}\n    \\textbf{\\Huge \\scshape ${escapeLatex(data.name) || 'Your Name'}} \\\\ \\vspace{1pt}\n`
  if (contact.length) out += `    \\small ${contact.join(' $|$ ')}\n`
  out += `\\end{center}\n`

  if (data.education.length) {
    out += `\n\\section{Education}\n  \\resumeSubHeadingListStart\n`
    for (const e of data.education.slice(0, 4)) {
      out += `    \\resumeSubheading\n      {${escapeLatex(e.school)}}{${escapeLatex(e.location)}}\n      {${escapeLatex(e.degree)}}{${escapeLatex(e.dates)}}\n`
    }
    out += `  \\resumeSubHeadingListEnd\n`
  }

  if (data.experience.length) {
    out += `\n\\section{Experience}\n  \\resumeSubHeadingListStart\n`
    for (const x of data.experience.slice(0, 5)) {
      out += `\n    \\resumeSubheading\n      {${escapeLatex(x.role)}}{${escapeLatex(x.dates)}}\n      {${escapeLatex(x.company)}}{${escapeLatex(x.location)}}\n${bulletList(x.bullets)}`
    }
    out += `  \\resumeSubHeadingListEnd\n`
  }

  if (data.projects.length) {
    out += `\n\\section{Projects}\n    \\resumeSubHeadingListStart\n`
    for (const p of data.projects.slice(0, 5)) {
      const title = has(p.tech) ? `\\textbf{${escapeLatex(p.name)}} $|$ \\emph{${escapeLatex(p.tech)}}` : `\\textbf{${escapeLatex(p.name)}}`
      out += `      \\resumeProjectHeading\n          {${title}}{${escapeLatex(p.dates)}}\n${bulletList(p.bullets)}`
    }
    out += `    \\resumeSubHeadingListEnd\n`
  }

  const skills = data.skills.filter((s) => has(s.label) && has(s.items))
  if (skills.length) {
    out += `\n\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n`
    out += skills.map((s) => `     \\textbf{${escapeLatex(s.label)}}{: ${escapeLatex(s.items)}}`).join(' \\\\\n')
    out += `\n    }}\n \\end{itemize}\n`
  }

  out += `\n\\end{document}\n`
  return out
}

/** The steps shown with the code. Plain words, in order. */
export const OVERLEAF_STEPS = [
  'Copy the code, or press Download to save it as resume.tex.',
  'Go to overleaf.com and create a free account, or sign in.',
  'Choose New Project, then Blank Project, and give it a name such as My Resume.',
  'Open main.tex, select everything, delete it, and paste the code you copied. If you downloaded the file, use Upload instead.',
  'Press Recompile. Your resume appears on the right as a one page PDF.',
  'Read every line. Fix anything the AI got wrong and add what is missing, then recompile.',
  'Press Download PDF. This is the file to send to companies and to upload to job sites.',
]

/** Habits that keep a resume readable by applicant tracking systems. */
export const ATS_HABITS = [
  'Use one column and standard headings such as Education, Experience, Projects and Skills.',
  'Start each bullet with a strong verb and give a number where you can.',
  'Copy the exact skill words from the job description, where they are true for you.',
  'Keep it to one page unless you have several years of experience.',
]
