/**
 * 🔐 CRYSTALS-Kyber Key Generation Module (JavaScript Version)
 * 
 * Optimized for fast key generation during login/registration
 * Lattice-Based Module-LWE Cryptography (NOT ECDH)
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
 * Optimized Key Generation class
 */
export class KyberKeyGenerator {
    constructor() {
        this.kem = new MlKem768();
    }

    /**
     * Generate a new Lattice-Based Kyber key pair
     * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
     */
    async generateKeyPair() {
        console.log('🔐 Generating Lattice-Based Kyber key pair...');
        const [publicKey, privateKey] = await this.kem.generateKeyPair();
        console.log('✅ Lattice-based key pair generated successfully');
        return { publicKey, privateKey };
    }
}

// Factory function
export function createKeyGenerator() {
    return new KyberKeyGenerator();
}
