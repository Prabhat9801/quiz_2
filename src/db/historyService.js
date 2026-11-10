import { runAndPersist, queryAll, queryOne } from './sqlite'
import { computeResult } from '../lib/scoring'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Saves a completed test attempt (full snapshot, so History stays reviewable forever).
 * @param {object} attempt
 * @param {number} attempt.testNumber
 * @param {string} attempt.title
 * @param {number|null} attempt.timerSeconds - null if no timer was chosen
 * @param {number} attempt.timeTakenSeconds
 * @param {Array} attempt.questions - snapshot incl. userAnswer, part, section, passage, bilingual fields
 * @param {object} attempt.retryConfig - enough to restart the same test
 * @returns {Promise<string>} new attempt id
 */
export async function saveAttempt(attempt) {
  const id = newId()
  const result = computeResult(attempt.questions)

  await runAndPersist(
    `INSERT INTO attempts
      (id, timestamp, test_number, title, question_count, timer_seconds, time_taken_seconds,
       marks, max_marks, correct_count, wrong_count, unattempted_count,
       result_json, questions_json, retry_config_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      Date.now(),
      attempt.testNumber,
      attempt.title,
      attempt.questions.length,
      attempt.timerSeconds ?? null,
      attempt.timeTakenSeconds,
      result.marks,
      result.maxMarks,
      result.correct,
      result.wrong,
      result.unattempted,
      JSON.stringify(result),
      JSON.stringify(attempt.questions),
      JSON.stringify(attempt.retryConfig),
    ]
  )
  return id
}

/** Lightweight list for the History screen (excludes the heavy question snapshot). */
export async function getAllAttempts() {
  const rows = await queryAll(
    `SELECT id, timestamp, test_number, title, question_count, timer_seconds, time_taken_seconds,
            marks, max_marks, correct_count, wrong_count, unattempted_count, result_json, retry_config_json
     FROM attempts ORDER BY timestamp DESC`
  )
  return rows.map((r) => ({
    ...r,
    result: JSON.parse(r.result_json),
    retryConfig: JSON.parse(r.retry_config_json),
  }))
}

/** Full row including the question snapshot, for the Review screen. */
export async function getAttemptById(id) {
  const row = await queryOne(`SELECT * FROM attempts WHERE id = ?`, [id])
  if (!row) return null
  return {
    ...row,
    result: JSON.parse(row.result_json),
    questions: JSON.parse(row.questions_json),
    retryConfig: JSON.parse(row.retry_config_json),
  }
}
