/**
 * Scrape word titles from slovensky.eu category archives (letters n–z),
 * keep only candidates that match mnemonic rules (length, ASCII, no phrases).
 * Merges into ../wordlist-slovak-alphabet.txt (grouped by first letter).
 *
 * Run: node scripts/scrape-slovensky-alphabet.mjs
 * Range: node scripts/scrape-slovensky-alphabet.mjs n-y
 *
 * If you see empty results or errors, the host may block datacenter IPs (WAF).
 * Run the same command on your home network or adjust delays / User-Agent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outFile = path.join(root, 'wordlist-slovak-alphabet.txt');

const BASE = 'https://www.slovensky.eu';
const LETTERS_ALL = 'nopqrstuvwxyz'.split('');
const argvToken = process.argv[2]?.toLowerCase();

function resolveLetters(token) {
    if (!token) return LETTERS_ALL;
    if (token.includes('-')) {
        const [from, to] = token.split('-');
        if (!from || !to || from.length !== 1 || to.length !== 1) {
            console.error('Range must look like n-y (two letters).');
            process.exit(1);
        }
        const i1 = LETTERS_ALL.indexOf(from);
        const i2 = LETTERS_ALL.indexOf(to);
        if (i1 < 0 || i2 < 0 || i1 > i2) {
            console.error(
                `Invalid range "${token}". Letters must be within ${LETTERS_ALL.join('')} in order.`
            );
            process.exit(1);
        }
        return LETTERS_ALL.slice(i1, i2 + 1);
    }
    if (LETTERS_ALL.includes(token)) return [token];
    console.error(
        `Unknown "${token}". Use one letter (${LETTERS_ALL.join('')}), a range (n-y), or omit for all.`
    );
    process.exit(1);
}

const LETTERS = resolveLetters(argvToken);

function parseExistingAlphabet(content) {
    const map = new Map();
    let current = null;
    for (const line of content.split(/\r?\n/)) {
        const header = line.trim().match(/^([A-Z]):\s*$/);
        if (header) {
            current = header[1].toLowerCase();
            if (!map.has(current)) map.set(current, new Set());
            continue;
        }
        if (current && line.trim() && !line.trim().startsWith('#')) {
            map.get(current).add(line.trim().toLowerCase());
        }
    }
    return map;
}

const DELAY_MS = 700;
const MAX_PAGES_PER_LETTER = 60;
const REQUEST_TIMEOUT_MS = 25_000;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function stripDiacritics(s) {
    return s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase();
}

/** Single token, letters only (Slovak diacritics allowed before stripping). */
function rawTitleOk(raw) {
    const t = raw.trim();
    if (!t || /\s/.test(t)) return false;
    if (/[0-9_.'"„“‚‘\-]/.test(t)) return false;
    return /^[\p{L}]+$/u.test(t);
}

function normalizedFitsMnemonic(normalized) {
    if (normalized.length < 4 || normalized.length > 8) return false;
    return /^[a-z]+$/.test(normalized);
}

/** Same rule as checker.js: same length, exactly one differing character. */
function isSimilarPair(a, b) {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) d++;
        if (d > 1) return false;
    }
    return d === 1;
}

function pruneSimilar(words) {
    const arr = [...words].sort((a, b) => a.localeCompare(b, 'sk'));
    const keep = new Set(arr);
    for (;;) {
        const list = [...keep].sort((a, b) => a.localeCompare(b, 'sk'));
        let removed = false;
        outer: for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                if (isSimilarPair(list[i], list[j])) {
                    keep.delete(list[j]);
                    removed = true;
                    break outer;
                }
            }
        }
        if (!removed) break;
    }
    return keep;
}

function extractTitles(html) {
    const titles = [];
    const patterns = [
        /<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi,
        /<h2[^>]*class="[^"]*post-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi,
        /class="[^"]*entry-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/gi
    ];
    for (const re of patterns) {
        let m;
        const local = new RegExp(re.source, re.flags);
        while ((m = local.exec(html)) !== null) {
            titles.push(m[1].replace(/&nbsp;/g, ' ').trim());
        }
    }
    return titles;
}

