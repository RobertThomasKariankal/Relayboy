/**
 * 🔐 CRYSTALS-Kyber Decapsulation Module (JavaScript Version)
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
 * Optimized Decapsulation class
 */
export class KyberDecapsulator {
    constructor() {
        this.kem = new MlKem768();
    }

    /**
     * Lattice-Based Decapsulation
     * @param {Uint8Array} ciphertext 
     * @param {Uint8Array} privateKey 
     */
    async decapsulate(ciphertext, privateKey) {
        console.log('🔓 Starting Lattice-Based Decapsulation...');
        const sharedSecret = await this.kem.decap(ciphertext, privateKey);
        console.log('✅ Lattice-based decapsulation successful!');
        return sharedSecret;
    }
}

// Factory function
export function createDecapsulator() {
    return new KyberDecapsulator();
}
