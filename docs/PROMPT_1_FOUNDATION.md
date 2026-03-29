# PROMPT 1 — FOUNDATION SETUP
# Paste this into Antigravity (Claude Opus 4.6). Attach 01_PROJECT_OVERVIEW.md.

---

You are rebuilding CREDENTIA from scratch inside `credentia-web/`. This is India's #1 credential verification platform. The current code is broken. Delete all existing app code and rebuild perfectly.

## YOUR TASK IN THIS PROMPT
Set up the complete foundation: dependencies, config files, design system, fonts, layout, and Supabase/R2/Groq library files.

---

## STEP 1 — CLEAN THE PROJECT

Delete these files/folders completely (they contain broken code):
- `credentia-web/app/` (entire folder)
- `credentia-web/components/` (entire folder)  
- `credentia-web/lib/` (entire folder)
- `credentia-web/middleware.ts`
- `credentia-web/next.config.mjs`
- `credentia-web/next.config.js` (if exists)

Keep:
- `credentia-web/public/` (has logo and owner photos — DO NOT TOUCH)
- `credentia-web/package.json`
- `credentia-web/.env.local`

---

## STEP 2 — INSTALL ALL DEPENDENCIES

Run in `credentia-web/`:
```bash
npm install
npm install @supabase/supabase-js @supabase/ssr
npm install groq-sdk
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
npm install framer-motion
npm install next-themes
npm install lucide-react
npm install react-dropzone
npm install react-qr-code
npm install react-countup
npm install @splinetool/react-spline @splinetool/loader
npm install clsx tailwind-merge class-variance-authority tailwindcss-animate
npm install resend
npm uninstall @supabase/auth-helpers-nextjs 2>/dev/null || true
```

---

