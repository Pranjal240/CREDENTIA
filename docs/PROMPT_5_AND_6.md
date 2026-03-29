# PROMPT 5 — COMPANY + UNIVERSITY + ADMIN DASHBOARDS
# Paste into Antigravity (Claude Opus 4.6). Attach 01_PROJECT_OVERVIEW.md + 03_BACKEND_API.md.

---

Build the Company, University, and Admin dashboards. These are fully functional portals with real Supabase data.

---

## FILE 1 — `credentia-web/app/dashboard/company/page.tsx`

Company dashboard. Shows verified candidate pool with filters.

```typescript
'use client'
// Load all students from Supabase where profile_is_public = true
// Query: supabase.from('students').select('*, profiles!inner(full_name, email, avatar_url)').eq('profile_is_public', true)
```

**Dashboard header:**
- Company name + "Company Portal" badge
- Stats row: Total Candidates | Police Verified | High ATS (>75) | Recently Verified

**Filter bar:**
- Search by name
- Police Verified: Yes / No / All (toggle buttons)
- ATS Score: slider 0-100
- Aadhaar: Verified / All
- Degree: Verified / All

**Candidate cards grid (3 columns):**
Each card is a glass card with:
- Avatar (initials circle, gradient bg)
- Name + email
- Verification badges: 
  - Police ✅ or ⬜ (green chip or gray chip)
  - Aadhaar ✅ or ⬜
  - Degree ✅ or ⬜
  - ATS: colored score badge
- "View Full Profile →" button → opens `/verify/[token]` in new tab
- "Save Candidate" star button (saves to localStorage for demo)

**Empty state:** Beautiful empty state with magnifying glass icon when no candidates match filters.

---

## FILE 2 — `credentia-web/app/dashboard/company/candidates/page.tsx`

Detailed candidate search with table view.

Table columns: Name | ATS Score | Police | Aadhaar | Degree | Verified Link | Actions

Each row: candidate data + "View Profile" link + "Shortlist" button.

Sortable by ATS score (click column header to sort).

---

## FILE 3 — `credentia-web/app/dashboard/university/page.tsx`

University ERP dashboard.

Load all students from this university:
```typescript
// Query students where university_id matches current user's university id
// Also query all public students as fallback
const { data: students } = await supabase
  .from('students')
  .select('*, profiles!inner(full_name, email)')
  .limit(50)
```

**Stats cards:**
- Total Students Registered
- Resume Uploaded Count  
- Police Verified Count
- Average ATS Score

**Student registry table:**
Columns: Name | Email | ATS Score | Police | Aadhaar | Degree | CGPA | Actions

Search bar at top.
CSV export button (downloads table as CSV — use JavaScript Blob).

**Bulk actions:** "Mark all as verified" button (demo only).

---

## FILE 4 — `credentia-web/app/dashboard/admin/page.tsx`

Admin master panel. Only accessible to pranjalmishra2409@gmail.com.

**4 stat overview cards:**
- Total Students (count from profiles where role='student')
- Total Companies
- Pending Police Reviews (count from verifications where type='police' AND status IN ('ai_approved','needs_review'))
- Total Verifications Done

**Quick action cards:**
```
[🚔 Police Review Panel]  [🏢 Companies]
[🏫 Universities]         [📊 Analytics]
```

Each card is a large glass card with icon, label, and "Open →" button. Links to respective sub-pages.

**Recent activity feed:**
Last 10 verifications from Supabase (type, student email, status, time).

---

## FILE 5 — `credentia-web/app/dashboard/admin/police-verified/page.tsx`

Admin police verification review panel.

Load all police verifications needing review:
```typescript
const { data } = await supabaseAdmin
  .from('verifications')
  .select('*, students!inner(*, profiles!inner(full_name, email))')
  .eq('type', 'police')
  .in('status', ['ai_approved', 'needs_review', 'pending'])
  .order('created_at', { ascending: false })
```

**For each pending review:**
Card with:
- Student name + email
- AI confidence score (progress bar)
- Extracted data: certificate number, authority, district, date
- Document thumbnail (link to view R2 file)
- "Approve ✅" button (green) → calls POST /api/admin/approve-police with action='approve'
- "Reject ❌" button (red) → opens rejection modal with reason text input

**Approved/rejected filter tabs** at top.

After approve/reject: remove card from list with smooth animation.

---

## FILE 6 — `credentia-web/app/dashboard/admin/companies/page.tsx`

Simple table: all companies from Supabase (role='company').
Columns: Name | Email | Registered | Status
Toggle "Verified" status per company.

---

## FILE 7 — `credentia-web/app/dashboard/admin/universities/page.tsx`

Same as companies but for universities (role='university').

---

## BUILD CHECK

Run `npm run build` and fix all TypeScript errors. All imports must resolve.

---
---
---

# PROMPT 6 — ALL BACKEND API ROUTES
# Paste into Antigravity (Claude Opus 4.6). Attach 03_BACKEND_API.md.

---

Build ALL API routes. These are the backend. They handle uploads to Cloudflare R2, AI analysis via Groq, and data storage in Supabase.

