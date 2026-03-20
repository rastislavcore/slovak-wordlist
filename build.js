const fs = require('fs');

// Assuming you've read the wordlist-slovak.txt into a string called `wordlist`
const wordlist = fs.readFileSync('wordlist-slovak.txt', 'utf8');

const parsedWordlist = wordlist.split('\n').map(line => {
    if (line.includes(': ')) {
        return line.split(': ')[1].split(', ');
    }
    return [];
}).flat().sort();

fs.writeFileSync('slovak.txt', parsedWordlist.join('\n'), 'utf8');
