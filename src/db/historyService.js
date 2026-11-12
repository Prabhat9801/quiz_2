import { get, set } from 'idb-keyval'
import { computeResult } from '../lib/scoring'

// History storage. Saving must NEVER block or break "Submit" (it did before, with sql.js/WASM,
// on some iPhones/in-app browsers). So storage is layered, best-effort:
//   1. IndexedDB (idb-keyval)   2. localStorage   3. in-memory (this tab only)
// Layout (same in IDB and localStorage):  "attempt-index" -> [summary...] (newest first)
//                                         "attempt:<id>"  -> full record (summary + questions)
// A summary keeps the same field names the History/Review pages use.

const INDEX_KEY = 'attempt-index'
const memory = new Map() // id -> full record (always filled, so Review works right after submit)

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])
}

async function idbGet(key) {
  try {
    return await withTimeout(get(key), 4000)
  } catch {
    return undefined
  }
}

async function idbSet(key, value) {
  try {
    await withTimeout(set(key, value), 4000)
    return true
  } catch {
    return false
  }
}

function lsGet(key) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function lsSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function summaryOf(record) {
  const { questions: _questions, persisted: _persisted, ...summary } = record
  return summary
}

/** Asks the browser not to evict our data (iOS/Safari may otherwise clear it after inactivity). */
function requestPersistence() {
  try {
    navigator.storage?.persist?.()
  } catch {
    /* ignore */
  }
}

/**
 * Saves a completed test attempt (full snapshot, so History stays reviewable).
 * Never throws. Returns the new attempt id; the attempt's `persisted` flag (see getAttemptById)
 * tells Review whether it reached durable storage.
 */
export async function saveAttempt(attempt) {
  const id = newId()
  const result = computeResult(attempt.questions)
  const record = {
    id,
    timestamp: Date.now(),
    test_number: attempt.testNumber,
    title: attempt.title,
    question_count: attempt.questions.length,
    timer_seconds: attempt.timerSeconds ?? null,
    time_taken_seconds: attempt.timeTakenSeconds,
    marks: result.marks,
    max_marks: result.maxMarks,
    correct_count: result.correct,
    wrong_count: result.wrong,
    unattempted_count: result.unattempted,
    result,
    retryConfig: attempt.retryConfig,
    questions: attempt.questions,
  }

  memory.set(id, { ...record, persisted: false })
  requestPersistence()

  let persisted = false
  try {
    const summary = summaryOf(record)
    if (await idbSet(`attempt:${id}`, record)) {
      const index = (await idbGet(INDEX_KEY)) ?? []
      persisted = await idbSet(INDEX_KEY, [summary, ...index.filter((s) => s.id !== id)])
    }
    if (!persisted) {
      // fallback: localStorage (smaller quota, but works where IndexedDB is blocked)
      const index = lsGet(INDEX_KEY) ?? []
      persisted = lsSet(`attempt:${id}`, record) && lsSet(INDEX_KEY, [summary, ...index.filter((s) => s.id !== id)])
    }
  } catch {
    persisted = false
  }
  memory.set(id, { ...record, persisted })
  return id
}

/** Lightweight list for the History screen (no question snapshots). Newest first. */
export async function getAllAttempts() {
  const byId = new Map()
  const fromIdb = (await idbGet(INDEX_KEY)) ?? []
  const fromLs = lsGet(INDEX_KEY) ?? []
  for (const s of [...fromIdb, ...fromLs]) byId.set(s.id, s)
  for (const rec of memory.values()) if (!byId.has(rec.id)) byId.set(rec.id, summaryOf(rec))
  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp)
}

/** Full attempt including the question snapshot, for the Review screen. */
export async function getAttemptById(id) {
  const fromMemory = memory.get(id)
  if (fromMemory) return fromMemory
  const record = (await idbGet(`attempt:${id}`)) ?? lsGet(`attempt:${id}`)
  return record ? { ...record, persisted: true } : null
}
