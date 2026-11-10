// Validates data-src/test-NN-{A,B,C}.json drafts and builds public/tests/test-NN.json + index.json.
// Usage:  node scripts/build-tests.mjs          (all tests that have drafts)
//         node scripts/build-tests.mjs 03       (validate/build only test 03)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'data-src')
const outDir = path.join(root, 'public', 'tests')

const BLUEPRINT = [
  { part: 'A', file: 'A', section: 'gram', name: 'Grammar', count: 15, lang: 'en' },
  { part: 'A', file: 'A', section: 'vocab', name: 'Vocabulary', count: 15, lang: 'en' },
  { part: 'A', file: 'A', section: 'rc', name: 'Reading Comprehension', count: 15, lang: 'en' },
  { part: 'A', file: 'A', section: 'ped', name: 'Pedagogy of Language Development', count: 15, lang: 'bi' },
  { part: 'B', file: 'B', section: 'psych', name: 'Educational Psychology', count: 6, lang: 'bi' },
  { part: 'B', file: 'B', section: 'assess', name: 'Assessment & Evaluation', count: 4, lang: 'bi' },
  { part: 'B', file: 'B', section: 'pedag', name: 'Pedagogy', count: 3, lang: 'bi' },
  { part: 'B', file: 'B', section: 'attitude', name: 'Pedagogical Attitudes', count: 2, lang: 'bi' },
  { part: 'C', file: 'C', section: 'hindi', name: 'General Hindi', count: 5, lang: 'hi' },
  { part: 'C', file: 'C', section: 'english', name: 'General English', count: 5, lang: 'en' },
  { part: 'C', file: 'C', section: 'mental', name: 'Mental Ability', count: 5, lang: 'bi' },
  { part: 'C', file: 'C', section: 'computer', name: 'Computer Education', count: 5, lang: 'bi' },
  { part: 'C', file: 'C', section: 'gk', name: 'General Knowledge', count: 5, lang: 'bi' },
]

const DEVANAGARI = /[ऀ-ॿ]/
const isStr = (v) => typeof v === 'string' && v.trim().length > 0

function validateQuestion(q, nn, spec, n, errors) {
  const tag = `${q.id ?? `?${spec.section}#${n}`}`
  const err = (m) => errors.push(`${tag}: ${m}`)
  const expectedId = `t${nn}-${spec.section}-${String(n).padStart(2, '0')}`
  if (q.id !== expectedId) err(`id should be ${expectedId}`)
  if (q.part !== spec.part) err(`part should be ${spec.part}`)
  if (q.section !== spec.section) err(`section should be ${spec.section}`)
  if (!isStr(q.topic)) err('missing topic')
  if (!isStr(q.question)) err('missing question')
  if (!isStr(q.explanation)) err('missing explanation')
  if (!Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(isStr)) err('options must be 4 non-empty strings')
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) err('correctIndex must be 0-3')
  if (Array.isArray(q.options) && new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) err('duplicate options')
  if (spec.section === 'rc') {
    if (!isStr(q.passageId)) err('rc question needs passageId')
  } else if (q.passageId) err('passageId only allowed in rc')

  const hasHi = 'questionHi' in q || 'optionsHi' in q || 'explanationHi' in q
  if (spec.lang === 'bi') {
    if (!isStr(q.questionHi) || !DEVANAGARI.test(q.questionHi)) err('questionHi must be Devanagari')
    if (!Array.isArray(q.optionsHi) || q.optionsHi.length !== 4 || !q.optionsHi.every(isStr)) err('optionsHi must be 4 strings')
    if (!isStr(q.explanationHi) || !DEVANAGARI.test(q.explanationHi)) err('explanationHi must be Devanagari')
  } else if (hasHi) err('Hi fields not allowed in this section')
  if (spec.lang === 'hi') {
    if (!DEVANAGARI.test(q.question) || !DEVANAGARI.test(q.explanation)) err('hindi section must be in Devanagari')
  }
  if (spec.lang === 'en' && (DEVANAGARI.test(q.question) || DEVANAGARI.test(q.options?.join('') ?? ''))) {
    // general English may quote Hindi rarely; flag so it's reviewed
    err('Devanagari found in English-only section')
  }
}

