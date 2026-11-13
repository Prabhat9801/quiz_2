# Lecturer English Test Series (CG) — Project Guide for Claude Code

Auto-loaded by Claude Code. Read `docs/PROJECT_HISTORY.md` too for the decision log.

## What this is
A fully client-side mock-test app (no backend, no login) for the **Chhattisgarh Lecturer Recruitment – English** exam (SCERT Raipur syllabus, see `docs/syllabus.md`). It was forked from the ITI "quiz-ITI" app (same architecture) and converted into a **Test Series** product. Deploys as a Docker (nginx) static site on Render.

## Product spec (finalized with the user)
- **20 Test Series** (1–10 standard level, 11–20 **advanced**: moderate-to-hard, no basics — see the last section of `docs/GENERATION_SPEC.md`). Each = **100 questions, 100 marks, 2 hours**.
- **Marking:** +1 correct, −0.25 wrong, 0 unattempted (`src/lib/scoring.js`).
- **Timer:** user chooses minutes (default 120) or no timer. At zero → **warning only, never auto-submit**.
- **Exam mode only:** no feedback until Submit; Previous/Next/jump freely; tapping a chosen option again clears it. Submit asks for confirmation via an in-page modal (never window.confirm — blocked in iPhone in-app browsers).
- **Fixed content:** each test is a permanent list (public/tests/test-NN.json). Question *order* is kept (sections + reading-comprehension passages stay grouped); only each question's **option order** is shuffled per play. Retry replays the same test.
- **Blueprint (per test):** Part A (60): Grammar 15, Vocabulary 15, Reading Comprehension 15 (3 passages × 5), Pedagogy of Language Development 15. Part B (15): Educational Psychology 6, Assessment & Evaluation 4, Pedagogy 3, Pedagogical Attitudes 2. Part C (25): General Hindi 5, General English 5, Mental Ability 5, Computer 5, General Knowledge 5 (1 Chhattisgarh GK per test, ≤1 NEP 2020).
- **Language:** Part A grammar/vocab/RC and Part C English → English only. Part C Hindi → Hindi only. Everything else (Pedagogy of Language Dev, all of Part B, Mental Ability, Computer, GK) → **bilingual**: English + Hindi (`questionHi`, `optionsHi`, `explanationHi`).
- **History:** every attempt saved with full snapshot (IndexedDB via idb-keyval → localStorage → in-memory fallback; saving never blocks Submit) + per-part/section marks; read-only review; Retry creates a new entry.
- **PDF (must keep):** per test → Question Paper PDF and Answer Key PDF (quick grid + explanations); per attempt → Review PDF. Generated client-side in `src/pdf/testPdf.js` by drawing pages on a canvas (needed for correct Devanagari shaping) then embedding as images — text isn't selectable (known trade-off). Passages and section headings are included.

## Tech stack
React 19 + Vite, react-router-dom, idb-keyval, Tailwind v4, jspdf.

## Data pipeline
- Specs: `docs/GENERATION_SPEC.md` (schema/rules), `docs/syllabus.md`.
- Drafts: `data-src/test-NN-{A,B,C}.json` (A = 60 Qs + 3 passages, B = 15, C = 25).
- Build/validate: `node scripts/build-tests.mjs [NN]` → writes `public/tests/test-NN.json` + `public/tests/index.json`; validates counts, ids, language fields, answer-position spread, and cross-test duplicate questions (must print 0).
- After editing any draft, re-run the build script and commit both `data-src/` and `public/tests/`.

## Code map
```
src/App.jsx              routes: / , /series , /quiz , /review/:id , /history
src/pages/Home.jsx       landing + blueprint
src/pages/TestSeries.jsx pick test 1–10, timer, start, PDFs
src/pages/Quiz.jsx       exam screen (passage, bilingual Q/options, part tabs, navigator)
src/pages/Review.jsx     marks, part/section table, filterable review, retry, PDF
src/pages/History.jsx    attempts list
src/lib/scoring.js       marking + per-part/section results
src/data/questionBank.js loadTest, option shuffling
src/db/historyService.js history store (IDB `attempt-index` + `attempt:<id>`, localStorage + memory fallbacks)
src/pdf/testPdf.js       PDF export
```

## Commands
```
npm run dev | build | preview
node scripts/build-tests.mjs
```
Docker/Render: see `Dockerfile`, `nginx.conf.template` (SPA fallback, `absolute_redirect off` so Render's PORT never leaks into redirects, `${PORT}`). Don't name a client route like a folder in `public/` (e.g. `/tests`): nginx redirects it to `/tests/` and breaks direct opens; free-tier web service set up manually.

## Accuracy note
Questions were AI-generated from the syllabus without an external source. Part B/C facts (Chhattisgarh GK, NEP 2020, NCF) deserve a human spot-check before relying on them for real exam prep.

## Maintenance
Update `docs/PROJECT_HISTORY.md` whenever a meaningful decision changes.
