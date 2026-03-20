const assert = require('assert');
const {
    checkDuplicates,
    checkWordLength,
    checkUniqueFirstFour,
    checkDiacriticalMarks,
    checkSimilarWords,
    checkWordCount
} = require('./checker');

describe('Wordlist checks', () => {
    it('should have no duplicates', () => {
        const duplicates = checkDuplicates();
        assert.strictEqual(duplicates.length, 0, `Found duplicates: ${duplicates.join(', ')}`);
    });

    it('should have words with 4-8 characters length', () => {
        const incorrectLength = checkWordLength();
        assert.strictEqual(incorrectLength.length, 0, `Found words with incorrect length: ${incorrectLength.join(', ')}`);
    });

    it('should have unique first four characters for each word', () => {
        const nonUniqueFirstFour = checkUniqueFirstFour();
        nonUniqueFirstFour.forEach(group => {
            assert.strictEqual(group[1].length, 1, `Found words with same first four characters: ${group[1].join(', ')}`);
        });
    });

    it('should not have words with diacritical marks', () => {
        const withDiacriticalMarks = checkDiacriticalMarks();
        assert.strictEqual(withDiacriticalMarks.length, 0, `Found words with diacritical marks: ${withDiacriticalMarks.join(', ')}`);
    });

    it('should not have very similar words', () => {
        const similarWords = checkSimilarWords();
        similarWords.forEach(pair => {
            assert.fail(`Found similar words: ${pair.join(' and ')}`);
        });
    });

    it('should have exactly 2048 words', () => {
        const isCorrectCount = checkWordCount();
        assert.strictEqual(isCorrectCount, true, 'Word count is not 2048');
    });
});
