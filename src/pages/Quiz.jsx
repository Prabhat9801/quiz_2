import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { loadTest, prepareTestQuestions } from '../data/questionBank'
import { saveAttempt } from '../db/historyService'
import { PART_NAMES } from '../lib/scoring'
import Timer from '../components/Timer.jsx'
import Bi from '../components/Bi.jsx'

export default function Quiz() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [answers, setAnswers] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(state?.timerSeconds ?? null)
  const [timeUp, setTimeUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    if (!state) return
    let cancelled = false
    loadTest(state.testNumber)
      .then((test) => {
        if (cancelled) return
        const prepared = prepareTestQuestions(test)
        setQuestions(prepared)
        setAnswers(new Array(prepared.length).fill(null))
        startTimeRef.current = Date.now()
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => { cancelled = true }
  }, [state])

  // Timer: warning only when it hits zero — never auto-submit.
  useEffect(() => {
    if (timeRemaining === null) return
    if (timeRemaining <= 0) {
      setTimeUp(true)
      return
    }
    const t = setTimeout(() => setTimeRemaining((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeRemaining])

  if (!state) {
    return (
      <div>
        <p className="text-slate-600 mb-3">Test config nahi mila.</p>
        <button onClick={() => navigate('/')} className="text-indigo-700 font-medium">Home par jao</button>
      </div>
    )
  }
  if (loadError) {
    return (
      <div>
        <p className="text-slate-600 mb-3">Ye test load nahi ho paya.</p>
        <button onClick={() => navigate('/tests')} className="text-indigo-700 font-medium">Tests par jao</button>
      </div>
    )
  }
  if (!questions) return <p className="text-slate-600">Test load ho raha hai…</p>

  const current = questions[currentIndex]
  const currentAnswer = answers[currentIndex]
  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length
  const showSectionHeader = currentIndex === 0 || questions[currentIndex - 1].section !== current.section

  function selectOption(optionIndex) {
    setAnswers((prev) => {
      const next = [...prev]
      // tapping the selected option again clears it (so a guess can be withdrawn — avoids −0.25)
      next[currentIndex] = next[currentIndex] === optionIndex ? null : optionIndex
      return next
    })
  }

  function jumpToPart(part) {
    const i = questions.findIndex((q) => q.part === part)
    if (i >= 0) setCurrentIndex(i)
  }

  async function handleSubmit() {
    const left = questions.length - answeredCount
    const ok = window.confirm(
      left > 0
        ? `${left} question abhi unattempted hain. Phir bhi test submit karna hai?`
        : 'Test submit kar dein?'
    )
    if (!ok) return
    setSubmitting(true)
    const timeTakenSeconds = state.timerSeconds
      ? state.timerSeconds - (timeRemaining ?? 0)
      : Math.round((Date.now() - startTimeRef.current) / 1000)

    const snapshot = questions.map((q, i) => ({ ...q, userAnswer: answers[i] ?? null }))
    const id = await saveAttempt({
      testNumber: state.testNumber,
      title: state.title,
      timerSeconds: state.timerSeconds,
      timeTakenSeconds: Math.max(0, timeTakenSeconds),
      questions: snapshot,
      retryConfig: { testNumber: state.testNumber, title: state.title, timerSeconds: state.timerSeconds },
    })
    navigate(`/review/${id}`, { replace: true })
  }

  return (
    <div className="max-w-2xl pb-28 sm:pb-24">
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-slate-500 truncate">{state.title}</div>
          <div className="text-sm font-medium text-slate-700">
            Q {currentIndex + 1} / {questions.length} &middot; {answeredCount} answered
          </div>
        </div>
        <Timer secondsLeft={timeRemaining} expired={timeUp} />
      </div>

      {timeUp && (
        <div className="mb-3 rounded-lg bg-red-100 px-3 sm:px-4 py-2 text-sm font-semibold text-red-700">
          ⏰ Time khatam ho gaya hai! Ab Submit kar do.
        </div>
      )}

      <div className="mb-3 flex gap-2">
        {['A', 'B', 'C'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => jumpToPart(p)}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs sm:text-sm font-semibold ${
              current.part === p
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Part {p}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = answers[i] !== null && answers[i] !== undefined
          const isCurrent = i === currentIndex
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded text-xs font-semibold shrink-0 ${
                isCurrent
                  ? 'bg-indigo-600 text-white'
                  : answered
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-100 text-slate-500'
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {showSectionHeader && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          {PART_NAMES[current.part]} · {current.sectionName}
        </div>
      )}

      {current.passage && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <div className="mb-1 text-xs font-semibold text-amber-800">
            Passage{current.passage.title ? ` — ${current.passage.title}` : ''}
          </div>
          <p className="quiz-text whitespace-pre-line text-sm text-slate-800">{current.passage.text}</p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <Bi
          en={`${currentIndex + 1}. ${current.question}`}
          hi={current.questionHi}
          className="quiz-text font-medium text-slate-900 mb-4 block"
        />

        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectOption(i)}
              className={`w-full text-left rounded-lg border p-3 quiz-text transition ${
                currentAnswer === i
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              <Bi en={opt} hi={current.optionsHi?.[i]} />
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Option dobara dabane se answer hat jayega.</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-2 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border border-slate-300 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium disabled:opacity-40 shrink-0"
          >
            <span className="sm:hidden">← Prev</span>
            <span className="hidden sm:inline">← Previous</span>
          </button>

          {currentIndex < questions.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-lg bg-slate-800 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white shrink-0"
            >
              Next →
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="ml-auto rounded-lg bg-indigo-600 px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit Test</span>
          </button>
        </div>
      </div>
    </div>
  )
}
