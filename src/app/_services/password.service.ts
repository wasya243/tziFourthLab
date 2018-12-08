import { Injectable } from '@angular/core';

import { NUMBERS, VOWELS, CONSONANTS } from '../constants';
import { generatePassword } from '../encryption';

@Injectable()
export class PasswordService {

    generatePassword(): string {
        return generatePassword(VOWELS, CONSONANTS, NUMBERS);
    }
}
