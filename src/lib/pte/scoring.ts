// PTE Academic training: item shapes, marking rules and answer stripping.
// Kept free of imports so scripts/pte-check.mjs can run it directly with Node.

export type PteType =
  | "rw_fib" | "r_mcma" | "r_reorder" | "r_fib" | "r_mcsa"
  | "l_mcma" | "l_fib" | "l_hcs" | "l_mcsa" | "l_smw" | "l_hiw" | "l_wfd";

export interface PteOption { id: string; text: string }

export interface PteItem {
  id: string;
  section: "reading" | "listening";
  type: PteType;
  title: string;
  instructions: string;
  scoring: "per_blank" | "plus_minus" | "adjacent_pairs" | "binary" | "per_word";
  skills: string[];
  prepSeconds?: number;
  passage?: string;
  question?: string;
  options?: PteOption[];
  blanks?: { id: number; options: string[]; answer?: string }[];
  wordBank?: string[];
  paragraphs?: PteOption[];
  displayOrder?: string[];
  transcript?: string;
  displayedText?: string;
  missing?: string;
  audioUrl?: string | null;
  // answer keys (never sent to students)
  answers?: string[] | Record<string, string> | { index: number; shown: string; spoken: string }[];
  answer?: string | string[];
  acceptAlso?: Record<string, string[]>;
  explanation?: string;
  maxScore?: number;
}

/** What a student's browser receives: everything needed to show the task, no answers. */
export type PtePublicItem = Omit<PteItem, "answers" | "answer" | "acceptAlso" | "explanation" | "missing" | "transcript"> & {
  /** Text for the browser to read aloud when no recording exists yet. */
  ttsText?: string;
};

export interface PteResult {
  score: number;
  maxScore: number;
  /** Correct answer in display form, shown after marking. */
  key: unknown;
  explanation?: string;
}

export const TYPE_LABELS: Record<PteType, string> = {
  rw_fib: "Reading & Writing: Fill in the blanks",
  r_mcma: "Multiple choice, multiple answers (Reading)",
  r_reorder: "Re-order paragraphs",
  r_fib: "Reading: Fill in the blanks",
  r_mcsa: "Multiple choice, single answer (Reading)",
  l_mcma: "Multiple choice, multiple answers (Listening)",
  l_fib: "Listening: Fill in the blanks",
  l_hcs: "Highlight correct summary",
  l_mcsa: "Multiple choice, single answer (Listening)",
  l_smw: "Select missing word",
  l_hiw: "Highlight incorrect words",
  l_wfd: "Write from dictation",
};

export const TYPE_ORDER = Object.keys(TYPE_LABELS) as PteType[];

export const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9'-]/g, "");
const words = (s: string) => s.split(/\s+/).filter(Boolean);
export const blankIds = (passage = "") => [...passage.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);

const asStringArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const asRecord = (v: unknown): Record<string, string> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => typeof x === "string") as [string, string][])
    : {};

export const rules = {
  perBlank(key: Record<string, string>, resp: Record<string, string>, alt: Record<string, string[]> = {}) {
    return Object.keys(key).reduce((s, k) => {
      const r = norm(resp[k] || "");
      return s + (r && [key[k], ...(alt[k] || [])].some((a) => norm(a) === r) ? 1 : 0);
    }, 0);
  },
  plusMinus<T>(key: T[], picked: T[]) {
    return Math.max(0, [...new Set(picked)].reduce((s, p) => s + (key.includes(p) ? 1 : -1), 0));
  },
  adjacentPairs(key: string[], order: string[]) {
    let s = 0;
    for (let i = 0; i < order.length - 1; i++) {
      const a = key.indexOf(order[i]);
      if (a !== -1 && key.indexOf(order[i + 1]) === a + 1) s++;
    }
    return s;
  },
  binary: (key: string, r: string) => (r && key === r ? 1 : 0),
  perWord(sentence: string, resp: string) {
    const pool = words(resp).map(norm).filter(Boolean);
    return words(sentence).map(norm).filter(Boolean).reduce((s, w) => {
      const i = pool.indexOf(w);
      if (i === -1) return s;
      pool.splice(i, 1);
      return s + 1;
    }, 0);
  },
};

