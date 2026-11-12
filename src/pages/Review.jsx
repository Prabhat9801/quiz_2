import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttemptById } from '../db/historyService'
import { downloadAttemptReviewPdf } from '../pdf/testPdf'
import { answerState, formatMarks, PART_NAMES } from '../lib/scoring'
import Bi from '../components/Bi.jsx'

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s}s`
}

export default function Review() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    getAttemptById(id).then((row) => {
      if (cancelled) return
      if (!row) setNotFound(true)
      else setAttempt(row)
    })
    return () => { cancelled = true }
  }, [id])

  async function handleDownloadPdf() {
    setPdfBusy(true)
    try {
      await downloadAttemptReviewPdf(attempt.title, attempt.questions, attempt.result)
    } finally {
      setPdfBusy(false)
    }
  }

  if (notFound) {
    return (
      <div>
        <p className="text-slate-600 mb-3">Ye attempt nahi mila.</p>
        <button onClick={() => navigate('/history')} className="text-indigo-700 font-medium">History par jao</button>
      </div>
    )
  }
  if (!attempt) return <p className="text-slate-600">Load ho raha hai…</p>

  const r = attempt.result
  const pct = r.percent
  const scoreColor = pct >= 60 ? 'text-green-600' : pct >= 35 ? 'text-amber-600' : 'text-red-600'
  const visible = attempt.questions
    .map((q, i) => ({ q, i, state: answerState(q) }))
    .filter((x) => filter === 'all' || x.state === filter)

  return (
    <div className="max-w-2xl">
      {attempt.persisted === false && (
        <div className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
          ⚠️ Is browser me history save nahi ho paayi (private mode ya storage blocked). Ye result sirf
          abhi dikh raha hai — PDF download kar lo. History ke liye normal (non-private) browser use karo.
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 mb-6">
        <div className="text-sm text-slate-500 mb-1">{attempt.title}</div>
        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-1">
          <span className={`text-3xl font-bold ${scoreColor}`}>
            {formatMarks(r.marks)} <span className="text-lg text-slate-500">/ {r.maxMarks}</span>
          </span>
          <span className="text-sm sm:text-base text-slate-600">
            {r.correct} sahi · {r.wrong} galat · {r.unattempted} chhoote
          </span>
        </div>
        <div className="text-xs text-slate-500 mb-3">
          Marks = {r.correct} × 1 − {r.wrong} × 0.25 &middot; {formatDuration(attempt.time_taken_seconds)} me complete
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-1 pr-2 font-medium">Section</th>
                <th className="py-1 px-1 font-medium text-right">Sahi</th>
                <th className="py-1 px-1 font-medium text-right">Galat</th>
                <th className="py-1 px-1 font-medium text-right">Chhoota</th>
                <th className="py-1 pl-1 font-medium text-right">Marks</th>
              </tr>
            </thead>
            <tbody>
              {['A', 'B', 'C'].map((p) => {
                const part = r.parts[p]
                if (!part) return null
                return [
                  <tr key={p} className="bg-slate-50 font-semibold">
                    <td className="py-1 pr-2">{PART_NAMES[p]}</td>
                    <td className="py-1 px-1 text-right">{part.correct}</td>
                    <td className="py-1 px-1 text-right">{part.wrong}</td>
                    <td className="py-1 px-1 text-right">{part.unattempted}</td>
                    <td className="py-1 pl-1 text-right">{formatMarks(part.marks)} / {part.total}</td>
                  </tr>,
                  ...Object.entries(r.sections)
                    .filter(([, s]) => s.part === p)
                    .map(([key, s]) => (
                      <tr key={key} className="text-slate-600">
                        <td className="py-0.5 pr-2 pl-3">{s.name}</td>
                        <td className="py-0.5 px-1 text-right">{s.correct}</td>
                        <td className="py-0.5 px-1 text-right">{s.wrong}</td>
                        <td className="py-0.5 px-1 text-right">{s.unattempted}</td>
                        <td className="py-0.5 pl-1 text-right">{formatMarks(s.marks)} / {s.total}</td>
                      </tr>
                    )),
                ]
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => navigate('/quiz', { state: attempt.retryConfig })}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            🔁 Retry (wahi test, options reshuffle)
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            className="rounded-lg border border-slate-300 px-4 py-2.5 sm:py-2 text-sm font-medium disabled:opacity-50"
          >
            {pdfBusy ? 'PDF ban raha hai…' : '📄 Download PDF'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-slate-300 px-4 py-2.5 sm:py-2 text-sm font-medium"
          >
            Home
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-semibold">Question-by-question review</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="all">Sab</option>
          <option value="correct">Sahi</option>
          <option value="wrong">Galat</option>
          <option value="unattempted">Chhoote</option>
        </select>
      </div>

      <div className="space-y-4">
        {visible.map(({ q, i, state }) => {
          const showPassage = q.passage && (i === 0 || attempt.questions[i - 1].passage?.id !== q.passage.id)
          return (
            <div key={q.id ?? i}>
              {showPassage && (
                <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="mb-1 text-xs font-semibold text-amber-800">Passage{q.passage.title ? ` — ${q.passage.title}` : ''}</div>
                  <p className="quiz-text whitespace-pre-line text-sm text-slate-800">{q.passage.text}</p>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Bi
                    en={`${i + 1}. ${q.question}`}
                    hi={q.questionHi}
                    className="quiz-text font-medium text-slate-900"
                  />
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      state === 'unattempted'
                        ? 'bg-slate-100 text-slate-500'
                        : state === 'correct'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {state === 'unattempted' ? 'Chhoota' : state === 'correct' ? 'Sahi +1' : 'Galat −0.25'}
                  </span>
                </div>

                <div className="mb-2 text-xs text-slate-400">
                  {PART_NAMES[q.part]} · {q.sectionName}{q.topic ? ` · ${q.topic}` : ''}
                </div>

                <div className="space-y-1.5 mb-3">
                  {q.options.map((opt, oi) => {
                    let cls = 'rounded-lg border p-2 text-sm quiz-text '
                    if (oi === q.correctIndex) cls += 'border-green-500 bg-green-50 text-green-900'
                    else if (oi === q.userAnswer) cls += 'border-red-500 bg-red-50 text-red-900'
                    else cls += 'border-slate-200 bg-slate-50 text-slate-500'
                    return (
                      <div key={oi} className={cls}>
                        <Bi en={opt} hi={q.optionsHi?.[oi]} />
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-lg bg-indigo-50 p-3">
                  <Bi en={q.explanation} hi={q.explanationHi} className="quiz-text text-sm text-indigo-900" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