async function fetchHtml(url) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            signal: ac.signal,
            redirect: 'follow',
            headers: {
                Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'sk-SK,sk;q=0.9,en;q=0.7',
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
            }
        });
        const text = await res.text();
        return { ok: res.ok, status: res.status, text };
    } finally {
        clearTimeout(t);
    }
}

function hasNextPage(html) {
    if (/<link[^>]+rel=["']next["']/i.test(html)) return true;
    if (/<a[^>]*rel=["']next["']/i.test(html)) return true;
    if (/<a[^>]*class="[^"]*\bnext\b[^"]*"/i.test(html)) return true;
    return false;
}

async function scrapeLetter(letter) {
    const collected = new Set();
    for (let page = 1; page <= MAX_PAGES_PER_LETTER; page++) {
        const url =
            page === 1
                ? `${BASE}/category/${letter}/`
                : `${BASE}/category/${letter}/page/${page}/`;
        const { ok, status, text } = await fetchHtml(url);
        if (status === 404 || !ok) {
            if (page === 1) {
                console.warn(`  ${letter}: first page HTTP ${status} — check URL or blocking`);
            }
            break;
        }
        if (/Access Denied|Access Forbidden|blocked by our web application firewall/i.test(text)) {
            console.warn(`  ${letter}: WAF / access denied — try from another network`);
            break;
        }
        const titles = extractTitles(text);
        if (titles.length === 0) break;
        for (const raw of titles) {
            if (!rawTitleOk(raw)) continue;
            const normalized = stripDiacritics(raw);
            if (!normalizedFitsMnemonic(normalized)) continue;
            if (!normalized.startsWith(letter)) continue;
            collected.add(normalized);
        }
        if (!hasNextPage(text)) break;
        await sleep(DELAY_MS);
    }
    return collected;
}

function formatOutput(mergedByLetter) {
    const lines = [
        '# slovensky.eu category scrape (n–z), filtered for mnemonic rules',
        '# Full run: npm run scrape:alphabet',
        '# One letter: node scripts/scrape-slovensky-alphabet.mjs n',
        '# Letter range: node scripts/scrape-slovensky-alphabet.mjs n-y',
        ''
    ];
    for (const letter of LETTERS_ALL) {
        const words = [...(mergedByLetter.get(letter) || [])].sort((a, b) =>
            a.localeCompare(b, 'sk')
        );
        lines.push(`${letter.toUpperCase()}:`);
        for (const w of words) lines.push(w);
        lines.push('');
    }
    return lines.join('\n');
}

async function main() {
    if (LETTERS.length === 1) {
        console.log(`Single-letter mode: ${LETTERS[0]}`);
    } else if (argvToken?.includes('-')) {
        console.log(
            `Range mode: ${LETTERS[0]}…${LETTERS[LETTERS.length - 1]} (${LETTERS.length} letters)`
        );
    }
    const existing = fs.existsSync(outFile)
        ? parseExistingAlphabet(fs.readFileSync(outFile, 'utf8'))
        : new Map();
    const merged = new Map();
    for (const letter of LETTERS_ALL) {
        merged.set(letter, new Set(existing.get(letter) || []));
    }
    for (const letter of LETTERS) {
        process.stdout.write(`Letter ${letter}… `);
        await sleep(DELAY_MS);
        const fresh = await scrapeLetter(letter);
        merged.set(letter, pruneSimilar(fresh));
        console.log(`${merged.get(letter).size} words (after similar-pair prune)`);
    }
    const all = new Set();
    for (const s of merged.values()) for (const w of s) all.add(w);
    console.log(`Total unique (n–z file): ${all.size}`);
    fs.writeFileSync(outFile, formatOutput(merged), 'utf8');
    console.log(`Wrote ${outFile}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
