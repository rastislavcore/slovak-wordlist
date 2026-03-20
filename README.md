# Slovak Mnemonic Wordlist

This project provides a mnemonic wordlist for the Slovak language. The wordlist is checked against various criteria to ensure its appropriateness for cryptographic uses.

## Installation

To set up the project, first clone the repository:

```bash
git clone https://github.com/rastislavcore/slovak-wordlist.git
cd slovak-wordlist
npm install
```

## Usage

1. **Building the wordlist:**

   You can build the wordlist and save it as `slovak.txt` by running:

   ```bash
   npm run build
   ```

2. **Testing the wordlist:**

   You can test the wordlist against the set criteria by running:

   ```bash
   npm test
   ```

## Criteria

The wordlist is checked against the following criteria:

- No duplicates.
- Words are 4-8 characters long.
- Words can be uniquely determined by typing the first 4 letters.
- Words contain all letters without diacritical marks.
- Contains only nouns.
- No very similar words with only 1 letter of difference.
- Contains exactly 2048 words.
- Contains no:
  - personal names or geographical names;
  - numeric phrases;
  - nation names;
  - years, months, weeks, day names;
  - brands, trademarks;
  - colors;
  - no offensive words.

## Notes

Letter `CH` is classified in the list as letter `C`.

## Issues

If you encounter any issues or have suggestions for the wordlist, please [create an issue on GitHub](https://github.com/rastislavcore/slovak-wordlist/issues).

## License

This project is licensed under the [CORE License](https://github.com/bchainhub/core-license/blob/master/LICENSE).
