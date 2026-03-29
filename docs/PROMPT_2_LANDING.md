# PROMPT 2 — WORLD-CLASS LANDING PAGE
# Paste into Antigravity (Claude Opus 4.6). Attach 01_PROJECT_OVERVIEW.md + 02_WEBSITE_FRONTEND.md.

---

Build CREDENTIA's complete, world-class landing page inside `credentia-web/`. This must be a premium, heavily animated, glassmorphism-heavy page that looks like a funded Indian startup.

Design rules (follow strictly):
- Background: #0A0A0F deep black with animated floating gradient orbs
- Cards: glassmorphism — semi-transparent dark bg + backdrop-blur-xl + subtle border
- Accent: #F5C542 golden yellow ONLY for CTAs, highlights, and hover states
- Font: Syne for headings (via CSS var --font-syne), DM Sans for body
- Animations: Framer Motion on ALL sections — stagger, fade-in, slide-up, float
- Dark mode default, light mode supported via next-themes
- Every button MUST navigate somewhere — no dead buttons

---

## FILE 1 — `credentia-web/app/page.tsx`

This is the landing page. Import and render all components in order:

```typescript
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import ForCompanies from '@/components/landing/ForCompanies'
import Team from '@/components/landing/Team'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <ForCompanies />
      <Team />
      <CTA />
      <Footer />
    </main>
  )
}
```

---

## FILE 2 — `credentia-web/components/landing/Navbar.tsx`

Build a sticky navbar with:
- Glassmorphism background: `bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5`
- Logo: check if `/public/logo/` folder has files. If yes, use `<Image src="/logo/[filename]">` in a 36px rounded-full container. If no logo file found, use CSS logo: `<div className="w-9 h-9 rounded-xl bg-[#F5C542] flex items-center justify-center"><span className="text-black font-black">C</span></div>` + `CREDENTIA` text in #F5C542 Syne font
- Nav links: Features | How It Works | For Companies | Our Team — each smooth-scrolls to `#features`, `#how-it-works`, `#companies`, `#team`
- Right side: Dark/Light toggle (moon/sun icon) + "Login" ghost button → `/login` + "Get Started" yellow button → `/register`
- Mobile: hamburger that opens animated slide-down drawer
- Use `'use client'` and `useTheme` from next-themes for toggle

```typescript
'use client'
// Full navbar implementation with all features above
// Use framer-motion for mobile menu animation
// Use next/link for Login and Get Started buttons
// Smooth scroll: onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}
```

---

## FILE 3 — `credentia-web/components/landing/Hero.tsx`

Full-screen hero with:

**Background:**
- Base: `bg-[#0A0A0F]`
- 3 animated gradient orbs using CSS keyframes:
  - Orb 1: 600px circle, purple #7C3AED/20, top-left, 10s drift loop
  - Orb 2: 500px circle, yellow #F5C542/10, bottom-right, 13s counter-drift
  - Orb 3: 400px circle, blue #2563EB/15, center, 8s pulse

