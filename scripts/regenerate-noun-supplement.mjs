/**
 * Rebuild data/sk_noun_lexicon_supplement.txt from slovak-wordlist.txt + Kaikki data.
 * Keeps: lemmas in neither noun nor verb Kaikki sets (except *ovat OOV verbs),
 * plus fixed homonyms attested only as verbs in Kaikki.
 *
 *   node build.js && node scripts/regenerate-noun-supplement.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadSet(file) {
    return new Set(
        fs
            .readFileSync(path.join(root, 'data', file), 'utf8')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith('#'))
    );
}

const N = loadSet('sk_nouns_kaikki_ascii.txt');
const V = loadSet('sk_verbs_kaikki_ascii.txt');
const words = fs
    .readFileSync(path.join(root, 'slovak-wordlist.txt'), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const homonyms = ['dokaz', 'hovor', 'kryt', 'rast', 'veduci', 'riadenie'];
const supp = new Set(homonyms);
for (const w of words) {
    if (N.has(w) || V.has(w)) continue;
    if (w.length >= 6 && /ovat$/.test(w)) continue;
    supp.add(w);
}
const sorted = [...supp].sort((a, b) => a.localeCompare(b, 'sk'));
const header = `# OOV noun lemmas (in neither Kaikki noun nor verb lists) + homonyms attested only as verbs.\n# Do not add *ovat infinitives.\n# Regenerate: node build.js && node scripts/regenerate-noun-supplement.mjs\n`;
fs.writeFileSync(
    path.join(root, 'data', 'sk_noun_lexicon_supplement.txt'),
    header + sorted.join('\n') + '\n',
    'utf8'
);
console.error(`Wrote ${sorted.length} supplement entries`);