const hiwKey = (item: PteItem) => (item.answers as { index: number; shown: string; spoken: string }[]) || [];
const blankKey = (item: PteItem): Record<string, string> =>
  item.type === "rw_fib"
    ? Object.fromEntries((item.blanks || []).map((b) => [String(b.id), b.answer || ""]))
    : (item.answers as Record<string, string>) || {};

export function maxScoreOf(item: PteItem): number {
  switch (item.type) {
    case "rw_fib": return item.blanks?.length || 0;
    case "r_fib": case "l_fib": return blankIds(item.passage).length;
    case "r_mcma": case "l_mcma": return (item.answers as string[]).length;
    case "r_reorder": return (item.answer as string[]).length - 1;
    case "l_hiw": return hiwKey(item).length;
    case "l_wfd": return words(item.transcript || "").length;
    default: return 1;
  }
}

/** Mark one response. Unknown or malformed responses simply score 0. */
export function scoreItem(item: PteItem, response: unknown): PteResult {
  const maxScore = maxScoreOf(item);
  let score = 0;
  let key: unknown;
  switch (item.type) {
    case "rw_fib": case "r_fib": case "l_fib":
      key = blankKey(item);
      score = rules.perBlank(key as Record<string, string>, asRecord(response), item.acceptAlso);
      break;
    case "r_mcma": case "l_mcma":
      key = item.answers;
      score = rules.plusMinus(item.answers as string[], asStringArray(response));
      break;
    case "r_reorder":
      key = item.answer;
      score = rules.adjacentPairs(item.answer as string[], asStringArray(response));
      break;
    case "r_mcsa": case "l_mcsa": case "l_hcs": case "l_smw":
      key = item.answer;
      score = rules.binary(item.answer as string, typeof response === "string" ? response : "");
      break;
    case "l_hiw": {
      key = hiwKey(item);
      const picked = Array.isArray(response) ? response.filter((n): n is number => Number.isInteger(n)) : [];
      score = rules.plusMinus(hiwKey(item).map((a) => a.index), picked);
      break;
    }
    case "l_wfd":
      key = item.transcript;
      score = rules.perWord(item.transcript || "", typeof response === "string" ? response.slice(0, 500) : "");
      break;
  }
  return { score: Math.min(score, maxScore), maxScore, key, explanation: item.explanation };
}

export function publicItem(item: PteItem): PtePublicItem {
  const { answers: _a, answer: _b, acceptAlso: _c, explanation: _d, missing: _e, transcript, ...rest } = item;
  const out: PtePublicItem = { ...rest, maxScore: maxScoreOf(item) };
  if (out.blanks) out.blanks = out.blanks.map(({ id, options }) => ({ id, options }));
  // shortcut: without a recording the browser reads the transcript aloud, so a student could read it in DevTools
  // (it gives away Write-from-dictation / Highlight-incorrect-words answers). Upload audio per item to close this.
  if (item.section === "listening" && !item.audioUrl && transcript) out.ttsText = transcript.replace(/\s*\[BEEP\]\s*$/, "");
  return out;
}