**Content (centered, max-w-4xl):**
1. Badge: `🇮🇳 India's #1 Credential Platform` — pill shape, border-[#F5C542]/30, pulsing green dot
2. H1 (Syne, 80px desktop/48px mobile):
   - Line 1: "Verify Once." (white)
   - Line 2: "Trusted Forever." (#F5C542)
   - Each word animates in with staggered FadeInUp
3. Subtitle (DM Sans, 20px, #9999AA): "Upload your resume, police certificate, and Aadhaar — get AI-verified in minutes. Share one link with every company you apply to."
4. CTA buttons:
   - "Start Verifying Free →" → next/link href="/register" — bg-[#F5C542] text-black font-bold h-14 px-8 rounded-xl hover:bg-[#D4A017] hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,197,66,0.3)]
   - "See How It Works" → smooth scroll to #how-it-works — border border-[#F5C542] text-[#F5C542] h-14 px-8 rounded-xl hover:bg-[#F5C542]/10
5. Social proof: 5 colored avatar initials + "Join 50,000+ students already verified"

**Floating verification badges (below CTA):**
3 chips floating with `animate-float`:
- "✅ Resume Verified — 94/100"
- "✅ Police Verified — Delhi"
- "✅ Aadhaar Verified"
Each: `glass rounded-full px-5 py-2.5 border border-[#F5C542]/20 text-sm text-white`

---

## FILE 4 — `credentia-web/components/landing/Stats.tsx`

Dark band `bg-[#13131A]` with 4 stats using react-countup:
- 50,000+ Students Verified
- 1,200+ Companies Hiring
- 300+ Universities
- 99.2% Accuracy

Each stat: large Syne number in white, DM Sans label in #9999AA.
Animate counts when section enters viewport using `useInView` from framer-motion.
Dividers between stats with `border-r border-[#2A2A3A]`.

---

## FILE 5 — `credentia-web/components/landing/Features.tsx`

Section id="features". 6 cards in 3x2 grid.

Each card must have:
- Glass background: `bg-[#13131A]/80 backdrop-blur-sm border border-[#2A2A3A] rounded-2xl p-7`
- Gradient icon circle: 56px, white icon inside
- Hover: `hover:border-[#F5C542]/50 hover:shadow-[0_0_30px_rgba(245,197,66,0.1)] hover:-translate-y-1 transition-all duration-300`
- Framer Motion stagger animation

Cards:
1. 🤖 AI Resume Scoring — gradient: purple→blue — "Groq AI analyzes your PDF, gives ATS score 0-100, finds missing keywords."
2. 🚔 Police Verification — gradient: red→orange — "Upload certificate or paste link. AI extracts certificate number, authority, district — no manual process."
3. 👆 Aadhaar Verified — gradient: green→teal — "Upload front/back. AI extracts details. Full number NEVER stored — only last 4 digits."
4. 🎓 University ERP — gradient: blue→indigo — "Universities push academic records directly. Companies see CGPA, degree, branch — verified."
5. 🔗 One Verified Link — gradient: yellow→orange — "credentiaonline.in/verify/your-id — paste everywhere. Instant trust."
6. 🏢 Smart Hiring — gradient: pink→purple — "Companies filter by police status, ATS score, CGPA, university. Hire with zero doubt."

---

## FILE 6 — `credentia-web/components/landing/HowItWorks.tsx`

Section id="how-it-works". 3-step horizontal layout.

Background: subtle gradient from #0A0A0F to #13131A.

Steps with animated connecting line (SVG dashed line that draws itself on scroll):

Step 1 — "Register & Upload" — Icon: UserPlus — "Create your account in 30 seconds. Upload resume, police certificate, or paste a link."

Step 2 — "AI Verifies Everything" — Icon: Cpu — "Groq AI model (llama-3.3-70b) analyzes your documents instantly. Extracts data, checks authenticity, gives confidence scores."

Step 3 — "Share Your Profile" — Icon: Share2 — "Get one verified link. Paste it on your resume, LinkedIn, emails. Every company trusts CREDENTIA."

Each step: numbered circle (1/2/3) in golden gradient, step content below, FadeInLeft animation with 0.3s stagger.

---

## FILE 7 — `credentia-web/components/landing/ForCompanies.tsx`

Section id="companies". Split layout: left text, right mockup.

Left: 
- Label: "FOR COMPANIES" in #F5C542
- H2: "Hire With Confidence, Not Hope"
- 4 bullet points with check icons:
  - "See police verification status instantly"
  - "Filter by ATS score, CGPA, verified skills"
  - "No document fraud — AI-verified only"
  - "Build trusted talent pipelines"
- CTA: "Start Hiring →" → `/register`

Right: Mockup card showing a fake candidate card with verification badges (Resume ✅ 94/100, Police ✅, Aadhaar ✅, Degree ✅). Make it look like a real UI card with glass morphism.

---

## FILE 8 — `credentia-web/components/landing/Team.tsx`

Section id="team". This section is CRITICAL — founder photos must show.

Check `/public/owner/` folder for these exact files:
- `Pranjal.jpg`
- `Nihal.jpg`
- `KRITI.jpeg`
- `Pragya.jpg`

Build the team array with exact filenames:
```typescript
const team = [
  { name: 'Pranjal', image: '/owner/Pranjal.jpg', role: 'Founder & Lead Developer', bio: 'Full-stack engineer driving CREDENTIA\'s technical vision. Passionate about solving India\'s credential trust problem.' },
  { name: 'Nihal', image: '/owner/Nihal.jpg', role: 'Co-Founder & Backend', bio: 'Backend architect building the scalable infrastructure behind CREDENTIA\'s AI verification engine.' },
  { name: 'Kriti', image: '/owner/KRITI.jpeg', role: 'Co-Founder & Strategy', bio: 'Shaping CREDENTIA\'s product roadmap and driving partnerships with universities and companies across India.' },
  { name: 'Pragya', image: '/owner/Pragya.jpg', role: 'Co-Founder & Design', bio: 'Crafting the visual identity and user experience that makes CREDENTIA feel premium and trustworthy.' },
]
```

**Photo layout:**
- 4 columns, circular photos `w-36 h-36 rounded-full object-cover object-top`
- Ring on hover: `ring-4 ring-[#F5C542] ring-offset-4 ring-offset-[#0A0A0F]`
- Golden glow: `group-hover:shadow-[0_0_40px_rgba(245,197,66,0.4)]`

**Click to expand modal:**
When photo is clicked, open a beautiful modal overlay:
- Backdrop: `fixed inset-0 bg-black/80 backdrop-blur-sm z-50`
- Modal card: `glass rounded-3xl p-8 max-w-sm w-full mx-4`
- Large photo (120px circular) + name + role + bio + close button (X)
- Animate in with Framer Motion scale+opacity
- Close on backdrop click or X button

**IMPORTANT for image error handling:**
```typescript
onError={(e) => {
  const t = e.currentTarget as HTMLImageElement
  t.style.display = 'none'
  const p = t.parentElement
  if (p) p.innerHTML = `<div style="width:100%;height:100%;background:#1C1C26;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#F5C542;">${member.name[0]}</div>`
}}
```

---

## FILE 9 — `credentia-web/components/landing/CTA.tsx`

Full-width CTA section with:
- Background: gradient from #13131A to #1C1C26 with golden orb glow
- H2: "Ready to Get Verified?" (Syne ExtraBold, 52px)
- Subtitle: "Join 50,000+ students. Get your credentials verified today — free."
- Two buttons: "Get Started Free →" → /register | "See Demo" → smooth scroll to #features
- Subtle floating particles animation (5-6 small golden dots)

---

## FILE 10 — `credentia-web/components/landing/Footer.tsx`

Professional footer with:
- 4 columns: Brand | Product | For | Legal
- Brand column: Logo + "CREDENTIA" + tagline + social icons (Twitter, LinkedIn, Instagram)
- Product column: Features, How It Works, Pricing, API
- For column: Students, Companies, Universities, Admins
- Legal: Privacy Policy, Terms, Contact
- Bottom bar: "© 2025 CREDENTIA. Built with ❤️ for India 🇮🇳"
- ALL links must use next/link href="/login" or appropriate anchor

**IMPORTANT**: Every footer link must be a proper `<Link href="...">` — NOT dead text.

---

## FINAL INSTRUCTION

After building all 10 files, run:
```bash
cd credentia-web && npm run build
```

Fix ALL errors. Common ones:
- Unescaped `'` → use `&apos;`
- Missing types → add `: any` temporarily
- Module not found → check import paths

Build must pass with zero errors before finishing this prompt.
