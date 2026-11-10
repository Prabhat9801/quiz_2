// Marking scheme for every Test Series: +1 for a correct answer, -0.25 for a wrong one,
// 0 for unattempted. Max marks = number of questions (100).
export const MARK_CORRECT = 1
export const NEGATIVE_MARK = 0.25

export const PART_NAMES = {
  A: 'Part A — English Subject',
  B: 'Part B — Education',
  C: 'Part C — General Studies',
}

const round2 = (n) => Math.round(n * 100) / 100

function emptyBucket() {
  return { total: 0, correct: 0, wrong: 0, unattempted: 0, marks: 0 }
}

function addTo(bucket, state) {
  bucket.total++
  if (state === 'correct') {
    bucket.correct++
    bucket.marks += MARK_CORRECT
  } else if (state === 'wrong') {
    bucket.wrong++
    bucket.marks -= NEGATIVE_MARK
  } else {
    bucket.unattempted++
  }
}

export function answerState(q) {
  if (q.userAnswer === null || q.userAnswer === undefined) return 'unattempted'
  return q.userAnswer === q.correctIndex ? 'correct' : 'wrong'
}

/**
 * @param {Array<{part, section, sectionName, correctIndex, userAnswer}>} questions
 * @returns overall totals plus per-part and per-section breakdowns
 */
export function computeResult(questions) {
  const overall = emptyBucket()
  const parts = {}
  const sections = {}
  for (const q of questions) {
    const state = answerState(q)
    addTo(overall, state)
    const part = q.part ?? '-'
    parts[part] ??= emptyBucket()
    addTo(parts[part], state)
    const key = q.section ?? '-'
    sections[key] ??= { ...emptyBucket(), part, name: q.sectionName ?? key }
    addTo(sections[key], state)
  }
  const finish = (b) => ({ ...b, marks: round2(b.marks) })
  const result = {
    ...finish(overall),
    maxMarks: questions.length * MARK_CORRECT,
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, finish(v)])),
    sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, finish(v)])),
  }
  result.percent = result.maxMarks ? round2((result.marks / result.maxMarks) * 100) : 0
  return result
}

export function formatMarks(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
}
