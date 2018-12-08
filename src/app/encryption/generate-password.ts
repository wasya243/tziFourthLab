function shuffle(str: string): string {
    let a = str.split(''),
        n = a.length;

    for (let i = n - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let tmp = a[ i ];
        a[ i ] = a[ j ];
        a[ j ] = tmp;
    }
    return a.join('');
}

function generateString(length: number, alphabet: string): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }

    return result;
}

export function generatePassword(vowels: string, consonants: string, numbers: string): string {

    const k = Math.floor(Math.random() * 10) + 1;

    const vowelPart = generateString(k, vowels);
    const consonantPart = generateString(k * 2, consonants);
    const numberPart = generateString(k, numbers);

    return shuffle(vowelPart + consonantPart + numberPart);
}
