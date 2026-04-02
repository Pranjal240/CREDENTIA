# Credentia — AI-Powered Credential Verification Platform

> A web platform that allows students to upload and verify their credentials (resume, Aadhaar, degree, and police certificate) through an AI analysis pipeline. Verified profiles are shareable via a single public link. Companies, universities, and admins each have dedicated dashboards.

---

> [!CAUTION]
> **This repository is strictly for reading and understanding the code structure and architecture.**
> It is not licensed for personal use, reproduction, copying, modification, deployment, or any form of redistribution.
> All rights reserved — Copyright © 2026 Pranjal Mishra. See [LICENSE](LICENSE) for full terms.

---

## Overview

**Credentia** is a full-stack web application built to solve the problem of unverifiable student credentials in the Indian job market. Students submit their documents, the AI engine analyzes and extracts structured data from each one, and a verified profile is generated. Companies can review candidates through a filter-based dashboard. Universities manage their students. Admins oversee all users and activity across the platform.

The live domain is `credentiaonline.in`

---

## What It Does

### For Students

Students get a multi-section dashboard with the following pages (accessible from a collapsible sidebar):

**Dashboard (Overview)**
- Shows 4 stat cards: ATS Score, number of documents verified (out of 4), profile views, and a trust score (percentage of verification complete)
- Displays a profile completion progress bar that tracks how many of the 4 documents have been verified
- Shows which university the student is linked to; if not linked, prompts setup via Settings
- Shows a count of total uploaded documents
- Verification checklist — 4 cards (Resume, Police, Aadhaar, Degree), each expandable to show the AI analysis result inline. Clicking a card reveals extracted fields, strengths, improvements, detected keywords, and confidence score without leaving the page
- A "Generate Verified Link" CTA that takes the student to their shareable profile page
- Recent activity timeline showing all verification events with timestamps and statuses
- All data updates in real time via Supabase Postgres `change` subscriptions

**Resume (`/dashboard/student/resume`)**
- Upload a resume as PDF or image
- AI extracts: ATS score (0–100), authenticity score, student name, phone, city, state, course, branch, graduation year, top skills, keywords found, keywords missing, strengths, improvement suggestions, years of experience, education level, and a 2–3 sentence summary
- Results displayed as a visual circular score gauge + labelled sections

**Police Verification (`/dashboard/student/police`)**
- Upload a police clearance certificate (PCC) as PDF or image
- AI extracts: certificate number, issue date, issuing authority, district, state, applicant name, whether it is a valid police certificate, and a confidence score
- Returns a status of `VERIFIED`, `NEEDS_REVIEW`, or `INVALID`

**Aadhaar Verification (`/dashboard/student/aadhaar`)**
- Upload an Aadhaar card image
- AI extracts: name, date of birth, gender, state, and the last 4 digits of the Aadhaar number (the full 12-digit number is never stored or logged)
- Returns a verified boolean and a confidence score

**Degree Verification (`/dashboard/student/degree`)**
- Upload a degree certificate as PDF or image
- AI extracts: university name, degree type (B.Tech, MBA, etc.), course/specialisation, year of passing, CGPA or grade, and roll number
- Returns a verified boolean and a confidence score

**My Verifications (`/dashboard/student/saved`)**
- Lists all 4 verification records with their current status and AI result data

**My Link (`/dashboard/student/my-link`)**
- Generates a public shareable profile link at `/verify/:id`
- Displays a QR code for the link
- The public page shows the student's verified credentials to any viewer without requiring them to log in

**Settings (`/dashboard/student/settings`)**
- Edit profile details
- Link to a university from the platform

---

### For Companies

**Talent Search (main dashboard)**
- Fetches all students who have set `profile_is_public = true`
- Filter options:
  - Full-text search across name, email, course, branch, city, state
  - ATS score range (min–max slider)
  - Police verified filter (toggle)
  - Aadhaar verified filter (toggle)
  - Degree verified filter (toggle)
  - Minimum CGPA input
  - Course dropdown (dynamically populated from available data)
  - Graduation year dropdown (dynamically populated from available data)
