# Credentia UI Rebuild Plan

Branch: `ui-rebuild-v2` (local only, nothing is pushed until the owner says so).
This file replaces every earlier plan and prompt. The old `docs/PROMPT_*.md` and `docs/MASTER_GUIDE.md` were removed from the working tree.

## 1. Intent

The current UI reads as generic and AI made: five fonts, navy and indigo palette, gradients everywhere, a pile of light mode overrides, 3D decorations, fake "trusted by" institutions. The rebuild replaces the whole presentation layer with one coherent system built from the owner supplied reference components. Backend contracts (Supabase tables, existing API routes, R2 storage, Gemini and Groq verification) stay as they are.

## 2. Hard rules

Design
- Black background, red accent. One theme only. Light mode and the theme toggle are removed.
- No gradients on any surface, button, border, text or background. Glass morphism comes from translucent flat fills, backdrop blur, hairline borders and inset highlights.
- No double hyphens and no dash punctuation (em dash, en dash) in any visible text. A scan script enforces it.
- Two fonts only: Manrope (interface and headings) and JetBrains Mono (numbers, ids, codes).
- Contrast at least 4.5 to 1 for text, 3 to 1 for large text and UI glyphs. Visible focus rings. Touch targets at least 44px.

Data
- No fake data in any shipped view. Every figure comes from Supabase or a real API call. Empty states replace placeholders.
- Fixtures exist only in dev only gallery routes that return 404 in production.

Performance
- Smooth scroll on public pages (Lenis synced to GSAP ScrollTrigger). Dashboards scroll natively inside their stage.
- Animate transform and opacity only. Respect `prefers-reduced-motion` everywhere.
- Background morph has a frame time guard that freezes it to a still frame on slow devices.
- At most five backdrop blurred surfaces on screen at once.

Process
- Work stays on `ui-rebuild-v2`. No commits unless asked. No push.
- Local dev server uses the production Supabase project (same keys). Testing is read only unless a dedicated test account is used.

## 3. Removed

