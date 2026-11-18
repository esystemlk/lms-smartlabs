// Checks every PTE training item and the marking rules.
//   node scripts/pte-check.mjs          -> validate + test
//   node scripts/pte-check.mjs --fix    -> also recompute Highlight-incorrect-words answers
import fs from "node:fs";
import assert from "node:assert";
import { rules, scoreItem, publicItem, validateItem, computeHiwAnswers, TYPE_ORDER } from "../src/lib/pte/scoring.ts";

const dir = new URL("../src/data/pte/", import.meta.url);
const fix = process.argv.includes("--fix");

// Marking rule tests
assert.equal(rules.plusMinus(["A", "C", "D"], ["A", "C", "D"]), 3);
assert.equal(rules.plusMinus(["A", "C", "D"], ["A", "B"]), 0);
assert.equal(rules.plusMinus(["A", "C", "D"], ["A", "C", "E"]), 1);
assert.equal(rules.plusMinus(["A", "C"], ["B", "E", "F"]), 0, "never negative");
assert.equal(rules.plusMinus(["A", "C"], ["A", "A", "A"]), 1, "duplicates count once");
assert.equal(rules.adjacentPairs(["A", "B", "C", "D"], ["A", "B", "C", "D"]), 3);
assert.equal(rules.adjacentPairs(["A", "B", "C", "D"], ["C", "D", "A", "B"]), 2);
assert.equal(rules.adjacentPairs(["A", "B", "C", "D"], ["D", "C", "B", "A"]), 0);
assert.equal(rules.perWord("The library will be closed.", "the library will closed on"), 4);
assert.equal(rules.perWord("the the cat", "the cat"), 2);
assert.equal(rules.perBlank({ 1: "realise" }, { 1: "Realize" }, { 1: ["realize"] }), 1);
assert.equal(rules.perBlank({ 1: "pedals", 2: "equal" }, { 1: "pedal", 2: "equal" }), 1, "spelling must be exact");
assert.equal(rules.perBlank({ 1: "x" }, {}), 0);
assert.equal(rules.binary("B", ""), 0);

const problems = [];
const ids = new Set();
const counts = {};
for (const type of TYPE_ORDER) {
  const file = new URL(`${type}.json`, dir);
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  counts[type] = items.length;
  let changed = false;
  for (const it of items) {
    if (ids.has(it.id)) problems.push(`${it.id}: duplicate id`);
    ids.add(it.id);
    if (it.type !== type) problems.push(`${it.id}: type ${it.type} in ${type}.json`);
    if (fix && type === "l_hiw") { it.answers = computeHiwAnswers(it.displayedText, it.transcript); changed = true; }
    for (const e of validateItem(it)) problems.push(`${it.id}: ${e}`);
    // perfect response must score full marks, empty must score 0, public copy must hide keys
    const r = scoreItem(it, perfect(it));
    if (r.score !== r.maxScore || r.maxScore < 1) problems.push(`${it.id}: perfect answer scored ${r.score}/${r.maxScore}`);
    if (scoreItem(it, null).score !== 0) problems.push(`${it.id}: empty answer scored > 0`);
    const pub = JSON.stringify(publicItem(it));
    if (/"(answers|answer|explanation|missing|transcript|acceptAlso)":/.test(pub)) problems.push(`${it.id}: public item leaks a key field`);
  }
  if (changed) fs.writeFileSync(file, JSON.stringify(items, null, 2) + "\n");
}

function perfect(it) {
  switch (it.type) {
    case "rw_fib": return Object.fromEntries(it.blanks.map((b) => [String(b.id), b.answer]));
    case "r_fib": case "l_fib": return it.answers;
    case "r_mcma": case "l_mcma": return it.answers;
    case "r_reorder": return it.answer;
    case "l_hiw": return it.answers.map((a) => a.index);
    case "l_wfd": return it.transcript;
    default: return it.answer;
  }
}

console.log("items per type:", counts, "| total:", ids.size);
if (problems.length) {
  console.log(`${problems.length} problem(s):\n` + problems.join("\n"));
  process.exit(1);
}
console.log("All PTE checks passed.");
