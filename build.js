const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'base-wordlist-slovak.txt');
const outputPath = path.join(__dirname, 'slovak-wordlist.txt');

const wordlist = fs.readFileSync(inputPath, 'utf8');

const parsedWordlist = wordlist
    .split(/\r?\n/)
    .map((line) => {
        const sep = ': ';
        const idx = line.indexOf(sep);
        if (idx === -1) return [];
        return line
            .slice(idx + sep.length)
            .split(', ')
            .map((w) => w.trim())
            .filter(Boolean);
    })
    .flat()
    .sort((a, b) => a.localeCompare(b, 'sk'));

const out = parsedWordlist.join('\n') + '\n';
fs.writeFileSync(outputPath, out, 'utf8');
