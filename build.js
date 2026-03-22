const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'base-wordlist-slovak.txt');
const outputPath = path.join(__dirname, 'slovak-wordlist.txt');

/** README: CH as C — map leading `ch` so words sit with `c*` under English collation. */
function sortKey(word) {
	const w = word.toLowerCase();
	return w.startsWith('ch') ? `c${w.slice(2)}` : w;
}

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
	.sort((a, b) => {
		const cmp = sortKey(a).localeCompare(sortKey(b), 'en');
		return cmp !== 0 ? cmp : a.localeCompare(b, 'en');
	});

const out = parsedWordlist.join('\n') + '\n';
fs.writeFileSync(outputPath, out, 'utf8');