---

## FILE 1 — `credentia-web/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2 } from '@/lib/r2'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'documents'
    const studentId = formData.get('studentId') as string

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Use PDF, DOC, JPG, or PNG.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToR2(buffer, file.name, file.type, folder)

    // Update student record if uploading resume
    if (studentId && folder === 'resumes') {
      await supabaseAdmin.from('students').update({
        resume_url: result.url,
        resume_filename: file.name,
      }).eq('id', studentId)
    }

    return NextResponse.json({ success: true, url: result.url, key: result.key, filename: file.name })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
```

---

## FILE 2 — `credentia-web/app/api/analyze-resume/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeResume } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, textContent, studentId } = await request.json()

    let content = textContent || ''

    // If URL provided, try to fetch text content
    if (fileUrl && !textContent) {
      try {
        const res = await fetch(fileUrl, { headers: { 'User-Agent': 'CREDENTIA-Bot/1.0' } })
        const text = await res.text()
        // Strip HTML if needed
        content = text.replace(/<[^>]*>/g, ' ').substring(0, 8000)
      } catch {
        content = `Resume uploaded from URL: ${fileUrl}. Please provide text content for better analysis.`
      }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'No content to analyze. Please upload a text-readable PDF or paste resume text.' }, { status: 400 })
    }

    const analysis = await analyzeResume(content)

    if (studentId) {
      await supabaseAdmin.from('students').update({
        ats_score: analysis.ats_score || 0,
      }).eq('id', studentId)

      await supabaseAdmin.from('verifications').upsert({
        student_id: studentId,
        type: 'resume',
        status: 'ai_approved',
        ai_confidence: analysis.ats_score || 0,
        ai_result: analysis,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,type' })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 3 — `credentia-web/app/api/verify-police/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzePoliceDoc } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, textContent, manualData, studentId } = await request.json()

    let content = textContent || ''
    
    // If manual data provided
    if (manualData && !content) {
      content = `Police Certificate Data:
Certificate Number: ${manualData.certificateNumber || 'Not provided'}
Issuing Authority: ${manualData.issuingAuthority || 'Not provided'}
Date of Issue: ${manualData.dateOfIssue || 'Not provided'}
District: ${manualData.district || 'Not provided'}
State: ${manualData.state || 'Not provided'}
This appears to be an Indian police verification certificate.`
    }

    if (fileUrl && !content) {
      try {
        const res = await fetch(fileUrl)
        content = await res.text()
      } catch {
        content = `Police certificate uploaded. URL: ${fileUrl}`
      }
    }

    const analysis = await analyzePoliceDoc(content)
    
    // Determine status based on confidence
    let status = 'rejected'
    if (analysis.confidence >= 85) status = 'ai_approved'
    else if (analysis.confidence >= 60) status = 'needs_review'

    if (studentId) {
      await supabaseAdmin.from('verifications').upsert({
        student_id: studentId,
        type: 'police',
        status,
        document_url: fileUrl || null,
        ai_confidence: analysis.confidence || 0,
        ai_result: analysis,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,type' })
    }

    return NextResponse.json({ success: true, analysis, status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 4 — `credentia-web/app/api/verify-aadhaar/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeAadhaar } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, textContent, studentId } = await request.json()

    let content = textContent || `Aadhaar card document uploaded from: ${fileUrl}`

    const analysis = await analyzeAadhaar(content)

    if (studentId && analysis.confidence > 70) {
      // NEVER store full Aadhaar number
      await supabaseAdmin.from('students').update({
        aadhaar_verified: true,
        aadhaar_last4: analysis.aadhaar_last4,
        aadhaar_name: analysis.name,
        aadhaar_state: analysis.state,
        aadhaar_dob: analysis.dob,
      }).eq('id', studentId)

      await supabaseAdmin.from('verifications').upsert({
        student_id: studentId,
        type: 'aadhaar',
        status: 'ai_approved',
        ai_confidence: analysis.confidence,
        ai_result: { ...analysis, full_number: 'REDACTED' }, // Never store
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,type' })
    }

    // Return ONLY safe fields
    return NextResponse.json({
      success: true,
      analysis: {
        verified: analysis.verified,
        name: analysis.name,
        dob: analysis.dob,
        gender: analysis.gender,
        state: analysis.state,
        aadhaar_last4: analysis.aadhaar_last4,
        confidence: analysis.confidence,
        issues: analysis.issues,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 5 — `credentia-web/app/api/verify-degree/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeDegree } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, textContent, studentId } = await request.json()
    const content = textContent || `Degree certificate from: ${fileUrl}`
    const analysis = await analyzeDegree(content)

    if (studentId && analysis.confidence > 70) {
      await supabaseAdmin.from('students').update({
        degree_verified: true,
        course: analysis.course,
        graduation_year: parseInt(analysis.year_of_passing) || null,
        cgpa: parseFloat(analysis.grade_cgpa) || null,
      }).eq('id', studentId)

      await supabaseAdmin.from('verifications').upsert({
        student_id: studentId,
        type: 'degree',
        status: 'ai_approved',
        ai_confidence: analysis.confidence,
        ai_result: analysis,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id,type' })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 6 — `credentia-web/app/api/generate-link/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json()
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

    const token = crypto.randomUUID()

    const { error } = await supabaseAdmin
      .from('students')
      .update({ share_token: token, profile_is_public: true })
      .eq('id', studentId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${token}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 7 — `credentia-web/app/api/admin/approve-police/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { studentId, verificationId, action, reason } = await request.json()

    if (action === 'approve') {
      await supabaseAdmin.from('students').update({ police_verified: true }).eq('id', studentId)
      await supabaseAdmin.from('verifications').update({
        status: 'admin_verified',
        admin_reviewed_at: new Date().toISOString(),
      }).eq('id', verificationId)
    } else {
      await supabaseAdmin.from('verifications').update({
        status: 'rejected',
        rejection_reason: reason || 'Does not meet verification standards',
        admin_reviewed_at: new Date().toISOString(),
      }).eq('id', verificationId)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 8 — `credentia-web/app/api/admin/police-verified/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('verifications')
      .select(`
        *,
        students!inner(
          id,
          ats_score,
          profiles!inner(full_name, email)
        )
      `)
      .eq('type', 'police')
      .in('status', ['ai_approved', 'needs_review', 'pending'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 9 — `credentia-web/app/api/public/profile/[token]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select(`
        id, ats_score, police_verified, aadhaar_verified, degree_verified,
        share_token, profile_views, course, graduation_year, cgpa,
        aadhaar_name, aadhaar_state, aadhaar_last4,
        profiles!inner(full_name, email, avatar_url)
      `)
      .eq('share_token', params.token)
      .eq('profile_is_public', true)
      .single()

    if (error || !student) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Increment view count
    await supabaseAdmin.from('students')
      .update({ profile_views: (student.profile_views || 0) + 1 })
      .eq('share_token', params.token)

    // Get verifications
    const { data: verifications } = await supabaseAdmin
      .from('verifications')
      .select('type, status, ai_confidence, ai_result')
      .eq('student_id', student.id)

    return NextResponse.json({ student, verifications })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

## FILE 10 — `credentia-web/app/api/seed/route.ts` (Demo accounts setup)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ONE-TIME seed endpoint — creates demo accounts
// Only works if SEED_SECRET header matches
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-seed-secret')
  if (secret !== 'credentia-seed-2025') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Demo university account
  const { data: uniUser } = await supabaseAdmin.auth.admin.createUser({
    email: 'university@credentia-demo.in',
    password: 'Demo@Univ2025',
    email_confirm: true,
    user_metadata: { full_name: 'Demo University', role: 'university' },
  })

  // Demo company account
  const { data: corpUser } = await supabaseAdmin.auth.admin.createUser({
    email: 'company@credentia-demo.in',
    password: 'Demo@Corp2025',
    email_confirm: true,
    user_metadata: { full_name: 'Demo Company', role: 'company' },
  })

  // Update roles
  if (uniUser?.user) {
    await supabaseAdmin.from('profiles').upsert({
      id: uniUser.user.id,
      email: 'university@credentia-demo.in',
      full_name: 'Demo University',
      role: 'university',
    })
  }

  if (corpUser?.user) {
    await supabaseAdmin.from('profiles').upsert({
      id: corpUser.user.id,
      email: 'company@credentia-demo.in',
      full_name: 'Demo Company',
      role: 'company',
    })
  }

  return NextResponse.json({ success: true, message: 'Demo accounts created' })
}
```

---

## FINAL BUILD AND DEPLOY

After all API files are created:

```bash
cd credentia-web
npm run build
```

Fix ALL errors until build passes, then:

```bash
cd ..
git add -A
git commit -m "feat: complete CREDENTIA rebuild - landing page, auth, dashboards, API routes, uploads, AI verification"
git push origin main
```

Vercel will auto-deploy. Takes 3-5 min.

---

## AFTER DEPLOY — SEED DEMO ACCOUNTS

After Vercel deploys, run this ONCE to create demo accounts:
```bash
curl -X POST https://credentiaonline.in/api/seed -H "x-seed-secret: credentia-seed-2025"
```

Then in Supabase SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'pranjalmishra2409@gmail.com';
```

---

## FINAL CHECKLIST

- [ ] credentiaonline.in loads beautiful landing page
- [ ] Login button → /login with role selection
- [ ] Google login works (redirects to Google, comes back to dashboard)
- [ ] Email/password login works
- [ ] Student dashboard shows name, ATS score, verification status
- [ ] Resume upload → file goes to R2 → Groq analyzes → results shown
- [ ] Police upload → R2 → Groq → results shown → admin can approve
- [ ] Aadhaar upload → R2 → Groq → results shown (no full number stored)
- [ ] Degree upload → R2 → Groq → results shown
- [ ] Generate Link → creates UUID → public profile visible at /verify/[token]
- [ ] Company dashboard shows verified candidates with filters
- [ ] Admin dashboard shows police reviews, approve/reject works
- [ ] University dashboard shows student list
- [ ] Build: 0 errors, 0 TypeScript errors
