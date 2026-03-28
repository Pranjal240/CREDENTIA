# CREDENTIA — Backend & Database
### File 03 — Supabase Schema + API Architecture

---

> ⚡ **CODEX REVIEW:** The Codex will review all of your codes after your execution.

---

## 📊 Supabase Database Schema

Yeh poora SQL Supabase ke SQL Editor mein paste karke run karo.

```sql
-- ══════════════════════════════════════════════════════
-- CREDENTIA DATABASE SCHEMA V3
-- Supabase SQL Editor mein poora paste karo, phir Run karo
-- ══════════════════════════════════════════════════════

-- UUID extension enable karo
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ══════════════════════════════════════════════════════
-- TABLE 1: profiles (Supabase Auth ke saath linked)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'student' 
                CHECK (role IN ('student','company','university','admin')),
  full_name     TEXT NOT NULL DEFAULT '',
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════
-- TABLE 2: universities
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS universities (
  id                UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university_name   TEXT NOT NULL,
  ugc_id            TEXT UNIQUE,
  naac_grade        TEXT,
  state             TEXT,
  city              TEXT,
  erp_access_key    TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  data_sharing_on   BOOLEAN DEFAULT TRUE,
  is_verified       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- TABLE 3: students
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS students (
  id                    UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  university_id         UUID REFERENCES universities(id),
  roll_number           TEXT,
  course                TEXT,
  branch                TEXT,
  graduation_year       INT,
  date_of_birth         DATE,
  gender                TEXT,
  city                  TEXT,
  state                 TEXT,
  
  -- File URLs (from Cloudflare R2)
  resume_url            TEXT,
  resume_filename       TEXT,
  
  -- Scores
  ats_score             INT DEFAULT 0 CHECK (ats_score >= 0 AND ats_score <= 100),
  verification_score    INT DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
  
  -- Verification booleans (quick lookup)
  aadhaar_verified      BOOLEAN DEFAULT FALSE,
  police_verified       BOOLEAN DEFAULT FALSE,        -- Admin approves this
  degree_verified       BOOLEAN DEFAULT FALSE,
  
  -- Aadhaar safe storage (NEVER full number)
  aadhaar_last4         TEXT,
  aadhaar_name          TEXT,
  aadhaar_state         TEXT,
  aadhaar_dob           TEXT,
  
  -- Academic (verified by university)
  cgpa                  DECIMAL(4,2),
  academic_verified     BOOLEAN DEFAULT FALSE,
  academic_verified_by  UUID REFERENCES universities(id),
  
  -- Shareable link
  share_token           TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  profile_is_public     BOOLEAN DEFAULT TRUE,
  profile_views         INT DEFAULT 0,
  
  -- Police share with companies
  police_share_with_companies BOOLEAN DEFAULT TRUE,
  
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- TABLE 4: verifications (detailed records)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN (
    'resume', 'police', 'aadhaar', 'degree', 
    'marksheet_10th', 'marksheet_12th', 'pan', 'passport'
  )),
  status            TEXT NOT NULL DEFAULT 'not_submitted' CHECK (status IN (
    'not_submitted', 'pending', 'ai_approved', 
    'needs_review', 'admin_verified', 'rejected'
  )),
  
  -- Input
  document_url      TEXT,         -- Cloudflare R2 URL
  document_filename TEXT,
  document_r2_key   TEXT,         -- Cloudflare R2 object key (for deletion)
  external_link     TEXT,         -- Pasted link by student
  
  -- AI Result
  ai_confidence     INT DEFAULT 0,
  ai_result         JSONB,        -- Full Groq response stored here
  
  -- Admin action
  admin_reviewed_by UUID REFERENCES profiles(id),
  admin_reviewed_at TIMESTAMPTZ,
  rejection_reason  TEXT,
  
  -- Email tracking
  submitted_email   BOOLEAN DEFAULT FALSE,
  result_email      BOOLEAN DEFAULT FALSE,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, type)  -- One verification record per type per student
);

-- ══════════════════════════════════════════════════════
-- TABLE 5: companies
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS companies (
  id                          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name                TEXT NOT NULL,
  industry                    TEXT,
  gst_number                  TEXT,
  company_size                TEXT,
  website                     TEXT,
  logo_url                    TEXT,
  state                       TEXT,
  is_verified                 BOOLEAN DEFAULT FALSE,
  
  -- Verification requirements
  require_police_verification BOOLEAN DEFAULT FALSE,
  require_aadhaar             BOOLEAN DEFAULT TRUE,
  require_degree              BOOLEAN DEFAULT TRUE,
  minimum_ats_score           INT DEFAULT 0,
  minimum_cgpa                DECIMAL(3,2) DEFAULT 0,
  
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- TABLE 6: applications
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id),
  company_id    UUID NOT NULL REFERENCES companies(id),
  job_title     TEXT,
  status        TEXT DEFAULT 'applied' CHECK (status IN (
    'applied', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'
  )),
  company_notes TEXT,
  applied_via   TEXT DEFAULT 'web',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, company_id, job_title)
);

-- ══════════════════════════════════════════════════════
-- TABLE 7: notifications
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT CHECK (type IN ('verification', 'application', 'system', 'alert')),
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- AUTO FUNCTIONS
-- ══════════════════════════════════════════════════════

-- Auto-create default verification records when student registers
CREATE OR REPLACE FUNCTION create_default_verifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO verifications (student_id, type, status)
  VALUES
    (NEW.id, 'resume', 'not_submitted'),
    (NEW.id, 'police', 'not_submitted'),
    (NEW.id, 'aadhaar', 'not_submitted'),
    (NEW.id, 'degree', 'not_submitted'),
    (NEW.id, 'marksheet_10th', 'not_submitted'),
    (NEW.id, 'marksheet_12th', 'not_submitted');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_student_created ON students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION create_default_verifications();

-- Auto-calculate verification_score when verifications change
CREATE OR REPLACE FUNCTION update_verification_score()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
  v_score INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM verifications
  WHERE student_id = NEW.student_id 
  AND status IN ('admin_verified', 'ai_approved');
  
  v_score := LEAST(v_count * 16, 96);
  
  -- Extra points for police verification (most important)
  IF EXISTS (SELECT 1 FROM students WHERE id = NEW.student_id AND police_verified = TRUE) THEN
    v_score := LEAST(v_score + 4, 100);
  END IF;
  
  UPDATE students SET verification_score = v_score WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_verification_update ON verifications;
CREATE TRIGGER on_verification_update
  AFTER INSERT OR UPDATE ON verifications
  FOR EACH ROW EXECUTE FUNCTION update_verification_score();

-- ══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: apna khud ka profile read/write
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Students: khud + admin + company (read only) + university (read only)
CREATE POLICY "student_own" ON students FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_all_students" ON students FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "company_read_students" ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'company'));
CREATE POLICY "university_read_students" ON students FOR SELECT
  USING (
    university_id IN (
      SELECT id FROM universities WHERE id = auth.uid()
    )
  );

-- Public profile by token (no auth needed for public URL)
CREATE POLICY "public_profile_by_token" ON students FOR SELECT
  USING (profile_is_public = TRUE);

-- Verifications: khud + admin + company (read only for shared)
CREATE POLICY "student_own_verifications" ON verifications
  FOR ALL USING (student_id = auth.uid());
CREATE POLICY "admin_all_verifications" ON verifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "company_read_verifications" ON verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'company'));

-- Notifications: own only
CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════════
-- AFTER RUNNING SCHEMA:
-- Apne admin account ko admin banao:
-- ══════════════════════════════════════════════════════
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🔧 Cloudflare R2 Setup (lib/r2.ts)

```typescript
// lib/r2.ts — Cloudflare R2 Storage Helper
// Uses AWS S3-compatible SDK since R2 is S3-compatible

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

