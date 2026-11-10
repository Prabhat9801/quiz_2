import { jsPDF } from 'jspdf'
import { answerState, formatMarks, PART_NAMES } from '../lib/scoring'

// IMPORTANT: question text mixes English and Devanagari Hindi. jsPDF's own text API does not do
// real Unicode shaping (Devanagari conjuncts/matras come out garbled), so every page is drawn on
// an offscreen <canvas> with the browser's text renderer (which shapes correctly) and embedded
// into the PDF as an image. The self-hosted Noto Sans Devanagari font (public/fonts, @font-face in
// index.css) guarantees identical glyphs on every device. Trade-off: PDF text is not selectable.

const DPI_SCALE = 2
const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297
const MARGIN_MM = 14
const MM_TO_PX = 96 / 25.4

const FONT_STACK = "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', system-ui, sans-serif"
const OPTION_LABELS = ['A', 'B', 'C', 'D']
const SUBTITLE = '100 Questions · 100 Marks · 2 Hours · Negative marking ¼'

async function ensureFontReady(bodyFontPx, titleFontPx) {
  await Promise.all([
    document.fonts.load(`${bodyFontPx}px "Noto Sans Devanagari"`),
    document.fonts.load(`bold ${bodyFontPx}px "Noto Sans Devanagari"`),
    document.fonts.load(`bold ${titleFontPx}px "Noto Sans Devanagari"`),
  ])
  await document.fonts.ready
}

function mmToPx(mm) {
  return Math.round(mm * MM_TO_PX * DPI_SCALE)
}

function wrapText(ctx, text, maxWidthPx) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (ctx.measureText(trial).width > maxWidthPx && current) {
      lines.push(current)
      current = word
    } else {
      current = trial
    }
  }
  if (current) lines.push(current)
  return lines
}

/** blocks = array of blocks; block = array of {text, bold, indent(mm), gapAfter(mm), color}. */
async function renderBlocksToPdf(blocks, { title, subtitle }) {
  const pageWpx = mmToPx(PAGE_WIDTH_MM)
  const pageHpx = mmToPx(PAGE_HEIGHT_MM)
  const marginPx = mmToPx(MARGIN_MM)
  const contentWidthPx = pageWpx - marginPx * 2
  const bodyFontPx = mmToPx(4.0)
  const titleFontPx = mmToPx(6.5)
  const lineHeightPx = Math.round(bodyFontPx * 1.55)

  await ensureFontReady(bodyFontPx, titleFontPx)

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let pageIndex = 0

  function newCanvas() {
    const canvas = document.createElement('canvas')
    canvas.width = pageWpx
    canvas.height = pageHpx
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageWpx, pageHpx)
    ctx.fillStyle = '#111111'
    ctx.textBaseline = 'top'
    return { canvas, ctx }
  }

  function flushPage(canvas) {
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    if (pageIndex > 0) doc.addPage()
    doc.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM)
    pageIndex++
  }

  let { canvas, ctx } = newCanvas()
  let y = marginPx

  function ensureSpace(neededPx) {
    if (y + neededPx > pageHpx - marginPx) {
      flushPage(canvas)
      ;({ canvas, ctx } = newCanvas())
      y = marginPx
    }
  }

  ctx.font = `bold ${titleFontPx}px ${FONT_STACK}`
  ctx.fillText(title, marginPx, y)
  y += titleFontPx * 1.4
  if (subtitle) {
    ctx.font = `${bodyFontPx}px ${FONT_STACK}`
    ctx.fillStyle = '#555555'
    ctx.fillText(subtitle, marginPx, y)
    ctx.fillStyle = '#111111'
    y += bodyFontPx * 1.8
  }

  for (const block of blocks) {
    const measured = []
    let blockHeight = 0
    for (const line of block) {
      ctx.font = `${line.bold ? 'bold ' : ''}${bodyFontPx}px ${FONT_STACK}`
      const indentPx = mmToPx(line.indent ?? 0)
      const wrapped = wrapText(ctx, line.text, contentWidthPx - indentPx)
      measured.push({ ...line, wrapped, indentPx })
      blockHeight += wrapped.length * lineHeightPx
      blockHeight += mmToPx(line.gapAfter ?? 0)
    }
    ensureSpace(blockHeight)
    for (const line of measured) {
      ctx.font = `${line.bold ? 'bold ' : ''}${bodyFontPx}px ${FONT_STACK}`
      ctx.fillStyle = line.color ?? '#111111'
      for (const wline of line.wrapped) {
        ctx.fillText(wline, marginPx + line.indentPx, y)
        y += lineHeightPx
      }
      y += mmToPx(line.gapAfter ?? 0)
    }
    ctx.fillStyle = '#111111'
  }

  flushPage(canvas)
  return doc
}

function sectionCounts(questions) {
  const counts = {}
  for (const q of questions) counts[q.section] = (counts[q.section] ?? 0) + 1
  return counts
}

/**
 * mode: 'paper' (no answers) | 'key' (correct answer + explanation) | 'review' (user's answer too).
 * Section headings and reading-comprehension passages are printed once, before the first question
 * they apply to, and kept in the same block so they never orphan at the bottom of a page.
 */
