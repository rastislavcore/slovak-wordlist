/**
 * Stream Kaikki Slovak JSONL and write ASCII lemma/form sets (4–8 chars, no diacritics).
 *
 *   curl -sL 'https://kaikki.org/dictionary/Slovak/kaikki.org-dictionary-Slovak.jsonl' \
 *     | node scripts/build-sk-noun-lexicon.mjs
 *
 * Writes:
 *   data/sk_nouns_kaikki_ascii.txt
 *   data/sk_verbs_kaikki_ascii.txt
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const nounPath = path.join(root, 'data', 'sk_nouns_kaikki_ascii.txt');
const verbPath = path.join(root, 'data', 'sk_verbs_kaikki_ascii.txt');

function strip(s) {
    return s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
}

function okLemma(w) {
    return w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w);
}

async function main() {
    const inputPath = process.argv[2];
    const input = inputPath
        ? fs.createReadStream(inputPath)
        : process.stdin;
    const rl = readline.createInterface({ input, crlfDelay: Infinity });
    const nouns = new Set();
    const verbs = new Set();
    for await (const line of rl) {
        if (!line.trim()) continue;
        let row;
        try {
            row = JSON.parse(line);
        } catch {
            continue;
        }
        if (row.lang_code !== 'sk' && row.lang !== 'Slovak') continue;
        const add = (set, raw) => {
            const w = strip(String(raw || ''));
            if (okLemma(w)) set.add(w);
        };
        if (row.pos === 'noun') {
            add(nouns, row.word);
            for (const f of row.forms || []) {
                if (f && typeof f.form === 'string') add(nouns, f.form);
            }
        }
        if (row.pos === 'verb') {
            add(verbs, row.word);
            for (const f of row.forms || []) {
                if (f && typeof f.form === 'string') add(verbs, f.form);
            }
        }
    }
    fs.mkdirSync(path.dirname(nounPath), { recursive: true });
    const nSorted = [...nouns].sort((a, b) => a.localeCompare(b, 'sk'));
    const vSorted = [...verbs].sort((a, b) => a.localeCompare(b, 'sk'));
    fs.writeFileSync(nounPath, nSorted.join('\n') + '\n', 'utf8');
    fs.writeFileSync(verbPath, vSorted.join('\n') + '\n', 'utf8');
    console.error(`Wrote ${nSorted.length} noun forms -> ${nounPath}`);
    console.error(`Wrote ${vSorted.length} verb forms -> ${verbPath}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
