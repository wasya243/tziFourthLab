export class XorEncryption {
    private readonly key: number;

    constructor(key: number) {
        this.key = key;
    }

    public encrypt(valueToEncrypt: string): string {
        let result = '';
        for (let i = 0; i < valueToEncrypt.length; i++) {
            // @ts-ignore
            result += String.fromCharCode(this.key ^ valueToEncrypt.charCodeAt(i));
        }

        return result;
    }

    public decrypt(hash: string): string {
        let result = '';
        for (let i = 0; i < hash.length; i++) {
            // @ts-ignore
            result += String.fromCharCode(this.key ^ hash.charCodeAt(i));
        }

        return result;
    }
}