function readDraft(nn, letter) {
  const p = path.join(srcDir, `test-${nn}-${letter}.json`)
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function buildOne(nn) {
  const errors = []
  const drafts = {}
  for (const l of ['A', 'B', 'C']) {
    try {
      drafts[l] = readDraft(nn, l)
    } catch (e) {
      errors.push(`test-${nn}-${l}.json: invalid JSON (${e.message})`)
    }
    if (!drafts[l]) errors.push(`test-${nn}-${l}.json missing/unreadable`)
  }
  if (errors.length) return { errors }

  const questions = []
  for (const letter of ['A', 'B', 'C']) {
    const qs = drafts[letter].questions ?? []
    let cursor = 0
    for (const spec of BLUEPRINT.filter((b) => b.file === letter)) {
      const slice = qs.slice(cursor, cursor + spec.count)
      if (slice.length !== spec.count) errors.push(`section ${spec.section}: expected ${spec.count}, got ${slice.length}`)
      slice.forEach((q, i) => validateQuestion(q, nn, spec, i + 1, errors))
      const dist = [0, 0, 0, 0]
      slice.forEach((q) => (dist[q.correctIndex] = (dist[q.correctIndex] ?? 0) + 1))
      if (spec.count >= 10 && Math.max(...dist) > Math.ceil(spec.count * 0.45)) errors.push(`section ${spec.section}: correctIndex too skewed ${dist}`)
      questions.push(...slice.map((q) => ({ ...q, sectionName: spec.name })))
      cursor += spec.count
    }
    if (qs.length !== cursor) errors.push(`file ${letter}: has ${qs.length} questions, expected ${cursor}`)
  }

  const passages = drafts.A.passages ?? []
  if (passages.length !== 3) errors.push(`expected 3 passages, got ${passages.length}`)
  passages.forEach((p, i) => {
    if (p.id !== `t${nn}-p${i + 1}`) errors.push(`passage id should be t${nn}-p${i + 1}`)
    if (!isStr(p.text) || p.text.split(/\s+/).length < 90) errors.push(`passage ${p.id}: text too short`)
  })
  const rcQs = questions.filter((q) => q.section === 'rc')
  passages.forEach((p) => {
    const c = rcQs.filter((q) => q.passageId === p.id).length
    if (c !== 5) errors.push(`passage ${p.id}: has ${c} questions, expected 5`)
  })
  const ids = new Set()
  questions.forEach((q) => {
    if (ids.has(q.id)) errors.push(`duplicate id ${q.id}`)
    ids.add(q.id)
  })
  const totalDist = [0, 0, 0, 0]
  questions.forEach((q) => (totalDist[q.correctIndex] = (totalDist[q.correctIndex] ?? 0) + 1))
  if (Math.min(...totalDist) < 15) errors.push(`overall correctIndex distribution skewed ${totalDist}`)
  if (questions.length !== 100) errors.push(`total ${questions.length}, expected 100`)
  if (errors.length) return { errors }

  return {
    errors,
    test: {
      id: `test-${nn}`,
      number: Number(nn),
      title: `Test Series ${Number(nn)}`,
      totalQuestions: 100,
      totalMarks: 100,
      durationMinutes: 120,
      negativeMarking: 0.25,
      passages,
      questions,
    },
  }
}

const arg = process.argv[2]
const numbers = arg ? [arg.padStart(2, '0')] : Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'))
fs.mkdirSync(outDir, { recursive: true })
let failed = 0
const built = []
for (const nn of numbers) {
  if (!arg && !fs.existsSync(path.join(srcDir, `test-${nn}-A.json`))) continue
  const { errors, test } = buildOne(nn)
  if (errors.length) {
    failed++
    console.log(`✗ test-${nn}: ${errors.length} problem(s)`)
    errors.slice(0, 40).forEach((e) => console.log('   - ' + e))
    continue
  }
  fs.writeFileSync(path.join(outDir, `test-${nn}.json`), JSON.stringify(test))
  console.log(`✓ test-${nn}: 100 questions OK`)
}

// index from whatever test files exist
const files = fs.readdirSync(outDir).filter((f) => /^test-\d\d\.json$/.test(f)).sort()
const index = files.map((f) => {
  const t = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'))
  return { id: t.id, number: t.number, title: t.title, totalQuestions: t.totalQuestions, totalMarks: t.totalMarks, durationMinutes: t.durationMinutes }
})
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ tests: index }, null, 2))

// Cross-test / in-test redundancy check (strict).
// Two questions in the same section are redundant when, after normalising (case, quotes, blanks
// like ___ , punctuation), their stems are identical, OR their word-sets (question + correct answer,
// numbers included) overlap by >= 0.7 (Jaccard). Reading-comprehension items are only compared by stem.
const norm = (t) => t.toLowerCase().replace(/[_\u2018\u2019\u201C\u201D'"`]+/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
const tokens = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 2 || /\d/.test(w)))
const all = []
for (const f of files) {
  const t = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'))
  for (const q of t.questions) all.push({ q, test: t.id, stem: norm(q.question), toks: tokens(q.question + ' ' + q.options[q.correctIndex]) })
}
let dups = 0
for (let a = 0; a < all.length; a++) {
  for (let b = a + 1; b < all.length; b++) {
    const A = all[a], B = all[b]
    if (A.q.section !== B.q.section) continue
    let hit = A.stem === B.stem && A.stem.length > 0
    if (!hit && A.q.section !== 'rc') {
      let inter = 0
      for (const w of A.toks) if (B.toks.has(w)) inter++
      hit = inter / (A.toks.size + B.toks.size - inter) >= 0.7
    }
    if (hit) { dups++; console.log(`dup: ${B.q.id} ~ ${A.q.id}`) }
  }
}
console.log(`index.json: ${index.length} test(s); redundant question pairs: ${dups}`)
process.exit(failed || dups ? 1 : 0)
