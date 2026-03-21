const fs = require('fs');
const path = require('path');

const slovakPath = path.join(__dirname, 'slovak.txt');
const wordlist = fs
    .readFileSync(slovakPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function checkDuplicates() {
    const seen = new Set();
    const duplicates = [];
    for (const word of wordlist) {
        if (seen.has(word)) duplicates.push(word);
        else seen.add(word);
    }
    return duplicates;
}

function checkWordLength() {
    return wordlist.filter((word) => word.length < 4 || word.length > 8);
}

function checkUniqueFirstFour() {
    const firstFourLetters = {};
    for (const word of wordlist) {
        const prefix = word.slice(0, 4);
        if (!firstFourLetters[prefix]) firstFourLetters[prefix] = [];
        firstFourLetters[prefix].push(word);
    }
    return Object.entries(firstFourLetters).filter(([, words]) => words.length > 1);
}

function checkDiacriticalMarks() {
    const diacriticalMarks = ['á', 'č', 'ď', 'é', 'í', 'ľ', 'ĺ', 'ň', 'ó', 'ô', 'ř', 'š', 'ť', 'ú', 'ý', 'ž'];
    return wordlist.filter((word) => diacriticalMarks.some((mark) => word.includes(mark)));
}

function checkSimilarWords() {
    const verySimilarWords = [];
    for (let i = 0; i < wordlist.length; i++) {
        for (let j = i + 1; j < wordlist.length; j++) {
            if (wordlist[i].length !== wordlist[j].length) continue;
            let differences = 0;
            for (let k = 0; k < wordlist[i].length; k++) {
                if (wordlist[i][k] !== wordlist[j][k]) differences++;
                if (differences > 1) break;
            }
            if (differences === 1) {
                verySimilarWords.push([wordlist[i], wordlist[j]]);
            }
        }
    }
    return verySimilarWords;
}

function checkWordCount() {
    return wordlist.length === 2048;
}

module.exports = {
    checkDuplicates,
    checkWordLength,
    checkUniqueFirstFour,
    checkDiacriticalMarks,
    checkSimilarWords,
    checkWordCount
};
