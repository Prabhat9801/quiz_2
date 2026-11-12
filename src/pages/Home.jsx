import { Link } from 'react-router-dom'

const BLUEPRINT = [
  { part: 'A', label: 'English Subject', marks: 60, detail: 'Grammar 15 · Vocabulary 15 · Reading Comprehension 15 · Pedagogy of Language Development 15' },
  { part: 'B', label: 'Education', marks: 15, detail: 'Educational Psychology · Assessment & Evaluation · Pedagogy · Pedagogical Attitudes' },
  { part: 'C', label: 'General Studies', marks: 25, detail: 'Hindi 5 · English 5 · Mental Ability 5 · Computer 5 · General Knowledge 5' },
]

export default function Home() {
  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        Lecturer Recruitment (English) — Test Series
      </h1>
      <p className="text-sm sm:text-base text-slate-600 mb-5">
        10 full-length mock tests · har test 100 questions · 100 marks · 2 ghante · negative marking ¼.
      </p>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
        <Link
          to="/series"
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
        >
          <div className="text-2xl sm:text-3xl mb-2">📝</div>
          <div className="text-base sm:text-lg font-semibold text-slate-900">Test Series 1–10</div>
          <div className="text-sm text-slate-600 mt-1">Test shuru karo ya PDF download karo</div>
        </Link>
        <Link
          to="/history"
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <div className="text-2xl sm:text-3xl mb-2">📊</div>
          <div className="text-base sm:text-lg font-semibold text-slate-900">History</div>
          <div className="text-sm text-slate-600 mt-1">Pichhle attempts, marks aur review</div>
        </Link>
      </div>

      <h2 className="text-base sm:text-lg font-semibold mb-2">Har test ka pattern</h2>
      <div className="space-y-2">
        {BLUEPRINT.map((b) => (
          <div key={b.part} className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-slate-900">Part {b.part} — {b.label}</span>
              <span className="text-sm font-semibold text-indigo-700">{b.marks} marks</span>
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{b.detail}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Part A grammar/vocabulary/comprehension English me hain; baaki sawal English + Hindi dono me.
      </p>
    </div>
  )
}
