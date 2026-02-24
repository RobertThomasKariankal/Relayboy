/**
 * 🔐 CRYSTALS-Kyber Encapsulation Module (JavaScript Version)
 */

import { MlKem768 } from 'crystals-kyber-js';

// Utility functions
export function uint8ArrayToBase64(bytes) {
    return Buffer.from(bytes).toString('base64');
}

export function base64ToUint8Array(base64) {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Optimized Encapsulation class
 */
export class KyberEncapsulator {
    constructor() {
        this.kem = new MlKem768();
    }

    /**
     * Lattice-Based Encapsulation
     * @param {Uint8Array} recipientPublicKey 
     */
    async encapsulate(recipientPublicKey) {
        console.log('🔐 Starting Lattice-Based Encapsulation...');
        const [ciphertext, sharedSecret] = await this.kem.encap(recipientPublicKey);
        console.log('✅ Lattice-based encapsulation successful!');
        return { ciphertext, sharedSecret };
    }

    resultToBase64(result) {
        return {
            ciphertext: uint8ArrayToBase64(result.ciphertext),
            sharedSecret: uint8ArrayToBase64(result.sharedSecret)
        };
    }
}

// Factory function
export function createEncapsulator() {
    return new KyberEncapsulator();
}
