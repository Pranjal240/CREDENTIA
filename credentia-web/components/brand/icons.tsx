import * as React from 'react'

/**
 * Credentia's own icons, drawn for what they mean instead of borrowed from a
 * generic set. One idea runs through them: a thing, and the seal that says it was
 * checked. Documents carry a small verified seal in the corner, portals carry the
 * mark of what that person does, and the mark itself is a certificate seal with a
 * C whose open mouth holds a check.
 *
 * Every icon draws on a 48 pixel grid in the current text colour, with one red
 * accent. They scale with `className`, for example `size-6`.
 */

type IconProps = { className?: string; title?: string }

const ACCENT = 'rgb(var(--brand-ink))'
const SEAL_FILL = 'rgb(var(--brand))'
const CUT = 'rgb(var(--background))'

const Base = ({ className, title, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    focusable="false"
    data-icon="brand"
  >
    {children}
  </svg>
)

/** A star or a scalloped seal outline, worked out once. */
function starPath(cx: number, cy: number, outer: number, inner: number, points: number, rotate = -90): string {
  const out: string[] = []
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = ((rotate + (i * 180) / points) * Math.PI) / 180
    out.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${out.join('L')}Z`
}

const SEAL_RIM = starPath(24, 24, 22, 19.4, 14)
const POLICE_STAR = starPath(22, 23, 6.4, 2.7, 5)

/** The verified seal that sits in the corner of every document icon. */
function Seal() {
  return (
    <g>
      <circle cx="37" cy="37" r="9.5" fill={CUT} stroke="none" />
      <circle cx="37" cy="37" r="7.6" fill={SEAL_FILL} stroke="none" />
      <path d="M33.4 37.2l2.6 2.6 4.8-5.4" stroke="rgb(var(--on-brand))" strokeWidth="2.2" />
    </g>
  )
}

/** The Credentia mark: a certificate seal, with a C whose mouth holds a check. */
export function CredentiaMark({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d={SEAL_RIM} fill="currentColor" fillOpacity="0.1" strokeWidth="1.8" />
      <path d="M30 16.2A10.5 10.5 0 1 0 30 31.8" strokeWidth="4.2" />
      <path d="M26.6 24.4l3.2 3.4 6.6-8" stroke={ACCENT} strokeWidth="3.4" />
    </Base>
  )
}

/** A person's page: a head, shoulders and lines of text. */
export function ResumeIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M11 6h18l8 8v13M11 6v36h15" />
      <path d="M29 6v8h8" />
      <circle cx="20" cy="21" r="4.2" />
      <path d="M12.8 34c.9-4.6 3.6-6.8 7.2-6.8s6.3 2.2 7.2 6.8" />
      <path d="M27 20h6M27 25h6" stroke={ACCENT} />
      <Seal />
    </Base>
  )
}

/** A police badge with a star. */
export function PoliceIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M22 5l13 5v11c0 8.5-5 14.5-13 18.5C14 35.5 9 29.5 9 21V10z" />
      <path d={POLICE_STAR} fill={ACCENT} stroke={ACCENT} strokeWidth="1.2" />
      <Seal />
    </Base>
  )
}

/** An identity card with a fingerprint. */
export function AadhaarIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <rect x="5" y="10" width="38" height="26" rx="4.5" />
      <path d="M13 28a3 3 0 0 1 6 0M10 28a6 6 0 0 1 12 0M7.5 28a8.5 8.5 0 0 1 17 0" stroke={ACCENT} />
      <path d="M28 19h10M28 25h7" />
      <Seal />
    </Base>
  )
}

/** A graduation cap over a rolled certificate. */
export function DegreeIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M24 7l18 9-18 9-18-9z" />
      <path d="M13 21.5V29c0 3.2 5 6 11 6 2.2 0 4.2-.4 5.8-1" />
      <path d="M42 16v9" stroke={ACCENT} />
      <Seal />
    </Base>
  )
}

/** Two links of a chain, sealed. */
export function ShareIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M20.5 28a7 7 0 0 1 0-10l5-5a7 7 0 0 1 10 10l-2.5 2.5" />
      <path d="M27.5 20a7 7 0 0 1 0 10l-5 5a7 7 0 0 1-10-10l2.5-2.5" stroke={ACCENT} />
      <Seal />
    </Base>
  )
}

/** A student, with a path rising to the right. */
export function StudentIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <circle cx="19" cy="15" r="6" />
      <path d="M7 41c0-8 5-13 12-13 3 0 5.600 1 7.600 2.800" />
      <path d="M28 40l5-6 4 3.500 7-9" stroke={ACCENT} />
      <path d="M39.500 27.500H44V32" stroke={ACCENT} />
    </Base>
  )
}

/** A building whose wing holds a check. */
export function CompanyIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M9 42V11l17-6v37M6 42h36" />
      <path d="M15 17h5M15 24h5M15 31h5" />
      <path d="M26 21l13 4.500V42" />
      <path d="M29.500 33l3 3 5-6" stroke={ACCENT} />
    </Base>
  )
}

/** A hall with columns, and a crest in its pediment. */
export function UniversityIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M5 18L24 7l19 11z" />
      <circle cx="24" cy="14" r="2.200" fill={ACCENT} stroke="none" />
      <path d="M12 22v15M20 22v15M28 22v15M36 22v15" />
      <path d="M6 42h36M8.500 38.500h31" />
    </Base>
  )
}

/** A page with an arrow going up into it. */
export function UploadIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M12 6h16l8 8v28H12z" />
      <path d="M28 6v8h8" />
      <path d="M24 37V24M18 29.500l6-6 6 6" stroke={ACCENT} />
    </Base>
  )
}

/** A page being read by a beam. */
export function ScanIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M12 6h16l8 8v28H12z" />
      <path d="M28 6v8h8" />
      <path d="M17 19h8M17 33h12" />
      <path d="M7 26h34" stroke={ACCENT} strokeWidth="2.800" />
    </Base>
  )
}

/** A person whose work is being checked. */
export function ReviewIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <circle cx="19" cy="16" r="6" />
      <path d="M7 41c0-8 5-13 12-13 2.500 0 4.600.7 6.400 2" />
      <circle cx="34" cy="33" r="8" stroke={ACCENT} />
      <path d="M30.300 33.200l2.700 2.700 4.800-5.400" stroke={ACCENT} />
    </Base>
  )
}

/** Bars rising, with a line above them. */
export function AnalyticsIcon({ className, title }: IconProps) {
  return (
    <Base className={className} title={title}>
      <path d="M7 41h34M13 41V29M24 41V20M35 41V26" />
      <path d="M9 18l9-7 8 5 13-10" stroke={ACCENT} />
    </Base>
  )
}
