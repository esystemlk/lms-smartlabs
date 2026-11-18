# PTE Academic Training — research & build plan

## Status (built)
- **Content:** 360 original items, 30 per task type, in `src/data/pte/<type>.json` (server-only).
  Check them with `node scripts/pte-check.mjs` (format limits, answer keys, marking rules,
  no key leaks). After editing Highlight-incorrect-words items run it with `--fix`.
- **Marking:** `src/lib/pte/scoring.ts`; done on the server by `POST /api/pte/score`, attempts
  saved in Firestore `pteAttempts`.
- **Access:** course editor switch "Attach PTE Academic training" (`courses.pteTraining`);
  checked server-side in `src/lib/pte/access.server.ts`.
- **Student pages:** Exams → PTE Academic Training card → `/lms/pte` → `/lms/pte/[id]`.
- **Audio:** put an MP3 URL in an item's `audioUrl`. Until then the browser reads the text aloud.
- **Local testing** of the PTE pages needs `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env.local`
  (it's production-only on Vercel).
- **Not built yet:** admin editor/importer, admin results table, full timed mock test.
- **Differs from §3/§4 below:** items and answer keys live in server-only files instead of
  Firestore `pteItems`/`pteAnswerKeys`, so no Firestore rule changes or seed script are needed.

## 1. Which PTE parts are "non-AI"

PTE Academic has 22 task types (two speaking types were added on 7 Aug 2025). Every
speaking task and the long writing tasks (Write Essay, Summarize Written Text,
Summarize Spoken Text, Respond to a Situation, Summarize Group Discussion, Answer Short
Question, etc.) are scored by AI. **12 task types are marked objectively against an
answer key**, so the LMS can mark them exactly the way Pearson describes:

| # | Task (code) | Part | What the student sees | Official limits | Marking |
|---|---|---|---|---|---|
| 1 | Reading & Writing: Fill in the blanks (`rw_fib`) | Reading | Passage, drop-down per gap | ≤ 200 words | 1 per correct blank |
| 2 | Multiple choice, multiple answers (`r_mcma`) | Reading | Passage + question, several correct | ≤ 350 words | +1 correct, −1 wrong, min 0 |
| 3 | Re-order paragraphs (`r_reorder`) | Reading | Shuffled text boxes to drag | ≤ ~110–150 words | 1 per correct adjacent pair |
| 4 | Reading: Fill in the blanks (`r_fib`) | Reading | Passage + word bank (drag & drop) | ≤ 80 words | 1 per correct blank |
| 5 | Multiple choice, single answer (`r_mcsa`) | Reading | Short passage + question | ≤ 110 words | 1 or 0 |
| 6 | Multiple choice, multiple answers (`l_mcma`) | Listening | Audio 80–120 s, ~7 s preview | — | +1 correct, −1 wrong, min 0 |
| 7 | Fill in the blanks — type in (`l_fib`) | Listening | Audio 30–60 s + transcript with gaps | — | 1 per correct, correctly spelled word |
| 8 | Highlight correct summary (`l_hcs`) | Listening | Audio 30–90 s, choose 1 paragraph | — | 1 or 0 |
| 9 | Multiple choice, single answer (`l_mcsa`) | Listening | Audio 30–60 s, ~5 s preview | — | 1 or 0 |
| 10 | Select missing word (`l_smw`) | Listening | Audio 20–70 s ending in a beep, 3–5 options | — | 1 or 0 |
| 11 | Highlight incorrect words (`l_hiw`) | Listening | Audio 15–50 s + transcript with changed words, ~10 s preview | — | +1 correct, −1 wrong, min 0 |
| 12 | Write from dictation (`l_wfd`) | Listening | One 3–5 s sentence | — | 1 per correctly spelled word |

Rules that apply to the whole Listening part: audio plays **once**, starts after a short
countdown, and the student moves on with **Next**. Reading has a section timer
(23–30 min in the real test), not per-question timers.

Sources: Pearson's official [Reading](https://www.pearsonpte.com/pte-academic/test-format/reading/) and
[Listening](https://www.pearsonpte.com/pte-academic/test-format/listening) format pages, the
[July 2025 Score Guide](https://www.pearsonpte.com/ctf-assets/yqwtwibiobs4/WUcBAMkYCC9Dj5vs2HfVA/941d88d07ba7c2a5007f7ce1b18eedbf/Score_Guide__Test_Taker__-_PTE_Academic_-_July_2025__web_.pdf)
and [PTE changes 2025](https://www.pearsonpte.com/articles/pte-changes-2025-everything-you-need-to-know/).
Pearson says partial credit applies but doesn't publish every point value; the per-item
rules above are the ones used across the PTE training industry and match Pearson's
statements (e.g. "one point is deducted" for wrong Highlight Incorrect Words picks).

**Content note:** questions must be original. Real Pearson items are copyrighted, so
the sample set copies the *format, length, timing and marking* exactly, not real questions.
**Score note:** the LMS shows raw marks and percentages per task and skill. It should
not claim a "PTE score out of 90", because Pearson's 10–90 conversion is not public.

## 2. What the 30 sample items contain

Distribution mirrors a real test: Reading 13 (4 rw_fib, 2 r_mcma, 2 r_reorder,
3 r_fib, 2 r_mcsa) and Listening 17 (2 l_mcma, 2 l_fib, 2 l_hcs, 2 l_mcsa, 2 l_smw,
3 l_hiw, 4 l_wfd). Max raw score 120. Every item has instructions (worded like the
real screen), answer key, `maxScore` and an explanation shown after marking.
Listening items carry a `transcript` and `audioUrl: null` (see audio below).

## 3. How it fits the LMS

**Access (who can see it)**
- New course field `pteTraining: boolean`, set in the course editor
  (`courses/manage/[courseId]`, next to "Includes certificate") with the label
  "Attach PTE Academic training".
- A student sees **PTE Training** inside the Exams area (`/lms/exams`) only if one of
  their `enrolledCourses` (active enrollments only) has `pteTraining: true`. This is the
  same `enrolledCourses` check the Exams page already uses for quizzes.
- Staff (lecturer/admin) always see it, plus results.

**Data (Firestore)**
- `pteItems/{id}` — question content *without* answers (passage, options, audioUrl…).
- `pteAnswerKeys/{id}` — answers + explanation. Students must not be able to read this.
- `pteAttempts/{autoId}` — userId, itemId, mode, response, score, maxScore, createdAt.
- `courses/{id}.pteTraining` — the attach switch.

**Marking (server-side)**
- New API route `POST /api/pte/score` checks the student's sign-in token and
  enrollment, loads the answer key with `firebase-admin` (already in the project), marks
  the answer with the rules in §1, saves the attempt and returns score + correct answer
  + explanation. If marking ran in the browser, any student could read every answer
  key in DevTools.
- The marking functions go in `src/lib/pte/scoring.ts` with unit tests. The validator
  used for the sample file already tests the same rules.
- Needs the `FIREBASE_SERVICE_ACCOUNT_KEY` secret (already set on Vercel).

**Student pages**
- `/lms/exams` → new "PTE Academic Training" card with progress (e.g. 12/30 done).
- `/lms/pte` → items grouped by Reading / Listening and task type, with best score per item.
- `/lms/pte/[itemId]` → one player per task type (12 small components), styled like
  the real test: timer bar, Next button, audio plays once with countdown in **Exam
  mode**; replay + show-transcript allowed in **Practice mode**.
- Result screen: marks, which answers were right or wrong, correct answers, explanation.
- `/lms/pte/mock` (optional) → all 30 in order with section timers and a final report
  by skill.

**Admin pages**
- Admin console → Teaching → **PTE Training**: list items, preview as a student, edit
  text, upload audio per listening item, import more items from a JSON file in the
  same format as the sample (so new sets of 30 can be added without code).
- Results table (by student / course) using the responsive table pattern.

**Audio for listening items**
- Best: record or generate natural MP3s (a human voice or a good TTS service), then upload
  them to Bunny/Firebase Storage and set `audioUrl`. The Select Missing Word clips must
  end with a beep.
- Fallback until the audio exists: the browser reads the `transcript` aloud
  (speechSynthesis). It's free and works now, but it sounds robotic and the voice
  depends on the device.

## 4. Build steps

1. Marking engine + tests (`src/lib/pte/scoring.ts`).
2. Firestore collections + seed script that imports `pte-sample-items.json`
   (splits content and answer keys).
3. `/api/pte/score` route (token + enrollment check, marking, save attempt).
4. Course editor switch + access check helper.
5. Student list + 12 task players + result screen (Practice and Exam modes).
6. Admin PTE manager (preview, edit, audio upload, JSON import, results).
7. Audio for the 17 listening items.
8. Test on phone and desktop with a student account in a PTE course and one not in a
   PTE course (must not see it).

## 5. Decisions needed before building

1. "30 parts": this plan reads it as **one set of 30 questions** across all 12 task types.
   Did you mean 30 questions *per task type* (360 in total)? The format supports either.
2. Audio: will you supply recordings, or should we use a TTS service (small monthly cost)?
3. Should students see the answers immediately after each question, or only at the end
   of a full mock test?
4. Must Firestore rules (managed in the Firebase console, not in this repo) be updated by
   you to block reads of `pteAnswerKeys`? Server-side marking needs that rule to be truly
   safe.
