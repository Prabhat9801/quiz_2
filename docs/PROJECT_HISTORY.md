# Project History

## Origin
Forked from `quiz-ITI` (ITI Electronic Mechanic quiz app: 170 topics, ~5.9k Hindi questions, Topic/Unit/Multi-Unit/Custom/Practice-Set modes, sql.js history, canvas-based Devanagari PDF export). The user then supplied the syllabus PDF "व्याख्याता_इंग्लिश_सिलेबस" (Lecturer Recruitment – English, SCERT Raipur) and asked to convert the system for that exam. Work is in a separate folder/repo (`quiz_2`), the ITI repo is untouched.

## Decisions (all confirmed by the user in chat)
- Scope reduced to **only a Test Series**: 10 tests × 100 questions, 100 marks, 2 hours. All Topic/Unit/Practice-Set modes and the ITI question bank were removed (not archived).
- **Marking:** +1 / −0.25 / 0.
- **Timer:** user-chosen (default 120 min); warning-only at zero, no auto-submit (carried over from ITI).
- **PDF export kept** (question paper, answer key, attempt review).
- **Blueprint** from the syllabus marks: A 60 (Grammar 15, Vocabulary 15, Reading Comprehension 15, Pedagogy of Language Development 15), B 15, C 25 (5 each: Hindi, English, Mental Ability, Computer, GK).
- **Reading comprehension** needs passage support → added `passages` to the test schema, shown above grouped questions (UI, review and PDFs).
- **Mental ability:** text-only (no figures), basic–moderate with a few hard questions.
- **Language:** user chose *bilingual* (English + Hindi per question). Agreed carve-out: grammar/vocabulary/RC and Part C English are English-only (a translation would leak the answer); Part C Hindi is Hindi-only; all other sections bilingual.
- **Question source:** user delegated content creation entirely to Claude ("analyse the whole internet and your smartness… like government exams"); no external review step. 10 parallel agents each wrote one test following `docs/GENERATION_SPEC.md`; a validator (`scripts/build-tests.mjs`) enforces structure; a cleanup pass removed cross-test duplicates.
- App name: "Lecturer English Test Series — CG" (Claude's choice, user said "as you wish"). Repo: fresh start, no ITI git history, push target `https://github.com/Prabhat9801/quiz_2.git`, branch `main`.

## Known limitations
- Facts were generated from model knowledge only; spot-check Chhattisgarh GK, NEP 2020 and NCF items.
- PDF text is raster (not selectable) because of Devanagari shaping.
- Reading-comprehension passages and poetry are original, not from past papers.

## 2026-11-12 — Bug fixes after first deploy (iPhone)
- **Submit looked dead on iPhone / history not saved.** Reproduced with Playwright WebKit (iPhone 13 emulation) against the Render deploy: Submit used `window.confirm`, which iOS in-app browsers (and Safari's "prevent dialogs") block/auto-dismiss, so the handler returned silently and the test was never saved. Fixed with an in-page confirmation modal.
- **History storage rewritten.** Dropped sql.js/WASM (extra failure point, no benefit) for `idb-keyval` + localStorage + in-memory fallbacks; saving never throws or blocks navigation; Review shows a warning banner if nothing could be persisted (private mode). Also asks `navigator.storage.persist()`. Old attempts saved in the previous sql.js DB are not migrated.
- **`/tests` route renamed `/series`.** `public/tests/` (question data) made nginx redirect a direct open/refresh of `/tests` to `http://host:10000/tests/` (Render's internal port) → page never loaded. nginx now has `absolute_redirect off`.
- Fixed bottom bar safe-area padding for iPhone (`viewport-fit=cover`).

## 2026-11-12 — Advanced series (tests 11–20)
User asked for 10 more tests, "moderate to hard, not basics". Same blueprint/marking/PDF/history as tests 1–10; spec extended with an "ADVANCED series" difficulty section; validator now covers tests 01–20 and checks redundancy across all of them; test metadata has `level: standard|advanced` (shown in the picker). History-storage question (server-side vs client-only) is still open — user hasn't chosen yet.
