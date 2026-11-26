// Self-check: build a zip, then let the system unzip tool read it back. Run: npx tsx src/lib/zip.test.ts
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { crc32, zipParts } from "./zip";

assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926); // standard CRC-32 check value

const files = [
  { path: "Notes/Week 1.txt", data: new TextEncoder().encode("hello world") },
  { path: "Notes/Vocabulary (2).txt", data: new TextEncoder().encode("ශ්‍රී ලංකා") },
  { path: "Root file.bin", data: new Uint8Array(70000).map((_, i) => i % 251) },
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zipcheck-"));
const zipFile = path.join(dir, "t.zip");
fs.writeFileSync(zipFile, Buffer.concat(zipParts(files)));
// `tar -tf` (bsdtar on Windows/macOS) lists zip archives and validates the central directory.
// Windows: use its bsdtar (Git Bash's GNU tar can't read zips); run inside the temp dir so paths have no drive letter.
const TAR = process.platform === "win32" ? "C:/Windows/System32/tar.exe" : "tar";
const listing = execFileSync(TAR, ["-tf", "t.zip"], { encoding: "utf8", cwd: dir }).split(/\r?\n/).filter(Boolean);
assert.deepEqual(listing.sort(), files.map(f => f.path).sort());
const out = path.join(dir, "out");
fs.mkdirSync(out);
execFileSync(TAR, ["-xf", "t.zip", "-C", "out"], { cwd: dir });
for (const f of files) assert.deepEqual(new Uint8Array(fs.readFileSync(path.join(out, f.path))), f.data, f.path);
fs.rmSync(dir, { recursive: true, force: true });
console.log("zip: all checks passed");
