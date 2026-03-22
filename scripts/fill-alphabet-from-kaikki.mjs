/**
 * Fill wordlist-slovak-alphabet.txt with Kaikki Slovak noun lemmas/forms (ASCII)
 * that satisfy the same structural rules as checker.js vs slovak-wordlist.txt:
 * length 4-8, no diacritics, lowercase a-z only, not already in the built list,
 * first four letters unused by the current list, not one character different
 * from any current word (same length), then greedy pick one word per unused
 * prefix with no pairwise 1-char similarity in the picked set.
 *
 *   node build.js && node scripts/fill-alphabet-from-kaikki.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const DIACRITICAL = [
    'á',
    'č',
    'ď',
    'é',
    'í',
    'ľ',
    'ĺ',
    'ň',
    'ó',
    'ô',
    'ř',
    'š',
    'ť',
    'ú',
    'ý',
    'ž'
];

function hasDiacriticalMarks(word) {
    return DIACRITICAL.some((mark) => word.includes(mark));
}

function loadWordSet(filename) {
    const set = new Set();
    const p = path.join(root, 'data', filename);
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        set.add(t.toLowerCase());
    }
    return set;
}

function simOneCharDiff(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let k = 0; k < a.length; k++) {
        if (a[k] !== b[k]) diff++;
        if (diff > 1) return false;
    }
    return diff === 1;
}

function conflictsWithAny(word, list) {
    return list.some((x) => simOneCharDiff(word, x));
}

const wordlistPath = path.join(root, 'slovak-wordlist.txt');
const words = fs
    .readFileSync(wordlistPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const nounSet = loadWordSet('sk_nouns_kaikki_ascii.txt');
const usedPrefixes = new Set(words.map((w) => w.slice(0, 4)));
const wordSet = new Set(words);

let candidates = [...nounSet].filter(
    (w) =>
        w.length >= 4 &&
        w.length <= 8 &&
        !hasDiacriticalMarks(w) &&
        /^[a-z]+$/.test(w) &&
        !wordSet.has(w) &&
        !usedPrefixes.has(w.slice(0, 4))
);

candidates = candidates.filter((w) => !conflictsWithAny(w, words));
candidates.sort((a, b) => a.localeCompare(b, 'sk'));

const takenPrefixes = new Set(usedPrefixes);
const picked = [];
for (const w of candidates) {
    const p = w.slice(0, 4);
    if (takenPrefixes.has(p)) continue;
    if (conflictsWithAny(w, picked)) continue;
    takenPrefixes.add(p);
    picked.push(w);
}

const byLetter = Object.fromEntries(
    'abcdefghijklmnopqrstuvwxyz'.split('').map((ch) => [ch, []])
);
for (const w of picked) {
    const c = w[0];
    if (byLetter[c]) byLetter[c].push(w);
}

const lines = [
    '# Kaikki Slovak nouns (data/sk_nouns_kaikki_ascii.txt): ASCII, 4-8 chars, not in slovak-wordlist.txt.',
    '# Excludes first-4 clash and 1-char similarity vs current list; greedy one lemma per unused prefix among candidates.',
    '# Regenerate: node build.js && node scripts/fill-alphabet-from-kaikki.mjs',
    ''
];

for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
    const U = ch.toUpperCase();
    lines.push(`${U}:`);
    for (const w of byLetter[ch]) {
        lines.push(w);
    }
    lines.push('');
}

const out = lines.join('\n') + '\n';
fs.writeFileSync(path.join(root, 'wordlist-slovak-alphabet.txt'), out, 'utf8');
console.error(`Wrote ${picked.length} words to wordlist-slovak-alphabet.txt`);
