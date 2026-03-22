const assert = require('assert');
const {
    checkDuplicates,
    checkWordLength,
    checkUniqueFirstFour,
    checkDiacriticalMarks,
    checkSimilarWords,
    checkWordCount,
    getWordlistLength
} = require('./checker');

describe('Wordlist checks', () => {
    it('should have no duplicates', () => {
        const duplicates = checkDuplicates();
        assert.strictEqual(duplicates.length, 0, `Found duplicates: ${duplicates.join(', ')}`);
    });

    it('should have words with 4-8 characters length', () => {
        const incorrectLength = checkWordLength();
        assert.strictEqual(
            incorrectLength.length,
            0,
            `Found words with incorrect length: ${incorrectLength.join(', ')}`
        );
    });

    it('should have unique first four characters for each word', () => {
        const nonUniqueFirstFour = checkUniqueFirstFour();
        const detail = nonUniqueFirstFour.map(([prefix, words]) => `${prefix}: ${words.join(', ')}`).join('; ');
        assert.strictEqual(nonUniqueFirstFour.length, 0, detail || 'non-unique 4-letter prefixes');
    });

    it('should not have words with diacritical marks', () => {
        const withDiacriticalMarks = checkDiacriticalMarks();
        assert.strictEqual(
            withDiacriticalMarks.length,
            0,
            `Found words with diacritical marks: ${withDiacriticalMarks.join(', ')}`
        );
    });

    it('should not have very similar words', () => {
        const similarWords = checkSimilarWords();
        const detail = similarWords.map((pair) => pair.join(' / ')).join('; ');
        assert.strictEqual(similarWords.length, 0, detail || 'similar word pairs');
    });

    it('should have exactly 2048 words', function () {
        if (getWordlistLength() !== 2048) {
            this.skip();
        }
        assert.strictEqual(checkWordCount(), true, 'Word count is not 2048');
    });
});

