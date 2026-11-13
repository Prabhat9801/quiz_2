import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadTest, loadTestsIndex, TOTAL_TESTS, STANDARD_TESTS } from '../data/questionBank'
import { downloadTestWorksheetPdf, downloadTestAnswersPdf } from '../pdf/testPdf'

export default function TestSeries() {
  const navigate = useNavigate()
  const [available, setAvailable] = useState(null)
  const [openTest, setOpenTest] = useState(null)
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [timerMinutes, setTimerMinutes] = useState('120')
  const [pdfBusy, setPdfBusy] = useState(null)

  useEffect(() => {
    loadTestsIndex().then((idx) => setAvailable(new Set(idx.tests.map((t) => t.number))))
  }, [])

  async function handleDownload(number, variant) {
    const key = `${number}-${variant}`
    setPdfBusy(key)
    try {
      const test = await loadTest(number)
      if (variant === 'worksheet') await downloadTestWorksheetPdf(number, test)
      else await downloadTestAnswersPdf(number, test)
    } finally {
      setPdfBusy(null)
    }
  }

  function handleStart(number) {
    const minutes = Math.max(1, Number(timerMinutes) || 1)
    navigate('/quiz', {
      state: {
        testNumber: number,
        title: `Test Series ${number}`,
        timerSeconds: timerEnabled ? minutes * 60 : null,
      },
    })
  }

  if (!available) return <p className="text-slate-600">Load ho raha hai…</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Test Series (1–{TOTAL_TESTS})</h1>
      <p className="text-sm text-slate-600 mb-4">
        Har test: 100 questions · 100 marks · sahi +1, galat −0.25, chhoda 0. Result sirf Submit ke baad dikhega.
        Timer khatam hone par sirf warning aayegi, test apne aap submit nahi hoga.
      </p>

      <p className="text-xs text-slate-500 mb-3">
        Test 1–{STANDARD_TESTS}: standard level · Test {STANDARD_TESTS + 1}–{TOTAL_TESTS}: advanced (moderate se hard, basic nahi).
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: TOTAL_TESTS }, (_, i) => i + 1).map((n) => {
          const ready = available.has(n)
          return (
            <button
              key={n}
              type="button"
              disabled={!ready}
              onClick={() => setOpenTest(openTest === n ? null : n)}
              className={`rounded-lg border p-3 text-center font-semibold transition disabled:opacity-40 ${
                openTest === n
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              }`}
            >
              <div>Test {n}</div>
              <div className="text-xs font-normal text-slate-500">
                {ready ? (n > STANDARD_TESTS ? 'Advanced · 100 Q' : 'Standard · 100 Q') : 'jald aa raha hai'}
              </div>
            </button>
          )
        })}
      </div>

      {openTest && (
        <div className="mt-5 max-w-sm rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <h2 className="font-semibold text-slate-900">Test Series {openTest}</h2>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-slate-700">Timer set karo</span>
            </label>
            {timerEnabled && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(e.target.value)}
                  onBlur={() => setTimerMinutes(String(Math.max(1, Number(timerMinutes) || 1)))}
                  className="w-full sm:w-28 rounded-lg border border-slate-300 p-2.5 text-base"
                />
                <span className="text-sm text-slate-500">minutes (standard: 120)</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleStart(openTest)}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
          >
            Test {openTest} Shuru Karo
          </button>

          <div className="border-t border-slate-200 pt-3 space-y-2">
            <p className="text-xs font-medium text-slate-500">PDF Download</p>
            <button
              type="button"
              onClick={() => handleDownload(openTest, 'worksheet')}
              disabled={pdfBusy === `${openTest}-worksheet`}
              className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 disabled:opacity-50"
            >
              {pdfBusy === `${openTest}-worksheet` ? 'PDF ban raha hai…' : '📄 Question Paper PDF (sirf questions)'}
            </button>
            <button
              type="button"
              onClick={() => handleDownload(openTest, 'answers')}
              disabled={pdfBusy === `${openTest}-answers`}
              className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 disabled:opacity-50"
            >
              {pdfBusy === `${openTest}-answers` ? 'PDF ban raha hai…' : '📄 Answer Key PDF (jawab + explanation)'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
