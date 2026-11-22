#!/usr/bin/env node
/**
 * Credentia style rule guard.
 *
 * Rules
 *   1. No gradients anywhere (CSS functions, Tailwind bg-gradient utilities, the word itself).
 *   2. No dash punctuation in text: no em dash, no en dash, no double hyphen between words.
 *
 * Usage
 *   node scripts/check-style-rules.mjs            scan app, components, hooks, lib
 *   node scripts/check-style-rules.mjs path ...   scan only the given files or folders
 *
 * Add `style-ok` in a comment on the same line to silence one line on purpose.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname, sep } from 'node:path'

const ROOT = process.cwd()
const DEFAULT_TARGETS = ['app', 'components', 'hooks', 'lib']
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const STYLE_EXT = new Set(['.css'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build'])

// Supplied illustrations whose look depends on soft colour blending. Agreed exceptions.
const GRADIENT_ALLOW = new Set([
  'components/smoothui/components/siri-orb/index.tsx',
  'components/smoothui/components/siri-orb/siri-orb.css',
])

function walk(path, out = []) {
  const st = statSync(path)
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (SKIP_DIRS.has(name)) continue
      walk(join(path, name), out)
    }
  } else {
    out.push(path)
  }
  return out
}

/** Blank out comments but keep line breaks so line numbers stay right. */
function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  let s = src.replace(/\/\*[\s\S]*?\*\//g, blank)
  s = s.replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
  return s
}

function lineOf(src, index) {
  let line = 1
  for (let i = 0; i < index; i++) if (src.charCodeAt(i) === 10) line++
  return line
}

const STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g
const JSX_TEXT_RES = [/>([^<>{}]+)</g, /\}([^<>{}]+)</g]
const DOUBLE_HYPHEN_TEXT = /(^|\s)--(\s|$)|[A-Za-z0-9.,!?)]--[A-Za-z]/
// A hyphenated class name with a modifier, such as gf-front--bump, is code and not prose.
const BEM_TOKEN = /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+--[a-z0-9-]+/g

const findings = []
const add = (file, line, rule, snippet) =>
  findings.push({ file, line, rule, snippet: snippet.trim().slice(0, 110) })

function checkFile(abs) {
  const rel = relative(ROOT, abs).split(sep).join('/')
  const ext = extname(abs)
  const isCode = CODE_EXT.has(ext)
  const isStyle = STYLE_EXT.has(ext)
  if (!isCode && !isStyle) return

  const original = readFileSync(abs, 'utf8')
  const originalLines = original.split('\n')
  const silenced = (line) => /style-ok/.test(originalLines[line - 1] || '')

  // Rule 1: gradients
  if (!GRADIENT_ALLOW.has(rel)) {
    const re = /gradient/gi
    let m
    while ((m = re.exec(original))) {
      const line = lineOf(original, m.index)
      if (!silenced(line)) add(rel, line, 'no-gradient', originalLines[line - 1])
    }
  }

  // Rule 2: dash punctuation
  const stripped = stripComments(original)

  if (isCode) {
    const dashRe = /[–—]|&(?:mdash|ndash);|&#821[12];|&#x201[34];/gi
    let m
    while ((m = dashRe.exec(stripped))) {
      const line = lineOf(stripped, m.index)
      if (!silenced(line)) add(rel, line, 'no-dash-text', originalLines[line - 1])
    }

    const texts = []
    let s
    STRING_RE.lastIndex = 0
    while ((s = STRING_RE.exec(stripped))) texts.push({ index: s.index, text: s[2] })
    for (const re of JSX_TEXT_RES) {
      re.lastIndex = 0
      while ((s = re.exec(stripped))) texts.push({ index: s.index, text: s[1] })
    }
    for (const t of texts) {
      if (DOUBLE_HYPHEN_TEXT.test(t.text.replace(BEM_TOKEN, ''))) {
        const line = lineOf(stripped, t.index)
        if (!silenced(line)) add(rel, line, 'no-double-hyphen-text', originalLines[line - 1])
      }
    }
  }
}

const targets = process.argv.slice(2)
const roots = (targets.length ? targets : DEFAULT_TARGETS).map((t) => join(ROOT, t)).filter(existsSync)
const files = roots.flatMap((r) => walk(r))
files.forEach(checkFile)

if (findings.length === 0) {
  console.log(`style rules: OK (${files.length} files scanned)`)
  process.exit(0)
}

const seen = new Set()
const unique = findings.filter((f) => {
  const key = `${f.file}:${f.line}:${f.rule}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})
for (const f of unique) console.log(`${f.file}:${f.line}  [${f.rule}]  ${f.snippet}`)
const byRule = unique.reduce((acc, f) => ((acc[f.rule] = (acc[f.rule] || 0) + 1), acc), {})
console.log(`\nstyle rules: ${unique.length} problem(s) in ${files.length} files`, byRule)
process.exit(1)