/** Format checks against the official PTE limits. Returns a list of problems (empty = valid). */
export function validateItem(item: PteItem): string[] {
  const errs: string[] = [];
  const wc = (s = "") => words(s.replace(/\{\{\d+\}\}/g, "x")).length;
  const optIds = (item.options || []).map((o) => o.id);
  switch (item.type) {
    case "rw_fib":
      if (wc(item.passage) > 200) errs.push(`passage ${wc(item.passage)} words > 200`);
      if (blankIds(item.passage).length !== item.blanks?.length) errs.push("blank markers != blanks");
      item.blanks?.forEach((b) => {
        if (!b.answer || !b.options.includes(b.answer)) errs.push(`blank ${b.id} answer not in options`);
        if (new Set(b.options).size !== b.options.length) errs.push(`blank ${b.id} duplicate options`);
      });
      break;
    case "r_mcma": case "l_mcma": {
      if (item.type === "r_mcma" && wc(item.passage) > 350) errs.push("passage > 350 words");
      const a = item.answers as string[];
      if (!Array.isArray(a) || a.length < 2 || a.some((x) => !optIds.includes(x))) errs.push("needs 2+ answers that are options");
      if (a?.length >= optIds.length) errs.push("needs wrong options too");
      break;
    }
    case "r_reorder": {
      const ids = (item.paragraphs || []).map((p) => p.id).sort().join();
      const ans = item.answer as string[];
      if ([...ans].sort().join() !== ids || [...(item.displayOrder || [])].sort().join() !== ids) errs.push("answer/displayOrder must use every box once");
      if (item.displayOrder?.join() === ans.join()) errs.push("displayOrder not shuffled");
      if (wc((item.paragraphs || []).map((p) => p.text).join(" ")) > 160) errs.push("paragraphs too long");
      break;
    }
    case "r_fib": {
      if (wc(item.passage) > 80) errs.push(`passage ${wc(item.passage)} words > 80`);
      const ans = item.answers as Record<string, string>;
      const ids = blankIds(item.passage);
      if (ids.some((n) => !item.wordBank?.includes(ans[n]))) errs.push("answer not in word bank");
      if ((item.wordBank?.length || 0) <= ids.length) errs.push("word bank needs distractors");
      if (new Set(item.wordBank).size !== item.wordBank?.length) errs.push("duplicate word bank entries");
      break;
    }
    case "r_mcsa": case "l_mcsa": case "l_hcs": case "l_smw":
      if (item.type === "r_mcsa" && wc(item.passage) > 110) errs.push(`passage ${wc(item.passage)} words > 110`);
      if (!optIds.includes(item.answer as string)) errs.push("answer not an option");
      if (item.type === "l_smw") {
        if (!item.transcript?.endsWith("[BEEP]")) errs.push("transcript must end with [BEEP]");
        if (item.options?.find((o) => o.id === item.answer)?.text !== item.missing) errs.push("answer text != missing");
      }
      break;
    case "l_fib": {
      const ans = item.answers as Record<string, string>;
      const filled = (item.passage || "").replace(/\{\{(\d+)\}\}/g, (_, n) => ans[n] ?? "??");
      if (filled !== item.transcript) errs.push("passage with answers != transcript");
      break;
    }
    case "l_hiw": {
      const shown = words(item.displayedText || "");
      const spoken = words(item.transcript || "");
      if (shown.length !== spoken.length) errs.push("shown/spoken word counts differ");
      const diff = shown.map((w, i) => (norm(w) !== norm(spoken[i] || "") ? i : -1)).filter((i) => i >= 0);
      if (diff.join() !== hiwKey(item).map((a) => a.index).join()) errs.push(`answers don't match differences (${diff.join()})`);
      if (diff.length < 2) errs.push("needs 2+ incorrect words");
      break;
    }
    case "l_wfd": {
      const n = words(item.transcript || "").length;
      if (n < 7 || n > 15) errs.push(`sentence ${n} words, expected 7-15`);
      break;
    }
  }
  if (item.section === "listening" && !item.transcript) errs.push("listening item needs transcript");
  return errs;
}

/** Highlight-incorrect-words key, computed from the shown vs spoken text. */
export function computeHiwAnswers(displayedText: string, transcript: string) {
  const shown = words(displayedText);
  const spoken = words(transcript);
  const strip = (w: string) => w.replace(/[.,;:!?]$/, "");
  return shown
    .map((w, i) => (norm(w) !== norm(spoken[i] || "") ? { index: i, shown: strip(w), spoken: strip(spoken[i] || "") } : null))
    .filter((x): x is { index: number; shown: string; spoken: string } => x !== null);
}