- Sort by ATS score, name, or trust score — ascending or descending
- Grid view and list view toggle
- Pagination (12 students per page)
- Each student card shows: name, email, course, city/state, ATS score, trust score, and which documents are verified (police / Aadhaar / degree each shown as a badge)
- Click a candidate to open a detail panel showing the full AI analysis from their resume and degree verification
- Save/unsave candidates (stored in a `saved_candidates` table linked to the company account)
- AI job description matching — enter a job description and the platform ranks candidates by relevance

**Saved Candidates (`/dashboard/company/saved`)**
- Lists all candidates the company recruiter has bookmarked

**Analytics (`/dashboard/company/analytics`)**
- Platform-level analytics charts (Recharts)

---

### For Universities

**Student Registry (`/dashboard/university`)**
- Lists all students linked to the university
- Shows verification status per student

**Analytics (`/dashboard/university/analytics`)**
- Charts showing student verification completion across the institution

---

### For Admins

**Dashboard (`/dashboard/admin`)**
- Platform overview with aggregate stats

**All Users (`/dashboard/admin/users`)**
- Full user list across all roles (student, company, university)
- View and edit any user's profile via the `admin/update-profile` API

**Verifications (`/dashboard/admin/verifications`)**
- View all verification records across all students
- Can manually change verification status (override AI decisions)

**Audit Logs (`/dashboard/admin/audit`)**
- Log of all admin actions taken on the platform

**Universities (`/dashboard/admin/outreach`)**
- Manage registered university accounts

**Companies (`/dashboard/admin/companies`)**
- Manage registered company accounts

---

### Verification Status Flow

Each document goes through the following status states, stored in the `verifications` table:

| Status | Meaning |
|--------|---------|
| `not_submitted` | Student has not uploaded this document yet |
| `pending` | Document uploaded, awaiting AI analysis |
| `needs_review` | AI flagged the document; needs admin review |
| `ai_approved` | AI verified the document as authentic |
| `admin_verified` | An admin manually verified the document |
| `verified` | Document is fully verified |
| `rejected` | Document was rejected (invalid or fraudulent) |

---

### Public Verified Profile (`/verify/:id`)

Any student with at least some verified documents can generate a public link. When opened:
- Shows the student's name, photo, and profile details
- Displays verification badges for each document category
- Shows extracted data (ATS score, degree details, etc.) depending on what is verified
- A QR code links back to this page
- No login required for the viewer



---

## Portals / Routes

| Portal | Route |
|--------|-------|
| Landing Page | `/` |
| Student Login | `/login/student` |
| Company Login | `/login/company` |
| University Login | `/login/university` |
| Admin Login | `/login/admin` |
| Student Dashboard | `/dashboard/student` |
| Company Dashboard | `/dashboard/company` |
| University Dashboard | `/dashboard/university` |
| Admin Dashboard | `/dashboard/admin` |
| Public Verified Profile | `/verify/:id` |

---

## AI Engine

Document analysis is handled via the **Groq SDK** using two models:

| Input Type | Model Used |
|-----------|------------|
| Text (extracted from PDF) | `llama-3.3-70b-versatile` |
| Image (document photo) | `meta-llama/llama-4-scout-17b-16e-instruct` |

Each document type has a dedicated analyzer function in `lib/groq.ts`:

- **`analyzeResume()`** — Extracts ATS score (0–100), authenticity score, student name, phone, city, course, branch, graduation year, top skills, strengths, improvement suggestions, and a summary
- **`analyzePoliceDoc()`** — Extracts certificate number, issue date, issuing authority, district, state, applicant name; returns `VERIFIED | NEEDS_REVIEW | INVALID`
- **`analyzeAadhaar()`** — Extracts name, date of birth, gender, state, and last 4 digits of Aadhaar (full number is never stored)
- **`analyzeDegree()`** — Extracts university name, degree, course, year of passing, grade/CGPA, and roll number