## STEP 3 — CREATE `credentia-web/next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-a4d3ac5440a64a8bba8f80fc29addabe.r2.dev' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pqxlkushbmlxjnlbjtbu.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
}
export default nextConfig
```

---

## STEP 4 — CREATE `credentia-web/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--background))',
        card: 'rgb(var(--bg-card))',
        elevated: 'rgb(var(--bg-elevated))',
        border: 'rgb(var(--border))',
        primary: '#F5C542',
        'primary-hover': '#D4A017',
        'text-primary': 'rgb(var(--text-primary))',
        'text-secondary': 'rgb(var(--text-secondary))',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(245,197,66,0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(245,197,66,0.6)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

---

## STEP 5 — CREATE `credentia-web/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== DARK THEME (Default) ===== */
:root {
  --background: 10 10 15;
  --bg-card: 19 19 26;
  --bg-elevated: 28 28 38;
  --border: 42 42 58;
  --text-primary: 255 255 255;
  --text-secondary: 153 153 170;
}

/* ===== LIGHT THEME ===== */
.light {
  --background: 244 244 248;
  --bg-card: 255 255 255;
  --bg-elevated: 248 248 252;
  --border: 226 226 238;
  --text-primary: 10 10 15;
  --text-secondary: 102 102 128;
}

* { box-sizing: border-box; }

body {
  background: rgb(var(--background));
  color: rgb(var(--text-primary));
  font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1,h2,h3,h4,h5,h6 {
  font-family: var(--font-syne), 'Syne', sans-serif;
  font-weight: 700;
}

/* Glassmorphism utility */
.glass {
  background: rgba(19, 19, 26, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(42, 42, 58, 0.8);
}

.light .glass {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 226, 238, 0.8);
}

/* Yellow glow */
.glow-yellow {
  box-shadow: 0 0 30px rgba(245, 197, 66, 0.25);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0A0A0F; }
::-webkit-scrollbar-thumb { background: #2A2A3A; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #F5C542; }

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #F5C542, #FF8C42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Card hover effect */
.card-hover {
  transition: all 0.3s ease;
}
.card-hover:hover {
  transform: translateY(-4px);
  border-color: rgba(245, 197, 66, 0.4);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 197, 66, 0.1);
}

/* Animated gradient background */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-bg {
  background: linear-gradient(-45deg, #0A0A0F, #13131A, #1a0f2e, #0f1a2e);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

---

## STEP 6 — CREATE `credentia-web/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CREDENTIA — India\'s #1 Credential Verification Platform',
  description: 'AI-powered credential verification for students, companies, and universities. Verify once. Trusted forever.',
  keywords: 'credential verification, India, student verification, police certificate, Aadhaar, resume ATS, university ERP',
  openGraph: {
    title: 'CREDENTIA',
    description: 'Verify Once. Trusted Forever.',
    url: 'https://credentiaonline.in',
    siteName: 'CREDENTIA',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## STEP 7 — CREATE ALL LIB FILES

### `credentia-web/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const supabaseAdmin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

### `credentia-web/lib/supabase-server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

export const createServerSupabaseClient = createSupabaseServerClient

export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

### `credentia-web/lib/r2.ts`
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string,
  folder: string = 'documents'
) {
  const clean = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const key = `credentia/${folder}/${Date.now()}-${clean}`
  await r2.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',
  }))
  return {
    url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`,
    key,
    filename,
    bytes: file.length,
  }
}

export async function deleteFromR2(key: string) {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
    Key: key,
  }))
}
```

### `credentia-web/lib/groq.ts`
```typescript
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function analyzeResume(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an expert ATS resume analyzer for Indian job market. Return ONLY valid JSON:
        {
          "ats_score": <0-100>,
          "authenticity_score": <0-100>,
          "keywords_found": ["skill1","skill2"],
          "keywords_missing": ["missing1","missing2"],
          "strengths": ["strength1","strength2","strength3"],
          "improvements": ["tip1","tip2","tip3"],
          "experience_years": <number or null>,
          "education_level": "<string>",
          "top_skills": ["skill1","skill2","skill3","skill4","skill5"],
          "summary": "<2-3 sentence assessment>"
        }`
      },
      { role: 'user', content: `Analyze:\n\n${content.substring(0, 8000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1500,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzePoliceDoc(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are an Indian police certificate verifier. Return ONLY valid JSON:
        {
          "is_police_certificate": <boolean>,
          "confidence": <0-100>,
          "certificate_number": "<string or null>",
          "issue_date": "<DD/MM/YYYY or null>",
          "issuing_authority": "<string or null>",
          "district": "<string or null>",
          "state": "<string or null>",
          "applicant_name": "<string or null>",
          "status": "<VERIFIED|NEEDS_REVIEW|INVALID>",
          "fraud_indicators": [],
          "issues": []
        }`
      },
      { role: 'user', content: `Analyze:\n\n${content.substring(0, 6000)}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1000,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzeAadhaar(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a secure Aadhaar extractor. NEVER return full 12-digit number. Return ONLY JSON:
        {
          "verified": <boolean>,
          "name": "<string or null>",
          "dob": "<DD/MM/YYYY or null>",
          "gender": "<Male|Female|Other or null>",
          "state": "<string or null>",
          "aadhaar_last4": "<4 digits or null>",
          "confidence": <0-100>,
          "issues": []
        }`
      },
      { role: 'user', content: `Extract from:\n\n${content}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}

export async function analyzeDegree(content: string) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a degree certificate verifier. Return ONLY JSON:
        {
          "verified": <boolean>,
          "confidence": <0-100>,
          "university_name": "<string or null>",
          "degree": "<B.Tech|MBA|etc>",
          "course": "<subject>",
          "year_of_passing": "<year>",
          "grade_cgpa": "<string or null>",
          "roll_number": "<string or null>",
          "issues": []
        }`
      },
      { role: 'user', content: content }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })
  return JSON.parse(result.choices[0].message.content || '{}')
}
```

### `credentia-web/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function getScoreColor(score: number) {
  if (score >= 75) return '#22C55E'
  if (score >= 50) return '#F5C542'
  return '#EF4444'
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
```

---

## STEP 8 — CREATE MIDDLEWARE `credentia-web/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/verify/') ||
    pathname.includes('.')
  ) return response

  const publicPages = ['/', '/login', '/register']
  if (publicPages.includes(pathname)) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

---

## STEP 9 — VERIFY STRUCTURE

After all files are created, run:
```bash
cd credentia-web
npm run build
```

The build output should say:
```
✓ Compiled successfully
✓ Linting and checking validity of types
```

Fix any errors, then this prompt is DONE.
