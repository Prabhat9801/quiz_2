export const TOTAL_TESTS = 10

let indexPromise = null
const testCache = new Map()

/** List of available test series (public/tests/index.json). */
export function loadTestsIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/tests/index.json').then((r) => (r.ok ? r.json() : { tests: [] }))
  }
  return indexPromise
}

/**
 * Loads one FIXED test series: { id, number, title, durationMinutes, passages, questions }.
 * Every test is permanent content (same 100 questions every time) so it can be exported as a
 * stable PDF. Questions are already in exam order: Part A -> B -> C.
 */
export async function loadTest(number) {
  if (testCache.has(number)) return testCache.get(number)
  const file = `test-${String(number).padStart(2, '0')}.json`
  const res = await fetch(`/tests/${file}`)
  if (!res.ok) throw new Error(`Test ${number} not found`)
  const data = await res.json()
  testCache.set(number, data)
  return data
}

function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Shuffles a question's options (and the Hindi options in the same order); remaps correctIndex. */
export function shuffleQuestionOptions(question) {
  const order = shuffle([0, 1, 2, 3])
  const next = {
    ...question,
    options: order.map((i) => question.options[i]),
    correctIndex: order.indexOf(question.correctIndex),
  }
  if (question.optionsHi) next.optionsHi = order.map((i) => question.optionsHi[i])
  return next
}

/**
 * Prepares a test for play: question ORDER is kept (sections and reading-comprehension passages
 * must stay grouped, like a real paper); only each question's option order is reshuffled per play.
 * Each question gets its passage text attached so the Review/PDF snapshots are self-contained.
 */
export function prepareTestQuestions(test) {
  const passageById = new Map((test.passages ?? []).map((p) => [p.id, p]))
  return test.questions.map((q) => {
    const shuffled = shuffleQuestionOptions(q)
    if (q.passageId && passageById.has(q.passageId)) {
      const p = passageById.get(q.passageId)
      shuffled.passage = { id: p.id, title: p.title, genre: p.genre, text: p.text }
    }
    return shuffled
  })
}