// Initialize R2 client using Cloudflare's S3-compatible endpoint
const r2Client = new S3Client({
  region: 'auto',  // R2 uses 'auto' as region
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Upload a file buffer to Cloudflare R2
 * @param file - Buffer of the file
 * @param originalFilename - Original name of the file
 * @param contentType - MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
 * @param folder - Sub-folder inside the bucket (e.g., 'resumes', 'police', 'aadhaar')
 */
export async function uploadToR2(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  folder: string = 'documents'
): Promise<{ url: string; key: string; filename: string; bytes: number }> {
  
  // Create a unique, safe file key
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const uniqueKey = `credentia/${folder}/${Date.now()}-${sanitizedFilename}`
  
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: uniqueKey,
    Body: file,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
    // Add metadata for tracking
    Metadata: {
      'uploaded-at': new Date().toISOString(),
      'folder': folder,
    },
  }))
  
  return {
    url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${uniqueKey}`,
    key: uniqueKey,
    filename: originalFilename,
    bytes: file.length,
  }
}

/**
 * Delete a file from Cloudflare R2 by its key
 * @param key - The R2 object key (e.g., 'credentia/resumes/...')
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
  }))
}

/**
 * Helper to determine content type from filename
 */
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
  }
  return types[ext || ''] || 'application/octet-stream'
}

export default r2Client
```

**Install required packages for R2:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

---

## 🔐 Supabase Client Setup (lib/supabase.ts)

```typescript
// lib/supabase.ts — Browser client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase-server.ts — Server component client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )
}
```

---

## 🛡️ Middleware (middleware.ts)

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_REDIRECTS: Record<string, string> = {
  student: '/dashboard/student',
  company: '/dashboard/company',
  university: '/dashboard/university',
  admin: '/dashboard/admin',
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  
  const path = req.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isAuth = path.startsWith('/login') || path.startsWith('/register')
  
  // Unauthenticated user dashboard access karne ki koshish kar raha hai
  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // Already logged in user login page pe aa gaya
  if (isAuth && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    const redirect = ROLE_REDIRECTS[profile?.role || 'student']
    return NextResponse.redirect(new URL(redirect, req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}
```