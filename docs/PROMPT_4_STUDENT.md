# PROMPT 4 — STUDENT DASHBOARD + ALL VERIFICATION PORTALS
# Paste into Antigravity (Claude Opus 4.6). Attach 01_PROJECT_OVERVIEW.md + 02_WEBSITE_FRONTEND.md.

---

Build the complete student dashboard and all 5 verification portal pages. These pages are the CORE product. They must be fully functional — uploads go to Cloudflare R2, AI analysis runs via Groq, results save to Supabase.

Design: same as landing — #0A0A0F bg, glass cards, #F5C542 accents, Syne headings, Framer Motion animations.

---

## FILE 1 — `credentia-web/app/dashboard/student/page.tsx`

Complete student dashboard with real data from Supabase.

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, ExternalLink, Copy, Check, Zap, ArrowRight } from 'lucide-react'
import { getScoreColor } from '@/lib/utils'
```

**Load data on mount:**
```typescript
useEffect(() => {
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const [profileRes, studentRes, verificationsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('students').select('*').eq('id', user.id).single(),
      supabase.from('verifications').select('*').eq('student_id', user.id),
    ])
    
    // Auto-create student row if first time
    let studentData = studentRes.data
    if (!studentData) {
      await supabase.from('students').insert({ id: user.id })
      const fresh = await supabase.from('students').select('*').eq('id', user.id).single()
      studentData = fresh.data
    }
    
    setCurrentUser(user)
    setProfile(profileRes.data)
    setStudent(studentData)
    setVerifications(verificationsRes.data || [])
    setLoading(false)
  }
  load()
}, [])
```

**Dashboard UI layout:**

```
┌─────────────────────────────────────────────────────┐
│  Hey [Name]! 👋          [Notification] [Profile]   │
├─────────────────────────────────────────────────────┤
│  [ATS: 94]  [Police: ✅] [Aadhaar: ✅] [Degree: —]  │
├───────────────────────────────┬─────────────────────┤
│  VERIFICATION TASKS           │   ATS SCORE GAUGE   │
│  ✅ Resume Uploaded (94/100)  │                     │
│  ⏳ Police Certificate        │      94             │
│  ✅ Aadhaar Verified          │   /100              │
│  ○  Degree Certificate        │  [SVG circle]       │
│  ━━━━━━━━━━━━━━━━ 2/4 done    │                     │
├───────────────────────────────┴─────────────────────┤
│  SHAREABLE LINK: credentiaonline.in/verify/[token]  │
│  [Copy] [WhatsApp] [LinkedIn] [Open]                │
└─────────────────────────────────────────────────────┘
```

**Top stat cards (4 cards):**
```typescript
// Each card is a glass card with icon, value, label, and color coding
// ATS Score: big number, color from getScoreColor(ats_score)
// Police: green "✅ Verified" or yellow "⏳ Pending Admin Review" or gray "Not Submitted"
// Aadhaar: green or gray
// Degree: green or gray
```

**ATS Score gauge (SVG circle):**
```typescript
// SVG with 2 circles: background ring and colored progress ring
// strokeDasharray: `${(score/100)*283} 283`  (circumference of r=45 circle)
// Color: green>75, yellow 50-75, red <50
// Animate: initial strokeDasharray 0 283, then transition to actual value on load
```

**Verification tasks checklist:**
```typescript
const tasks = [
  { label: 'Resume Analyzed', done: !!student?.resume_url, score: student?.ats_score, href: '/dashboard/student/resume' },
  { label: 'Police Certificate', done: student?.police_verified, href: '/dashboard/student/police', pending: police_status === 'ai_approved' || police_status === 'needs_review' },
  { label: 'Aadhaar Verified', done: student?.aadhaar_verified, href: '/dashboard/student/aadhaar' },
  { label: 'Degree Certificate', done: student?.degree_verified, href: '/dashboard/student/degree' },
]
// Progress bar: completedTasks/4 * 100%
// For pending police: show orange "⏳ Under Review" instead of upload button
```

**Shareable link section:**
```typescript
// If share_token exists: show URL + Copy + WhatsApp + LinkedIn share buttons
// Copy button: navigator.clipboard.writeText(fullUrl), then show "Copied! ✓" for 2s
// WhatsApp: href={`https://wa.me/?text=Verify my credentials: ${fullUrl}`}
// LinkedIn: href={`https://www.linkedin.com/sharing/share-offsite/?url=${fullUrl}`}
// If no token: "Generate My Link" button → calls POST /api/generate-link
```

**Quick action cards (below main content):**
4 mini cards linking to each verification portal with icon + label + arrow. Hover: golden border + slide-right arrow animation.

---

## FILE 2 — `credentia-web/app/dashboard/student/resume/page.tsx`

Resume upload and ATS analysis page.

**Layout:**
- Page title: "Resume Analysis" with FileText icon
- Upload zone (full-width card)
- Results section (appears after analysis)

**Upload zone:**
```typescript
// react-dropzone — accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] }
// Dashed border, centered icon + text, hover: golden border + bg glow
// After file drop: show filename + size + "Analyze Now →" button
// On submit: 
//   1. Show loading overlay "🤖 AI is analyzing your resume..."
//   2. POST to /api/upload (multipart: file, folder='resumes', studentId)
//   3. POST to /api/analyze-resume (body: { fileUrl, studentId })
//   4. Show results
```

**Also accept link paste:**
Below the dropzone, a text input:
"Or paste a link to your resume (Google Drive, LinkedIn, etc.):"
```
[https://drive.google.com/...] [Analyze Link]
```

**Results section (shown after analysis):**
```
┌─────────────────────────────────────────────────┐
│  ATS SCORE: 94/100 ████████████░ EXCELLENT      │
├────────────────┬────────────────────────────────┤
│  KEYWORDS ✅   │  MISSING KEYWORDS ❌           │
│  Python        │  Docker                         │
│  React         │  Kubernetes                     │
│  Node.js       │  AWS                            │
├────────────────┴────────────────────────────────┤
│  STRENGTHS ✅                                   │
│  • Strong technical skills                      │
│  • Good project experience                      │
├─────────────────────────────────────────────────┤
│  IMPROVEMENTS 💡                                │
│  • Add quantifiable achievements                │
│  • Include certifications section               │
└─────────────────────────────────────────────────┘
```

Keywords: green chips for found, red chips for missing.
Strengths/improvements: list with colored icons.
Score bar: animated fill based on score, color-coded.
"Re-analyze" button to upload another resume.

---

## FILE 3 — `credentia-web/app/dashboard/student/police/page.tsx`

Police verification page.

**Upload section:**
- Dropzone: accept PDF and images
- OR paste certificate link
- OR manual entry form with fields:
  - Certificate Number
  - Issuing Authority
  - Date of Issue
  - District/State

**After upload → call /api/verify-police → show results:**
```
┌─────────────────────────────────────────────────┐
│  STATUS: ✅ AI APPROVED (Confidence: 92%)       │
├─────────────────────────────────────────────────┤
│  Certificate No: PV2024DELHI12345               │
│  Authority: Delhi Police — Saket               │
│  Date: 15/03/2024                               │
│  District: South Delhi, Delhi                   │
├─────────────────────────────────────────────────┤
│  ⏳ Awaiting final admin approval (24-48 hrs)   │
└─────────────────────────────────────────────────┘
```

Status badge colors:
- ai_approved (≥85%): yellow "⏳ Pending Admin Review"
- needs_review (60-85%): orange "⚠️ Manual Review Required"
- rejected (<60%): red "❌ Invalid Document"
- admin_verified: green "✅ Police Verified"

Note: "AI has pre-screened your certificate. Final verification by our admin team within 24-48 hours."

---

## FILE 4 — `credentia-web/app/dashboard/student/aadhaar/page.tsx`

Aadhaar verification page.

**Important privacy notice card:**
```
⚠️ PRIVACY FIRST: Your full Aadhaar number is NEVER stored.
Only last 4 digits and non-sensitive details are saved.
```

Upload zone: accept images (JPEG, PNG, PDF).
Upload front and back separately (two dropzones side by side).

After analysis → show:
```
✅ Aadhaar Verified
Name: Pranjal Kumar
Date of Birth: 24/09/2003
Gender: Male
State: Uttar Pradesh
Aadhaar: XXXX-XXXX-XXXX (only last 4 shown)
Confidence: 88%
```

---

## FILE 5 — `credentia-web/app/dashboard/student/degree/page.tsx`

Degree certificate verification.

Upload zone for degree certificate image/PDF.

After analysis → show:
```
✅ Degree Verified
University: Dr. APJ Abdul Kalam Technical University
Degree: B.Tech
Branch: Computer Science & Engineering
Year: 2025
CGPA: 8.2 / 10
```

---

## FILE 6 — `credentia-web/app/dashboard/student/my-link/page.tsx`

Shareable profile link page.

**Full page layout:**
```
┌─────────────────────────────────────────────────┐
│  YOUR VERIFIED PROFILE LINK                     │
│  credentiaonline.in/verify/[token]              │
│  [Copy] [Open in new tab]                       │
├─────────────────────────────────────────────────┤
│  SHARE VIA:                                     │
│  [WhatsApp] [LinkedIn] [Email] [Twitter]        │
├─────────────────────────────────────────────────┤
│  QR CODE (react-qr-code component)             │
│  [Download QR Code]                             │
├─────────────────────────────────────────────────┤
│  WHAT PEOPLE SEE:                               │
│  (Preview card of the public profile)           │
└─────────────────────────────────────────────────┘
```

QR Code: Use `<QRCode value={fullUrl} size={200} bgColor="#0A0A0F" fgColor="#F5C542" />`

Download QR: convert QR to canvas → download as PNG.

Share buttons:
- WhatsApp: `https://wa.me/?text=Check my verified credentials: ${url}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
- Email: `mailto:?subject=My Verified Profile&body=Check my verified credentials: ${url}`
- Twitter: `https://twitter.com/intent/tweet?text=My verified credentials: ${url}`

If no token: show "Generate Link" button first.

---

## FILE 7 — `credentia-web/app/verify/[token]/page.tsx`

Public profile page — no login needed.

```typescript
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import QRCode from 'react-qr-code'

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*, profiles!inner(full_name, email, avatar_url)')
    .eq('share_token', params.token)
    .eq('profile_is_public', true)
    .single()

  if (!student) notFound()

  // Increment view count
  await supabaseAdmin.from('students')
    .update({ profile_views: (student.profile_views || 0) + 1 })
    .eq('share_token', params.token)
  
  // Get verifications
  const { data: verifications } = await supabaseAdmin
    .from('verifications')
    .select('*')
    .eq('student_id', student.id)
```

**Public page UI:**
Beautiful centered card page:
- Top: Big green "✅ Verified by CREDENTIA" badge with glow
- Student name + profile avatar (initials if no photo)
- 4 verification status cards in 2x2 grid:
  - Resume: ATS Score `{ats_score}/100` — green if verified
  - Police: Certificate number + authority — green/gray
  - Aadhaar: Name + state — green/gray  
  - Degree: University + degree + year — green/gray
- Unverified items show as gray with lock icon
- QR Code pointing to this page URL
- Share buttons (WhatsApp, LinkedIn, Copy)
- "Profile Views: {count}" counter
- Footer: "Powered by CREDENTIA" with link

---

## AFTER ALL FILES

Run build and fix all errors:
```bash
cd credentia-web && npm run build
```

The verification pages need the API routes to actually work — those come in Prompt 6. For now the pages should build and the UI should render. API calls will 404 until Prompt 6 is done.
