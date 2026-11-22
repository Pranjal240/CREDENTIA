#!/usr/bin/env node
/**
 * Credentia link guard.
 *
 * Finds every internal link written in the source and checks that it leads
 * somewhere: a page in app/, an API route, or a file in public/.
 *
 * What counts as a link: a string that is a whole path, such as "/pricing",
 * "/dashboard/admin/users?q=" or `/verify/${token}`. A template expression is
 * a wildcard, and the path passes when at least one real page or route fits it.
 *
 * Usage
 *   node scripts/check-links.mjs
 *
 * Add `link-ok` in a comment on the same line to skip one line on purpose.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname, sep } from 'node:path'

const ROOT = process.cwd()
const SCAN = ['app', 'components', 'hooks', 'lib']
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git'])
const WILD = '\u0001'

const walk = (path, out = []) => {
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) if (!SKIP_DIRS.has(name)) walk(join(path, name), out)
  } else out.push(path)
  return out
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* ---------- Routes ---------- */

/** Turns app/(site)/login/[portal]/page.tsx into a matcher for /login/<anything>. */
function routeMatcher(file, kind) {
  const dir = relative(join(ROOT, 'app'), file).split(sep).slice(0, -1)
  const parts = dir.filter((p) => !(p.startsWith('(') && p.endsWith(')')) && !p.startsWith('@'))
  let source = ''
  for (const part of parts) {
    if (/^\[\[\.\.\..+\]\]$/.test(part)) source += '(?:/.*)?'
    else if (/^\[\.\.\..+\]$/.test(part)) source += '/.+'
    else if (/^\[.+\]$/.test(part)) source += '/[^/]+'
    else source += '/' + escapeRe(part)
  }
  const dynamic = parts.some((p) => /^\[.+\]$/.test(p))
  return {
    re: new RegExp('^' + source + '/?' + String.fromCharCode(36)),
    kind,
    literal: dynamic ? null : '/' + parts.join('/'),
    file: relative(ROOT, file).split(sep).join('/'),
  }
}

const appFiles = existsSync(join(ROOT, 'app')) ? walk(join(ROOT, 'app')) : []
const routes = []
for (const f of appFiles) {
  const base = f.split(sep).pop()
  if (/^page\.(tsx|ts|jsx|js)$/.test(base)) routes.push(routeMatcher(f, 'page'))
  else if (/^route\.(ts|js)$/.test(base)) routes.push(routeMatcher(f, 'api'))
  else if (/^(icon|apple-icon|opengraph-image|twitter-image)\.(png|jpg|ico|tsx|ts)$/.test(base)) routes.push(routeMatcher(f, 'asset'))
}
const metadataRoutes = ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/favicon.ico']

const publicExists = (path) => existsSync(join(ROOT, 'public', path.replace(/^\//, '')))

function resolves(path) {
  if (path === '/') return true
  if (metadataRoutes.includes(path)) return true
  if (path.includes(WILD)) {
    // A path with a template expression is fine when at least one real page or route can fit it.
    const fits = new RegExp('^' + escapeRe(path).split(WILD).join('[^/]*') + '/?' + String.fromCharCode(36))
    const sample = path.split(WILD).join('x')
    return routes.some((r) => r.re.test(sample) || (r.literal !== null && fits.test(r.literal)))
  }
  if (routes.some((r) => r.re.test(path))) return true
  return extname(path) !== '' && publicExists(path)
}

/* ---------- Links in the source ---------- */
const STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g
const found = []

for (const root of SCAN) {
  const dir = join(ROOT, root)
  if (!existsSync(dir)) continue
  for (const file of walk(dir)) {
    if (!CODE_EXT.has(extname(file))) continue
    const rel = relative(ROOT, file).split(sep).join('/')
    const text = readFileSync(file, 'utf8')
    const lines = text.split('\n')
    let m
    STRING_RE.lastIndex = 0
    while ((m = STRING_RE.exec(text))) {
      let value = m[2]
      // A whole path that starts with a letter after the slash.
      if (!/^\/[a-zA-Z]/.test(value)) continue
      if (/\s/.test(value.replace(/\$\{[^}]*\}/g, ''))) continue
      value = value.replace(/\$\{[^}]*\}/g, WILD)
      const path = value.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
      // Things that look like paths but are not links: module specifiers and MIME types.
      if (/^\/(?:[a-z-]+\/)*[a-z-]+\.(?:css|js|mjs|tsx?)$/.test(path) && !publicExists(path)) continue
      if (/^\/(?:application|image|text|video|audio)\//.test(path)) continue
      const line = text.slice(0, m.index).split('\n').length
      if (/link-ok/.test(lines[line - 1] || '')) continue
      found.push({ file: rel, line, path, raw: m[2] })
    }
  }
}

const unique = new Map()
for (const f of found) {
  if (resolves(f.path)) continue
  const key = `${f.file}:${f.line}:${f.path}`
  if (!unique.has(key)) unique.set(key, f)
}

const checked = new Set(found.map((f) => f.path)).size
if (unique.size === 0) {
  console.log(`links: OK (${checked} distinct internal paths checked against ${routes.length} routes)`)
  process.exit(0)
}
for (const f of unique.values()) console.log(`${f.file}:${f.line}  no route or file for  ${f.raw}`)
console.log(`\nlinks: ${unique.size} broken (${checked} distinct paths checked against ${routes.length} routes)`)
process.exit(1)
