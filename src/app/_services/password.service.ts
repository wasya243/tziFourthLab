import { Injectable } from '@angular/core';

import { NUMBERS, VOWELS, CONSONANTS } from '../constants';
import encryption from '../encryption';

@Injectable()
export class PasswordService {

    generatePassword(): string {
        return encryption(VOWELS, CONSONANTS, NUMBERS);
    }
}