function paperBlocks(questions, mode) {
  const blocks = []
  const counts = sectionCounts(questions)
  let lastSection = null
  let lastPassage = null

  questions.forEach((q, idx) => {
    const lines = []
    if (q.section !== lastSection) {
      lines.push({
        text: `${PART_NAMES[q.part] ?? `Part ${q.part}`} — ${q.sectionName} (${counts[q.section]} questions)`,
        bold: true,
        gapAfter: 2,
        color: '#3730a3',
      })
      lastSection = q.section
    }
    const passage = q.passage
    if (passage && passage.id !== lastPassage) {
      lines.push({ text: `Passage${passage.title ? ` — ${passage.title}` : ''}`, bold: true, gapAfter: 0.5 })
      const paras = String(passage.text).split('\n')
      paras.forEach((p, pi) => {
        lines.push({ text: p || ' ', indent: 3, gapAfter: pi === paras.length - 1 ? 3 : 0, color: '#333333' })
      })
      lastPassage = passage.id
    }
    if (!passage) lastPassage = null

    lines.push({ text: `${idx + 1}. ${q.question}`, bold: true, gapAfter: q.questionHi ? 0 : 1 })
    if (q.questionHi) lines.push({ text: q.questionHi, indent: 5, gapAfter: 1, color: '#333333' })

    q.options.forEach((opt, oi) => {
      let marker = ''
      if (mode === 'key' && oi === q.correctIndex) marker = ' ✓'
      if (mode === 'review') {
        if (oi === q.correctIndex) marker = ' ✓ (correct)'
        else if (oi === q.userAnswer) marker = ' ✗ (your answer)'
      }
      lines.push({ text: `${OPTION_LABELS[oi]}. ${opt}${marker}`, indent: 6 })
      if (q.optionsHi?.[oi]) lines.push({ text: q.optionsHi[oi], indent: 11, color: '#444444' })
    })

    if (mode === 'review') {
      const st = answerState(q)
      lines.push({
        text: `Result: ${st === 'correct' ? 'Correct (+1)' : st === 'wrong' ? 'Wrong (−0.25)' : 'Not attempted (0)'}`,
        indent: 3,
        bold: true,
      })
    }
    if (mode !== 'paper') {
      lines.push({ text: `Explanation: ${q.explanation}`, indent: 3, gapAfter: q.explanationHi ? 0 : 4 })
      if (q.explanationHi) lines.push({ text: `व्याख्या: ${q.explanationHi}`, indent: 3, gapAfter: 4, color: '#333333' })
    } else {
      lines[lines.length - 1].gapAfter = 4
    }
    blocks.push(lines)
  })
  return blocks
}

function answerGridBlock(questions) {
  const lines = [{ text: 'Answer Key (quick view)', bold: true, gapAfter: 1 }]
  for (let i = 0; i < questions.length; i += 10) {
    const row = questions
      .slice(i, i + 10)
      .map((q, k) => `${i + k + 1}-${OPTION_LABELS[q.correctIndex]}`)
      .join('   ')
    lines.push({ text: row, indent: 3 })
  }
  lines[lines.length - 1].gapAfter = 5
  return lines
}

const pad2 = (n) => String(n).padStart(2, '0')

/** Attach passage objects to raw test questions (the stored test keeps passages separately). */
function withPassages(test) {
  const byId = new Map((test.passages ?? []).map((p) => [p.id, p]))
  return test.questions.map((q) => (q.passageId && byId.has(q.passageId) ? { ...q, passage: byId.get(q.passageId) } : q))
}

/** Blank question paper (no answers). */
export async function downloadTestWorksheetPdf(number, test) {
  const doc = await renderBlocksToPdf(paperBlocks(withPassages(test), 'paper'), {
    title: `Test Series ${number} — Question Paper`,
    subtitle: SUBTITLE,
  })
  doc.save(`test-series-${pad2(number)}-question-paper.pdf`)
}

/** Answer key: quick grid + every question with the correct option marked and explanation. */
export async function downloadTestAnswersPdf(number, test) {
  const questions = withPassages(test)
  const doc = await renderBlocksToPdf([answerGridBlock(questions), ...paperBlocks(questions, 'key')], {
    title: `Test Series ${number} — Answer Key`,
    subtitle: `${SUBTITLE} · with explanations`,
  })
  doc.save(`test-series-${pad2(number)}-answer-key.pdf`)
}

/** PDF of one completed attempt: score summary + every question with user's answer and explanation. */
export async function downloadAttemptReviewPdf(title, questions, result) {
  const summary = [
    {
      text: `Score: ${formatMarks(result.marks)} / ${result.maxMarks}   (${result.correct} correct · ${result.wrong} wrong · ${result.unattempted} unattempted)`,
      bold: true,
      gapAfter: 1,
    },
    ...['A', 'B', 'C']
      .filter((p) => result.parts[p])
      .map((p) => ({
        text: `${PART_NAMES[p]}: ${formatMarks(result.parts[p].marks)} / ${result.parts[p].total}`,
        indent: 3,
      })),
  ]
  summary[summary.length - 1].gapAfter = 5
  const doc = await renderBlocksToPdf([summary, ...paperBlocks(questions, 'review')], {
    title: `${title} — Attempt Review`,
    subtitle: 'Marking: +1 correct, −0.25 wrong, 0 unattempted',
  })
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  doc.save(`${safeName || 'attempt'}-review.pdf`)
}
