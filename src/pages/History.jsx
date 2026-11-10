import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAttempts } from '../db/historyService'
import { formatMarks } from '../lib/scoring'

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function History() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState(null)

  useEffect(() => {
    getAllAttempts().then(setAttempts)
  }, [])

  function handleRetry(e, attempt) {
    e.stopPropagation()
    navigate('/quiz', { state: attempt.retryConfig })
  }

  if (!attempts) return <p className="text-slate-600">Load ho raha hai…</p>

  if (attempts.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-2">History</h1>
        <p className="text-slate-600">Abhi tak koi attempt nahi hua. Ek test shuru karo!</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">History</h1>
      <div className="space-y-3">
        {attempts.map((a) => {
          const pct = a.result.percent
          const scoreColor = pct >= 60 ? 'text-green-600' : pct >= 35 ? 'text-amber-600' : 'text-red-600'
          return (
            <div
              key={a.id}
              onClick={() => navigate(`/review/${a.id}`)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 sm:p-4 hover:border-indigo-300 active:bg-slate-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 wrap-break-word">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(a.timestamp)} &middot; {a.question_count} questions
                  </div>
                </div>
                <span className={`shrink-0 text-lg font-bold ${scoreColor}`}>
                  {formatMarks(a.marks)}<span className="text-sm text-slate-500"> / {a.max_marks}</span>
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  {a.correct_count} sahi · {a.wrong_count} galat · {a.unattempted_count} chhoote
                  {['A', 'B', 'C'].every((p) => a.result.parts[p]) && (
                    <> &middot; A {formatMarks(a.result.parts.A.marks)} · B {formatMarks(a.result.parts.B.marks)} · C {formatMarks(a.result.parts.C.marks)}</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => handleRetry(e, a)}
                  className="text-xs font-semibold text-indigo-700 hover:underline"
                >
                  🔁 Retry
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
