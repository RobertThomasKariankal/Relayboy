import { KyberEncapsulator } from "./kyber/kyber-encapsulate.js";
import { KyberDecapsulator } from "./kyber/kyber-decapsulate.js";
import { KyberKeyGenerator, uint8ArrayToBase64, base64ToUint8Array } from "./kyber/kyber-keygen.js";

async function testHandshakeFlow() {
    console.log("🧪 Testing Full Kyber Handshake Flow...\n");

    // Step 1: Generate a key pair (simulating user registration)
    console.log("--- Step 1: Key Generation ---");
    const keyGen = new KyberKeyGenerator();
    const { publicKey, privateKey } = await keyGen.generateKeyPair();
    console.log(`Public key: ${publicKey.length} bytes`);
    console.log(`Private key: ${privateKey.length} bytes\n`);

    // Step 2: Encapsulate (sender side)
    console.log("--- Step 2: Encapsulation ---");
    const encapsulator = new KyberEncapsulator();
    const { ciphertext, sharedSecret: senderSecret } = await encapsulator.encapsulate(publicKey);
    const senderSecretB64 = uint8ArrayToBase64(senderSecret);
    console.log(`Ciphertext: ${ciphertext.length} bytes`);
    console.log(`Sender shared secret (B64): ${senderSecretB64.substring(0, 30)}...\n`);

    // Step 3: Decapsulate (receiver side)
    console.log("--- Step 3: Decapsulation ---");
    const decapsulator = new KyberDecapsulator();
    const receiverSecret = await decapsulator.decapsulate(ciphertext, privateKey);
    const receiverSecretB64 = uint8ArrayToBase64(receiverSecret);
    console.log(`Receiver shared secret (B64): ${receiverSecretB64.substring(0, 30)}...\n`);

    // Step 4: Verify
    console.log("--- Step 4: Verification ---");
    if (senderSecretB64 === receiverSecretB64) {
        console.log("🎉 SUCCESS: Shared secrets MATCH! Handshake flow works correctly.");
    } else {
        console.log("❌ FAILURE: Shared secrets DO NOT match!");
    }
}

testHandshakeFlow();