PDF text is extracted using `unpdf`. All AI responses are returned as structured JSON.

---

## API Routes

| Endpoint | Purpose |
|---------|---------|
| `POST /api/upload` | Upload a document to Cloudflare R2 storage |
| `POST /api/analyze-resume` | Run resume analysis via Groq |
| `POST /api/verify-aadhaar` | Run Aadhaar analysis via Groq |
| `POST /api/verify-degree` | Run degree certificate analysis via Groq |
| `POST /api/verify-police` | Run police certificate analysis via Groq |
| `POST /api/save-verification` | Save analysis results to Supabase |
| `POST /api/save-document` | Save document metadata to Supabase |
| `POST /api/generate-link` | Generate a shareable profile link |
| `GET /api/student` | Fetch student profile data |
| `GET /api/company` | Fetch company-facing candidate data |
| `GET /api/university` | Fetch university student data |
| `GET /api/admin` | Fetch admin user data |
| `POST /api/admin/update-profile` | Update a user's profile (admin only) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **Auth & Database** | Supabase (Auth + PostgreSQL) |
| **File Storage** | Cloudflare R2 (via AWS S3 SDK) |
| **AI / LLM** | Groq SDK — LLaMA 3.3 70B + LLaMA 4 Scout |
| **PDF Parsing** | unpdf |
| **Email** | Resend |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **QR Code** | react-qr-code |
| **Deployment** | Vercel |

---

## Project Structure

```
credentia-web/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx
│   ├── globals.css                # Design tokens + theme variables
│   ├── login/                     # Login pages per role
│   ├── register/                  # Registration
│   ├── auth/                      # Supabase auth callback
│   ├── verify/                    # Public profile link
│   ├── dashboard/
│   │   ├── student/
│   │   ├── company/
│   │   ├── university/
│   │   └── admin/
│   └── api/                       # All API route handlers
│       ├── analyze-resume/
│       ├── verify-aadhaar/
│       ├── verify-degree/
│       ├── verify-police/
│       ├── upload/
│       ├── save-verification/
│       ├── save-document/
│       ├── generate-link/
│       ├── student/
│       ├── company/
│       ├── university/
│       └── admin/
├── components/
│   └── landing/                   # Landing page sections
├── lib/
│   ├── groq.ts                    # AI analysis functions
│   ├── r2.ts                      # Cloudflare R2 upload/delete
│   ├── supabase.ts                # Supabase browser client
│   ├── supabase-server.ts         # Supabase server client
│   └── utils.ts
├── middleware.ts                  # Auth guard + role-based routing
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

---

## Auth & Role-Based Routing

Authentication is handled by Supabase Auth with PKCE flow. The middleware (`middleware.ts`) guards all `/dashboard/*` routes:

1. Checks for a valid Supabase session
2. Reads the user's `role` and `is_active` fields from the `profiles` table
3. Redirects to the correct dashboard based on role (`student`, `company`, `university`, `admin`)
4. Redirects to the appropriate login page if unauthenticated or inactive

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_PUBLIC_URL=
GROQ_API_KEY=
RESEND_API_KEY=
```

---

## Running Locally

```bash
# 1. Clone the repo and navigate to the web project
cd credentia-web

# 2. Install dependencies
npm install

# 3. Create .env.local with the environment variables listed above

# 4. Start the development server
npm run dev
```

The app will run at `http://localhost:3000`.

---

## License

**Copyright © 2026 Pranjal Mishra. All Rights Reserved.**

This repository and all its contents are the exclusive intellectual property of Pranjal Mishra.

**This code is made available strictly for viewing and educational understanding only.** No permission is granted to copy, use, modify, distribute, sublicense, or deploy any part of this codebase — in whole or in part — for any purpose, commercial or otherwise, without explicit prior written consent from the author.

Unauthorised use, reproduction, or distribution of this code is strictly prohibited.

---

<p align="center">
  <strong>Credentia — Credential verification, done right.</strong>
</p>