3D and decorative layers: `PerspectiveGrid`, `AuroraLayer`, `SpotlightBackground`, `ui/tilt`, Spline usage, the 3D trust vault, `CustomCursor`, `MagneticButton`, `PageIntro` splash, `ScrollProgress`, light mode override CSS (about 700 lines of `globals.css`), `public/output.css`.
Legacy code deleted in QA: every old admin page and `AdminClient`, `SupportChat`, the old `ProfileAvatar`, `ui/tilt`, `ui/vertical-cut-reveal`, unused hooks, the legacy Tailwind colour aliases, and the routes `/api/chat/*`, `/api/admin/police-action`, `/api/inspect`, `/api/test-rls` and `/api/student/update-academics` (the last one let anyone change any student's CGPA).
Fake content: the "Trusted at India's Leading Institutions" marquee of named institutions that are not partners. Replaced by real registered universities from the database, or an honest call to action when there are none.

## 4. Reference component map

| Reference | Used for | Adaptation |
|---|---|---|
| LiquidButton | All primary, secondary and destructive buttons across site, auth, dashboards, dialogs | Red and black variants, `href` support so links stay real anchors, SSR safe layout effect, Tailwind valid class names. Dense table row actions and icon buttons use the lighter SmoothButton so pages with many rows stay fast |
| SearchModal | Every search surface in site, dashboards and admin | `CredentiaSearch` wrapper with role scopes, Cmd or Ctrl K, live DB results from `/api/search`, AI query understanding. Every table search and the inbox and company searches hand their words to it with Ask AI. The public site has its own `SiteSearch` that finds pages word by word and sends a real question to Peon, because a visitor is not signed in and the database is not searched for them |
| MegaMenuNavbar | The main header, built as a floating glass notch | Credentia items that link only to routes that exist. The pasted source was corrupted in the middle, the intended structure is rebuilt |
| FluidMorphBg | Fixed background of the whole UI | Black base with deep red shapes at low contrast, frame time guard |
| PinnedList | Pins in every dashboard | Pins persist per user in local storage. Company saved candidates keep using the `saved_candidates` table |
| ButtonCopy | Every copy action | Verified link, certificate number, token, email |
| BlurOutUp | Headline and key text entrance | Hero, page titles |
| GooeyTextReveal | Text appearing on scroll across the site | GSAP SplitText. Re-split on every parent render is fixed |
| MorphText | The rotating hero word | Uses app font, no duplicate font import |
| GlassyDashboard | Shell and views of all four dashboards | Real Next routes instead of hash views, flat glass, GSAP count up and route transitions, real data only |
| GlassFolder | Document shelves in every dashboard, opens a Finder style window popup | Red and black artwork recipes. Flat front glass |
| AILoader | Upload verification states | Stage labels tied to real request progress |
| SiriOrb and AI conversation set | Peon, the Credentia AI agent | Streaming reasoning, tool calls and cited answers, orb in Credentia colors |
| GooeyFilter | Peon launcher with quick actions, elastic notification badge | |
| ExpandableBentoGrid | Hero section grid | Cards expand to real feature detail and real portal links |
| GlassDock | Quick access dock in dashboards, links dock in the footer | Morphing icons, halo CSS written for the supplied animation variables |

Tailwind is v3.4 with colour tokens stored as RGB triplets (`rgb(var(--x) / <alpha-value>)`). The SmoothUI ports live under `components/smoothui/`.

SmoothUI sources (`siri-orb`, `pinned-list`, `smooth-button`, `button-copy`, `blur-out-up`, `ai-*`, `gooey-filter` plus the shared `tokens` and `lib`) are pulled from the official registry at `smoothui.dev/r` and restyled. `motion/react` imports map to the installed `framer-motion`.

New dependencies: `gsap`, `@gsap/react`, `lenis`, `@phosphor-icons/react`, `@base-ui/react` (only if SmoothButton keeps it).

## 5. Layout of the code

```
app/
  globals.css            tokens, glass utilities, base (about 250 lines)
  layout.tsx             fonts, background, smooth scroll, providers
  (site)/                header notch, footer, Peon, every public page
  (auth)/                login and register
  dashboard/             shell plus student, company, university, admin routes
  api/search, api/peon, api/public-stats      new, authenticated where needed
components/
  ui/        liquid-button, smooth-button, button-copy, blur-out-up, gooey-text-reveal,
             morph-text, gooey-filter, ai-loader, pinned-list, glass-folder, glass-dock,
             expandable-bento-grid, siri-orb, ai-*, search-modal
  shell/     fluid-bg, smooth-scroll, mega-menu-navbar, dashboard-shell, folder-window
  site/      landing sections, footer, info page layout
  dash/      panel, metric, charts, data table, dialog, confirm dialog, form controls, folder shelf, pin shelf,
             entity manager (universities and companies), role badge, analysis report, document flow
  peon/      launcher, panel, stream hook
  search/    credentia-search wrapper
hooks/       use-admin (loads and refreshes an admin resource), use-student-data, use-talent, use-registry, use-peon
lib/         api-auth, admin (guard and audit), admin-data (paged reads), admin-types, platform-settings,
             student-scores, ai (Gemini then Groq), search, public stats, status, documents, format
scripts/     check-style-rules.mjs, check-links.mjs  (npm run check:style, npm run check:links)
```

## 6. Phases and exit gates

Every phase ends with: `tsc --noEmit` clean, `next lint` clean, style rule scan clean, and a browser check of what changed.

1. Foundation: tokens, Tailwind config, fonts, `globals.css`, FluidMorphBg, Lenis, guard scripts, branch hygiene.
2. Component ports: SmoothUI set, LiquidButton, SearchModal, GooeyTextReveal, MorphText, GlassFolder, GlassDock, ExpandableBentoGrid. Dev only gallery at `/dev/ui` to review each one.
3. Dashboard kit and shell: header, side and bottom docks, panels, metrics, charts, data table, folder window, pin shelf, quick access dock.
4. Public site: notch navbar, landing (hero, bento grid, portals, pipeline, live stats, team, call to action, footer), the 12 info pages, login, register, public verified profile.
5. Student dashboard (10 pages), then company (5), university (3), admin (9).
6. Search API and modal everywhere, Peon agent and launcher.
7. QA: types, lint, build, link crawl, style scan, mobile and desktop browser checks, reduced motion, console clean.

Status: every phase is built. Gates that pass on this branch: `tsc --noEmit`, `next lint` (no errors), `next build`, `npm run check:style` (0), `npm run check:links` (0 broken). Browser checks cover all dashboard pages at 1440 and 390 pixels with no horizontal overflow, and the admin dialogs, forms and search hand offs were exercised against mocked responses.

## 7. Server work

- `GET /api/search?q=&scope=` Authenticated. Role scoped on the server. Parallel queries over the tables the role may read. Natural language queries pass through Gemini then Groq to extract filters, never raw SQL. Fast path for short queries, short lived cache for AI parses.
- `POST /api/peon` Streams events (reasoning, tool call, tool result, token, citations, done). Tools are read only and scoped to the caller: own verifications, own applications, platform help, search, hand off to human support (existing support tables).
- `/api/admin/*` Every route starts with `requireAdmin()` (session, never an id from the client), accepts only whitelisted fields, and writes an audit row with the real columns (`actor_id`, `actor_email`, `action`, `target_type`, `target_id`, `details`). Read routes (`overview`, `analytics`, `users`, `verifications`, `audit`, `entities`, `support`, `settings`) read in pages of 1000 rows, because one request returns at most 1000. Write routes: `update-verification`, `bulk-approve`, `update-student`, `update-profile`, `update-role`, `update-entity`, `toggle-company-access`, `support` (reply, read, resolve, delete) and `settings`. Decisions recalculate the student's scores and notify the student. The university access key is never selected.
- `GET /api/public-stats` Aggregate counts only, cached for a minute. Feeds the landing numbers and the real institutions list.
- Student documents. `POST /api/upload` stores a PDF, JPG or PNG at `credentia/students/<account id>/<folder>/<time>-<random>-<name>`, where the folder is one of seven listed ones. `POST /api/verify-aadhaar`, `verify-degree`, `verify-marksheet`, `verify-police` and `/api/analyze-resume` take `{ fileUrl }` (plus `marksheetType` for marksheets), read that file by key from the caller's own folder, let the AI read it and return `{ analysis, status, seal }`. The status is `ai_approved`, `needs_review` or `rejected`, decided on the server by `lib/doc-policy.ts` from the stored settings. `POST /api/save-verification` takes `{ type, seal }`, or `{ type: 'passport', fileUrl }` for a document stored without the AI, and `POST /api/save-document` records the older `documents` row. The student document pages use `DocumentFlow`, which shows one loader stage for each request (Upload, Read, Review, Save). Shared code: `lib/doc-files.ts` (file rules, keys, address check), `lib/doc-seal.ts`, `lib/doc-policy.ts`, `lib/doc-analysis.ts`, `lib/doc-read.ts` and `lib/r2.ts`.

## 8. Findings that need the owner

1. The GitHub repository is public and `docs/MASTER_GUIDE.md` was tracked in it with live credentials (Groq, Cloudflare R2, Resend, project ids). Deleting the file does not remove it from history. Those keys must be rotated.
2. Several API routes ran with the service role and no authentication. Fixed in this branch: all of `/api/admin/*`, `/api/company/*`, `/api/university/*`, `/api/student/*`, `/api/ensure-profile` and `/api/student/companies` now take the person from the session; `/api/chat/*`, `/api/inspect`, `/api/test-rls` and `/api/student/update-academics` were deleted. Also fixed: the student document pipeline, `/api/upload`, `/api/verify-aadhaar`, `/api/verify-degree`, `/api/verify-marksheet`, `/api/verify-police`, `/api/analyze-resume`, `/api/save-document` and `/api/save-verification`. They used to take the student id, the verification status and the AI analysis from the browser, so a signed in student could mark their own documents verified or write to another student's records, `/api/upload` needed no sign in at all, and the verify routes fetched whatever address they were given. Now every one of them takes the person from the session (`getCallerWithRole(['student'])`) and is rate limited. An upload is judged by its real bytes (PDF, JPG or PNG, up to 10 MB) and stored under the student's own folder. A verify route reads the file from storage by its key, never from an address the browser sends, and refuses anything outside the caller's folder. The server decides the status from the AI result and seals the result with an HMAC. The browser carries the seal back to `/api/save-verification`, which believes nothing else, can never save `admin_verified` or `verified`, clears any earlier admin review of that slot and recalculates the student's flags, trust score and counts. Checked with a harness of 190 tests (kept outside the repo, with mutation checks) and mocked browser runs of all four student document pages. What is still worth knowing:

   - The files stay publicly readable (item 8). The AI can still be talked round by a crafted document, so if that matters, add Aadhaar and degree to the documents that need a person (Settings, Documents that need a person).
   - The seal is signed with `DOC_SEAL_SECRET` when that is set, otherwise with a key derived from the service role key. Rotating the service role key (item 1) makes results that are waiting to be saved invalid. They last an hour and the student simply reads the document again. Setting `DOC_SEAL_SECRET` keeps the two apart.
   - The rate limits live in memory on each server instance, like the other limits.
   - Files uploaded before this change sit at the old key layout (`credentia/<folder>/...`). Their links keep working, but the verify routes only accept files uploaded since, so a student re-uploads to check one again.
   - Two things were removed because they only worked by trusting the browser: the "paste a link" box on the police page (the server fetched that address) and the hand typed police entry in the verify route.
   - The upload limit is 10 MB. Some hosts cap a request body lower (Vercel functions cap it near 4.5 MB), so check that larger files reach the route on the live site. Not changed here.
3. `.env.local` points at the production Supabase project, so local testing touches production data.

4. **The AI models the app calls have been retired.** Checked on 20 Nov 2026 against the live model lists: `gemini-2.0-flash` and `gemini-2.5-flash` return 404 ("no longer available"), and Groq no longer offers `llama-3.3-70b-versatile` or the Llama 4 vision model. Every document check in production (`lib/groq.ts`) would fail with "both providers down". Fixed in this branch: `lib/ai-config.ts` lists `gemini-3.5-flash` then `gemini-3.1-flash-lite` for documents (minimal thinking), Groq `openai/gpt-oss-120b` for fast text. Groq has no image model, so scanned images can only be read by Gemini. Model names can be overridden with `GEMINI_MODELS`, `GEMINI_FAST_MODELS`, `GROQ_MODEL`, `GROQ_VISION_MODEL`.
5. `/api/admin/update-verification` writes audit rows with columns that do not exist (`admin_id`, `metadata`). The table has `actor_id`, `actor_email`, `details`, so those admin actions are not being audited. Fixed: every admin action now writes `actor_id`, `actor_email` and `details`.
6. Supabase must whitelist `/reset-password` as a redirect URL for the new password reset flow to work.
7. Optional speed up for search at scale: trigram indexes on the searched text columns (`create extension pg_trgm`, then `create index ... using gin (name gin_trgm_ops)` on students.name, students.email, profiles.full_name, profiles.email, companies.company_name, universities.university_name). Not applied by this work, the tables are small today.
8. Uploaded documents (including Aadhaar and police certificates) are stored in Cloudflare R2 behind a public URL, so anyone who has a link can open the file. The student pages say the file is stored in Cloudflare R2 and do not claim it is private. A private bucket with short lived signed links would fix it.
9. Three of the four `platform_settings` values now decide documents: `ai_confidence_threshold` (the least confidence for the AI to approve an Aadhaar, degree, marksheet or police certificate), `auto_resume_threshold` (a resume must score above it) and `manual_review_types` (types that always go to an admin). They are read with a 30 second cache, and the cache is cleared when an admin saves. Until an admin saves a value, the default the settings page shows applies: 70, 60 and police. That is stricter than the old built in limits (40 for Aadhaar, degree and marksheets, and 80 with no admin step for police), so police certificates now always wait for an admin. Choosing "None, trust the AI" in Settings undoes that. `maintenance_mode` is still only recorded, and the settings page says so.
10. A company's approval is only a badge that students see. It does not gate talent search. A university's approval does gate its registry.
11. The admin login form accepts one hard coded address. Real admin rights come from `profiles.role` and the `admin_whitelist` table.

## 9. Reference

Database tables and columns (read from the live PostgREST schema, no row data):

- `profiles` id, role (student, company, university, admin), full_name, email, phone, avatar_url, is_active, linked_university_id, login_portal, last_login_at, last_login_portal, created_at, updated_at
- `students` id, name, email, university_id, roll_number, course, branch, graduation_year, date_of_birth, gender, city, state, resume_url, resume_filename, ats_score, verification_score, trust_score, profile_complete_pct, verified_docs_count, aadhaar_verified, police_verified, degree_verified, aadhaar_last4, aadhaar_name, aadhaar_state, aadhaar_dob, cgpa, academic_verified, academic_verified_by, percentage_10th, percentage_12th, experience_years, skills (text[]), share_token, profile_is_public, profile_views, police_share_with_companies, role
- `verifications` id, student_id, type (resume, police, aadhaar, degree, marksheet_10th, marksheet_12th), status, document_url, document_filename, document_r2_key, external_link, ai_confidence, ai_result (jsonb), admin_reviewed_by, admin_reviewed_at, rejection_reason, submitted_email, result_email. Every student has one row per type from the start.
- `companies` id, company_name, industry, gst_number, company_size, website, logo_url, state, description, is_verified, require_police_verification, require_aadhaar, require_degree, minimum_ats_score, minimum_cgpa
- `universities` id, university_name, ugc_id, naac_grade, state, city, erp_access_key (secret, never exposed), data_sharing_on, is_verified
- `applications` id, student_id, company_id, job_title, status, company_notes, applied_via; `saved_candidates` id, company_id, student_id, notes; `company_access` id, student_id, company_id, granted_by, status
- `support_conversations` id, user_id, user_role, user_name, user_email, status (open, resolved), subject, last_message_at; `support_messages` id, conversation_id, sender_id, sender_role, content, file_url, file_name, file_type, is_read
- `notifications` id, user_id, title, message, type, action_url, is_read; `audit_logs` id, actor_id, actor_email, action, target_type, target_id, details (jsonb); `platform_settings` key, value, label, description; `documents` (older upload table); `admin_whitelist` email

Verification statuses seen: `not_submitted`, `ai_approved`, `needs_review`, `admin_verified`, `verified`, `rejected`, `pending`. Counted as verified: `ai_approved`, `admin_verified`, `verified`. Shared helpers: `lib/status.ts`, `lib/documents.ts`.

Visibility rules the code already follows: companies only see students with `profile_is_public = true` (students toggle it in Settings, admins can override it). Universities see students where `students.university_id` equals the university's profile id, and only once `universities.is_verified` is true. The public verify link works only while `profile_is_public` is true.

Search contract: `GET /api/search?q=&types=&ai=1` returns `{ query, ai: { summary } | null, groups: [{ type, label, hits: [{ id, type, title, subtitle, badge, href, avatar }] }], tookMs }`. Roles and allowed types live in `lib/search/types.ts`. Pages that search link back with `?q=` or an id parameter (`?student=`, `?application=`, `?verification=`, `?conversation=`, `?company=`), so each dashboard page must read those.

## 10. Calls made on the owner's behalf

- "desloping" read as removing every 3D and unnecessary panel.
- "--" read as no double hyphen and no dash punctuation in visible text.
- Dark only, custom cursor removed.
- Gradient free everywhere except the two supplied illustrations whose look depends on soft color blending: the SiriOrb (Peon) and the GlassFolder artwork.
- Peon sits in front of the existing human support chat and hands off to it.
- Pins persist in local storage because the database schema is not changed in this work.
- GlassFolder is used in all four role dashboards (documents for students, candidates for companies, cohorts for universities, review queues and accounts for admins). It is not forced onto settings pages or the support inbox, where there are no documents to show.
- The SiriOrb glow in the Peon launcher is the only gradient rendered on any page. A runtime scan of every public page and every dashboard page confirmed it.
- `IGNORE/` (untracked private notes) and `Credentia Landing.html` (old design export) are left untouched.
