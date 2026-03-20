const fs = require('fs');

const wordlist = fs.readFileSync('slovak.txt', 'utf8').split('\n');

// Check for duplicates
function checkDuplicates() {
    const duplicates = [];
    wordlist.forEach((word, index) => {
        if (wordlist.indexOf(word) !== index) {
            duplicates.push(word);
        }
    });
    return duplicates;
}

// Check word length
function checkWordLength() {
    return wordlist.filter(word => word.length < 4 || word.length > 8);
}

// Check if words can be uniquely determined by the first 4 letters
function checkUniqueFirstFour() {
    const firstFourLetters = {};
    wordlist.forEach(word => {
        const prefix = word.slice(0, 4);
        if (!firstFourLetters[prefix]) {
            firstFourLetters[prefix] = [];
        }
        firstFourLetters[prefix].push(word);
    });
    return Object.entries(firstFourLetters).filter(([_, words]) => words.length > 1);
}

// Check for words without diacritical marks
function checkDiacriticalMarks() {
    const diacriticalMarks = ['á', 'č', 'ď', 'é', 'í', 'ľ', 'ĺ', 'ň', 'ó', 'ô', 'ř', 'š', 'ť', 'ú', 'ý', 'ž'];
    return wordlist.filter(word => {
        return diacriticalMarks.some(mark => word.includes(mark));
    });
}

// Check for very similar words with only 1 letter of difference
function checkSimilarWords() {
    const verySimilarWords = [];
    for (let i = 0; i < wordlist.length; i++) {
        for (let j = i + 1; j < wordlist.length; j++) {
            if (wordlist[i].length !== wordlist[j].length) continue;
            let differences = 0;
            for (let k = 0; k < wordlist[i].length; k++) {
                if (wordlist[i][k] !== wordlist[j][k]) {
                    differences++;
                }
                if (differences > 1) break;
            }
            if (differences === 1) {
                verySimilarWords.push([wordlist[i], wordlist[j]]);
            }
        }
    }
    return verySimilarWords;
}

// Check for exact 2048 words
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
