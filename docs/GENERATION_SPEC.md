# Test Series Generation Spec (STRICT)

Exam: **Lecturer Recruitment – English (Chhattisgarh, SCERT Raipur)**. Source syllabus: `docs/syllabus.md`.
We build **10 test series**. Each = **100 questions, 100 marks, 2 hours**. Marking: +1 correct, −0.25 wrong, 0 unattempted.
Style: real government/competitive-exam paper (CG Vyapam / CGPSC / TET-lecturer style). Difficulty: **basic–moderate, ~15% hard**. Questions must be self-contained, unambiguous, with exactly ONE defensible answer. No "refer to figure". No duplicate/near-duplicate questions inside a test or across tests.

## Blueprint of ONE test (fixed order, fixed counts)

| Part | Section key | Qs | Syllabus coverage | Language |
|---|---|---|---|---|
| A | `gram` | 15 | Determiners, Modals, Question tag, Finite/Non-finite verbs & Phrasal verbs, Subject-verb agreement, Tenses (kinds & transformation), Identifying clauses (relative defining/non-defining, adverb, noun, non-finite), Transformation of sentences (simple/compound/complex), Direct-Indirect speech, Inversion & cleft sentences, Conditionals, Elliptical patterns. Cover at least 11 of these 12 topics. | English only |
| A | `vocab` | 15 | Word formation (root words, affixes), Polysemy, Homophones, Collocations, Word class conversion, Lexical bundles, Idiomaticity & opacity (idioms/phrases), Figures of speech. Cover all 7. | English only |
| A | `rc` | 15 | **3 unseen passages × 5 questions.** Different genres per test (choose 3 of: prose, poetry extract, drama extract, newspaper article/editorial, scientific passage, literary extract). Questions test comprehension, inference, vocabulary-in-context, tone/attitude, rhetorical devices, logical sequencing. | English only |
| A | `ped` | 15 | Pedagogy of language development: language learning vs acquisition; theories (Behaviourism-Skinner, Chomsky LAD, Vygotsky, Piaget, Krashen's hypotheses, Bruner); linguistic system (phonology, morphology, syntax, semantics, pragmatics); LSRW skills; role of listening & speaking; role of grammar; methods (Grammar-Translation, Direct, Audio-lingual, Structural, CLT, TBLT, Bilingual, Eclectic); diverse classroom, multilingualism, errors vs mistakes, interlanguage, learning difficulties; TLM (textbook, multimedia, multilingual resources); remedial teaching. | Bilingual |
| B | `psych` | 6 | Educational Psychology: development (physical, cognitive, emotional, social, moral), Piaget, Vygotsky, Kohlberg, Erikson, adolescence, guidance & counselling, learning & theories (Pavlov, Skinner, Thorndike, Bandura, Gestalt), factors affecting learning, intelligence (Gardner, Sternberg, Spearman, IQ), creativity, special-needs/inclusive education, individual differences, personality theories, adjustment, motivation (Maslow). | Bilingual |
| B | `assess` | 4 | Assessment & evaluation: meaning, measurement vs assessment vs evaluation vs examination, formative/summative, CCE, assessment tools, assignments, achievement tests (construction, blueprint), rubrics, portfolio, feedback types, norm- vs criterion-referenced, characteristics of a good test (validity, reliability, objectivity, usability), diagnostic testing, standardised tests. | Bilingual |
| B | `pedag` | 3 | Pedagogy: nature & scope of subject, NCF 2005 & NCF-SE 2023 aims, curriculum principles, lesson planning, teaching methods, group learning, classroom dialogue, problem solving, learning resources. | Bilingual |
| B | `attitude` | 2 | Pedagogical attitudes: knowledge & learning, teaching as profession, constructivism, teacher professional development, leadership & group dynamics, gender perspective in education. | Bilingual |
| C | `hindi` | 5 | सामान्य हिंदी: स्वर-व्यंजन, लिंग-वचन-काल, संज्ञा-सर्वनाम-विशेषण-क्रिया-कारक, समास, संधि, अशुद्धि शोधन, उपसर्ग-प्रत्यय, तत्सम-तद्भव-देशज-विदेशी, पर्यायवाची-विलोम-अनेकार्थी-एक शब्द। | **Hindi only** (Devanagari) |
| C | `english` | 5 | General English: number, gender, articles, parts of speech, prepositions & conjunctions, synonyms/antonyms/homonyms, one-word substitution, spelling/prefix/suffix, proverbs & idioms, active-passive, sentence types, punctuation. | English only |
| C | `mental` | 5 | General mental ability (text-only, no figures): analogy, odd-one-out, number/letter series, coding-decoding, blood relations, direction sense, ranking/order, simple arithmetic reasoning, syllogism, calendar/clock basics. | Bilingual |
| C | `computer` | 5 | Computer education: fundamentals, CPU/ALU/CU/memory, input-output devices, printers, OS (MS-DOS, Windows, Linux), MS Word/Excel/PowerPoint, internet & email (CC/BCC), virus/antivirus, storage devices & cloud, search engines, multimedia. | Bilingual |
| C | `gk` | 5 | General knowledge: Indian Constitution (fundamental rights/duties, RTI, elections, Parliament), Indian history (1857–1947 and after), geography (India & world), Indian economy (planning, banking, agriculture), basic science (physics, chemistry, biology), **Chhattisgarh GK** (history, geography, polity, economy, schemes, awards, folk songs/dance/culture, personalities), **NEP 2020 Part-1 (school education)**. In EACH test: exactly 1 Chhattisgarh question, and at most 1 NEP-2020 question; the other questions rotate across the remaining topics. | Bilingual |

Total = 60 (A) + 15 (B) + 25 (C) = 100.

## Accuracy rules (important — this is for a real recruitment exam)
- Use only well-established, stable facts. NEVER include "latest/recent/current year" facts, rankings, or figures likely to change. If unsure of a fact, choose a different question.
- Chhattisgarh GK: only facts you are very sure of (state formed 1 Nov 2000, capital Raipur, High Court at Bilaspur, Mahanadi, Indravati, Bastar, Chitrakoot falls, Kanger Ghati, Panthi/Pandavani/Raut Nacha/Karma/Suva, Pandit Sundarlal Sharma, Ghasidas, etc.). Double-check every one.
- Grammar/vocab questions must have one clearly correct answer per standard Indian-exam conventions (British spelling/usage).
- In `explanation`, explain why the correct option is right and, briefly, why others are wrong.

## Language rules
- **English only** sections: everything in English. No Hindi fields.
- **Hindi only** (`hindi`): `question`, `options`, `explanation` all in Devanagari Hindi.
- **Bilingual** sections: `question` = English, `questionHi` = faithful Hindi translation (Devanagari; technical terms like Piaget, CPU, Fundamental Rights may stay in English); `options` = English, `optionsHi` = Hindi (same order, same 4); `explanation` = English, `explanationHi` = Hindi. Keep Hindi simple (easy exam-level Hindi). Translation must not change meaning.

## Question schema
```json
{
  "id": "t01-gram-01",
  "part": "A",
  "section": "gram",
  "topic": "Conditionals",
  "passageId": "t01-p1",
  "question": "...",
  "questionHi": "...",
  "options": ["...", "...", "...", "..."],
  "optionsHi": ["...", "...", "...", "..."],
  "correctIndex": 2,
  "explanation": "...",
  "explanationHi": "..."
}
```
- `id` = `t<NN>-<section>-<two-digit n>` (n restarts at 01 inside each section).
- `topic`: short syllabus subtopic label (English) — used for analytics.
- `passageId`: ONLY for `rc` questions (3 passages, 5 Qs each, consecutive).
- `questionHi`/`optionsHi`/`explanationHi`: ONLY in bilingual sections.
- Exactly 4 options. Spread `correctIndex` evenly over 0–3 inside every section (don't favour any index; across a whole test each index should be roughly 25%).
- Valid JSON only (double quotes, escaped inner quotes, no comments, no trailing commas).

## Files (per test NN = 01..10)
Agent writes THREE draft files into `data-src/` :
- `data-src/test-NN-A.json` → `{ "passages": [ {"id":"tNN-p1","genre":"...","title":"...","text":"..."} ×3 ], "questions": [60 questions: gram 15, vocab 15, rc 15, ped 15, in that order] }`
- `data-src/test-NN-B.json` → `{ "questions": [15] }` (psych 6, assess 4, pedag 3, attitude 2 in that order)
- `data-src/test-NN-C.json` → `{ "questions": [25] }` (hindi 5, english 5, mental 5, computer 5, gk 5 in that order)

Passages: 120–200 words each, original (do not copy copyrighted text; poetry may be an original short verse). `text` uses `\n` for line breaks (poetry/drama).

`node scripts/build-tests.mjs` validates the drafts and builds `public/tests/test-NN.json` + `public/tests/index.json`.

## Variety across the 10 tests
Each test must feel different: use test number NN to rotate subtopics/themes (e.g. test 1 and test 6 should not ask the same Piaget stage question). Never reuse a question stem used in another test.
